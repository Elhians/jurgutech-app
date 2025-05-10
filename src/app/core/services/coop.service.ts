import {
  Firestore, collection, query, where, getDocs, updateDoc, doc, docData, 
  arrayUnion, serverTimestamp, collectionData, addDoc, orderBy, limit, onSnapshot, getDoc, setDoc
} from '@angular/fire/firestore';
import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Observable, from, map } from 'rxjs';
import { CommandType } from '../enums/command.enum';
import { Status } from '../enums/status.enum';
import { Command } from '../models/user-coop-command';
import { NotificationService } from './notification.service';
import { Panne, ComponentType, SeverityLevel } from '../models/panne.model';
import { NotificationType } from '../enums/notification-type.enum';
import { Coop } from '../models/coop.model';
import { DocumentData } from '@angular/fire/firestore';

// Define the structure of a coop document
@Injectable({ providedIn: 'root' })
export class CoopService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private notificationService = inject(NotificationService);

  async linkCoopByCode(code: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const ref = collection(this.firestore, 'coops');
    const q = query(ref, where('accessCode', '==', code));
    const result = await getDocs(q);

    if (result.empty) throw new Error('Aucun poulailler trouvé avec ce code');

    const coopDoc = result.docs[0];
    const coopRef = doc(this.firestore, `coops/${coopDoc.id}`);
    const coopData = coopDoc.data() as Coop;

    // Check if the coop already has an owner
    if (!coopData.ownerId) {
      // Assign the current user as the owner and admin
      await updateDoc(coopRef, {
        ownerId: user.uid,
        qrUsed: false
      });

      // Add user authorization with ADMIN role
      const authRef = doc(this.firestore, `coops/${coopDoc.id}/authorisations/${user.uid}`);
      await setDoc(authRef, {
        role: 'ADMIN',
        assignedAt: serverTimestamp()
      });
    } else {
      // Check if user is already authorized
      const authRef = doc(this.firestore, `coops/${coopDoc.id}/authorisations/${user.uid}`);
      const authDoc = await getDoc(authRef);
      
      if (!authDoc.exists()) {
        throw new Error(`Vous n'êtes pas autorisé à accéder à ce poulailler.`);
      }

      // Update the coop to mark the QR code as used
      await updateDoc(coopRef, {
        qrUsed: false
      });
    }
  }

  getUserCoops(uid: string): Observable<any[]> {
    const ref = collection(this.firestore, 'coops');
    const q = query(ref, where('authorizedUsers', 'array-contains', uid));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  getLatestSensorData(coopId: string): Observable<any> {
    const ref = doc(this.firestore, `coops/${coopId}/sensorData/latest`);
    return docData(ref);
  }

  async sendCommand(coopId: string, commandType: CommandType): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const command = new Command({
      command: commandType,
      status: Status.PENDING,
      coopId: coopId,
      userId: user.uid
    });

    const commandRef = collection(this.firestore, `coops/${coopId}/commands`);
    await addDoc(commandRef, {
      ...command,
      sentAt: serverTimestamp()
    });

    // Start monitoring command status
    this.monitorCommandStatus(coopId, command);
  }

  private monitorCommandStatus(coopId: string, command: Command): void {
    const commandsRef = collection(this.firestore, `coops/${coopId}/commands`);
    const q = query(
      commandsRef,
      where('command', '==', command.command),
      where('userId', '==', command.userId),
      orderBy('sentAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const latestCommand = snapshot.docs[0].data() as Command;
        
        if (latestCommand.status === Status.FAILED) {
          await this.handleCommandFailure(coopId, latestCommand);
          unsubscribe();
        } else if (latestCommand.status === Status.SUCCESS) {
          unsubscribe();
        }
      }
    });
  }

  private async handleCommandFailure(coopId: string, command: Command): Promise<void> {
    let errorMessage = 'Erreur lors de l\'exécution de la commande';
    
    switch (command.command) {
      case CommandType.STARTFAN:
        errorMessage = '⚠️ Le ventilateur ne démarre pas - Vérification nécessaire';
        break;
      case CommandType.FILLWATER:
        errorMessage = '⚠️ Échec du remplissage d\'eau - Vérifier le système';
        break;
      case CommandType.FILLFOOD:
        errorMessage = '⚠️ Échec de la distribution de nourriture';
        break;
      case CommandType.CLEAN:
        errorMessage = '⚠️ Le système de nettoyage ne répond pas';
        break;
    }

    await this.notificationService.createNotification(coopId, errorMessage, NotificationType.CRITICAL);
    await this.recordSystemFault(coopId, command);
  }

  private async recordSystemFault(coopId: string, command: Command): Promise<void> {
    const component = this.getComponentFromCommand(command.command);
    const panne = new Panne({
      coopId,
      component,
      command: command.command,
      description: this.getFaultDescription(command.command),
      severity: this.getSeverityLevel(command.command),
      resolved: false
    });

    const faultsRef = collection(this.firestore, `coops/${coopId}/faults`);
    await addDoc(faultsRef, {
      ...panne,
      timestamp: serverTimestamp()
    });
  }

  private getComponentFromCommand(command: CommandType): ComponentType {
    switch (command) {
      case CommandType.STARTFAN:
      case CommandType.STOPFAN:
        return 'ventilation';
      case CommandType.CLEAN:
        return 'cleaning';
      case CommandType.FILLFOOD:
        return 'food';
      case CommandType.FILLWATER:
        return 'water';
      default:
        return 'system';
    }
  }

  private getFaultDescription(command: CommandType): string {
    switch (command) {
      case CommandType.STARTFAN:
        return 'Le ventilateur ne démarre pas - Possible blocage mécanique';
      case CommandType.STOPFAN:
        return 'Le ventilateur ne s\'arrête pas - Possible problème électrique';
      case CommandType.CLEAN:
        return 'Le système de nettoyage ne répond pas - Vérifier mécanisme';
      case CommandType.FILLFOOD:
        return 'Distribution de nourriture impossible - Vérifier réserve et mécanisme';
      case CommandType.FILLWATER:
        return 'Remplissage d\'eau impossible - Vérifier réserve et tuyauterie';
      default:
        return 'Erreur système indéterminée';
    }
  }

  private getSeverityLevel(command: CommandType): SeverityLevel {
    switch (command) {
      case CommandType.STARTFAN:
      case CommandType.FILLWATER:
        return 'ERROR'; // Critical for temperature and water
      default:
        return 'WARNING';
    }
  }

  async updateStatus(coopId: string, field: string, value: any): Promise<void> {
    const coopRef = doc(this.firestore, `coops/${coopId}`);
    await updateDoc(coopRef, { [field]: value });
  }

  async refillResource(coopId: string, resource: 'water' | 'food'): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const resourceType = resource === 'water' ? 'waterTrough' : 'feeder';
    const resourceRef = doc(this.firestore, `coops/${coopId}/${resourceType}/current`);
    
    const updateData = {
      level: 100,
      lastFilled: serverTimestamp()
    };

    await updateDoc(resourceRef, updateData);

    // Create a command record for the refill action
    const command = new Command({
      command: resource === 'water' ? CommandType.FILLWATER : CommandType.FILLFOOD,
      status: Status.SUCCESS,
      coopId: coopId,
      userId: user.uid
    });

    const commandRef = collection(this.firestore, `coops/${coopId}/commands`);
    await addDoc(commandRef, {
      ...command,
      sentAt: serverTimestamp()
    });
  }

  async markCleaned(coopId: string): Promise<void> {
    const coopRef = doc(this.firestore, `coops/${coopId}`);
    await updateDoc(coopRef, { lastCleaned: serverTimestamp() });
  }

  getCoopById(coopId: string): Observable<any> {
    const coopRef = doc(this.firestore, `coops/${coopId}`);
    return docData(coopRef);
  }

  getFaults(coopId: string): Observable<Panne[]> {
    const faultsRef = collection(this.firestore, `coops/${coopId}/faults`);
    const q = query(faultsRef, where('resolved', '==', false), orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(faults => faults.map(fault => new Panne(fault)))
    );
  }

  async resolveFault(coopId: string, faultId: string): Promise<void> {
    const faultRef = doc(this.firestore, `coops/${coopId}/faults/${faultId}`);
    await updateDoc(faultRef, {
      resolved: true,
      resolvedAt: serverTimestamp()
    });

    await this.notificationService.createNotification(
      coopId,
      '✅ Panne résolue et système vérifié',
      NotificationType.INFO
    );
  }

  getCoopCameras(coopId: string): Observable<DocumentData[]> {
    const camerasRef = collection(this.firestore, `coops/${coopId}/camera`);
    return collectionData(camerasRef);
  }
}


