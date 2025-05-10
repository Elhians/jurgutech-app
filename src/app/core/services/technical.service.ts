import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  where,
  getDocs,
  addDoc,
  DocumentData,
  getDoc,
  collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';
import { CoopService } from './coop.service';
import { Panne } from '../models/panne.model';
import { CommandType } from '../enums/command.enum';
import { NotificationType } from '../enums/notification-type.enum';

interface SystemReport {
  batteryLevel?: number;
  lastMaintenance: Date;
  systemUptime: number;
  failedCommands: number;
  successfulCommands: number;
  cleaningSystemStatus: 'OK' | 'WARNING' | 'ERROR';
  fanStatus: 'OK' | 'WARNING' | 'ERROR';
  foodSystemStatus: 'OK' | 'WARNING' | 'ERROR';
  waterSystemStatus: 'OK' | 'WARNING' | 'ERROR';
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class TechnicalService {
  constructor(
    private firestore: Firestore,
    private notificationService: NotificationService,
    private coopService: CoopService
  ) {}

  startBatteryMonitoring(coopId: string): void {
    const batteryRef = doc(this.firestore, `coops/${coopId}/sensorData/latest`);
    onSnapshot(batteryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DocumentData;
        if ('batteryLevel' in data) {
          this.checkBatteryLevel(coopId, data['batteryLevel'] as number);
        }
      }
    });
  }

  private async checkBatteryLevel(coopId: string, level: number): Promise<void> {
    if (level <= 20) {
      await this.notificationService.createNotification(
        coopId,
        `🔋 Niveau de batterie critique : ${level}% - Recharge nécessaire`,
        NotificationType.CRITICAL
      );
    } else if (level <= 30) {
      await this.notificationService.createNotification(
        coopId,
        `🔋 Batterie faible : ${level}% - Prévoir une recharge`,
        NotificationType.WARNING
      );
    }
  }

  async generateSystemReport(coopId: string): Promise<SystemReport> {
    const report: SystemReport = {
      lastMaintenance: new Date(),
      systemUptime: await this.calculateUptime(coopId),
      failedCommands: await this.countFailedCommands(coopId),
      successfulCommands: await this.countSuccessfulCommands(coopId),
      cleaningSystemStatus: await this.checkComponentStatus(coopId, 'cleaning'),
      fanStatus: await this.checkComponentStatus(coopId, 'fan'),
      foodSystemStatus: await this.checkComponentStatus(coopId, 'food'),
      waterSystemStatus: await this.checkComponentStatus(coopId, 'water'),
      timestamp: new Date()
    };

    // Get battery level if system has battery
    const batteryLevel = await this.getBatteryLevel(coopId);
    if (batteryLevel !== null) {
      report.batteryLevel = batteryLevel;
    }

    // Save report
    await this.saveSystemReport(coopId, report);
    return report;
  }

  private async calculateUptime(coopId: string): Promise<number> {
    const statusRef = doc(this.firestore, `coops/${coopId}/status/runtime`);
    const snapshot = await getDoc(statusRef);
    if (!snapshot.exists()) return 0;
    
    const data = snapshot.data() as DocumentData;
    const startTime = data?.['startTime']?.toDate() || new Date();
    return Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
  }

  private async countFailedCommands(coopId: string): Promise<number> {
    const commandsRef = collection(this.firestore, `coops/${coopId}/commands`);
    const q = query(commandsRef, where('status', '==', 'FAILED'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async countSuccessfulCommands(coopId: string): Promise<number> {
    const commandsRef = collection(this.firestore, `coops/${coopId}/commands`);
    const q = query(commandsRef, where('status', '==', 'SUCCESS'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async checkComponentStatus(coopId: string, component: string): Promise<'OK' | 'WARNING' | 'ERROR'> {
    const faultsRef = collection(this.firestore, `coops/${coopId}/faults`);
    const q = query(
      faultsRef,
      where('component', '==', component),
      where('resolved', '==', false),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 'OK';
    
    const latestFault = snapshot.docs[0].data() as DocumentData;
    return latestFault['severity'] || 'WARNING';
  }

  private async getBatteryLevel(coopId: string): Promise<number | null> {
    const sensorRef = doc(this.firestore, `coops/${coopId}/sensorData/latest`);
    const snapshot = await getDoc(sensorRef);
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return data?.['batteryLevel'] ?? null;
  }

  private async saveSystemReport(coopId: string, report: SystemReport): Promise<void> {
    const reportsRef = collection(this.firestore, `coops/${coopId}/systemReports`);
    await addDoc(reportsRef, {
      ...report,
      timestamp: serverTimestamp()
    });
  }

  getLatestSystemReport(coopId: string): Observable<SystemReport | null> {
    const reportsRef = collection(this.firestore, `coops/${coopId}/systemReports`);
    const q = query(reportsRef, orderBy('timestamp', 'desc'), limit(1));
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          observer.next(null);
        } else {
          const report = snapshot.docs[0].data() as SystemReport;
          observer.next(report);
        }
      });
      return () => unsubscribe();
    });
  }

  async setMaintenanceMode(coopId: string, enabled: boolean): Promise<void> {
    const coopRef = doc(this.firestore, `coops/${coopId}`);
    await updateDoc(coopRef, {
      maintenanceMode: enabled,
      lastMaintenanceDate: enabled ? serverTimestamp() : null
    });

    if (enabled) {
      await this.notificationService.createNotification(
        coopId,
        '🔧 Mode maintenance activé - Système en pause',
        NotificationType.INFO
      );
    } else {
      await this.notificationService.createNotification(
        coopId,
        '✅ Mode maintenance désactivé - Système opérationnel',
        NotificationType.INFO
      );
    }
  }

  getFaults(coopId: string): Observable<Panne[]> {
    const ref = collection(this.firestore, `coops/${coopId}/faults`);
    const q = query(ref, where('resolved', '==', false), orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Panne[]>;
  }

  async recordSystemFault(coopId: string, component: string, description: string, severity: 'WARNING' | 'ERROR'): Promise<void> {
    const ref = collection(this.firestore, `coops/${coopId}/faults`);
    await addDoc(ref, {
      component,
      description,
      severity,
      timestamp: serverTimestamp(),
      resolved: false
    });

    await this.notificationService.createNotification(
      coopId,
      `⚠️ Panne détectée: ${description}`,
      severity === 'ERROR' ? NotificationType.CRITICAL : NotificationType.WARNING
    );
  }

  async handleSystemError(coopId: string, command: CommandType): Promise<void> {
    let component: string;
    let description: string;
    let severity: 'WARNING' | 'ERROR';

    switch (command) {
      case CommandType.STARTFAN:
      case CommandType.STOPFAN:
        component = 'ventilation';
        description = 'Problème de ventilation - Vérification nécessaire';
        severity = 'ERROR';
        break;

      case CommandType.FILLWATER:
        component = 'water';
        description = 'Problème de remplissage d\'eau';
        severity = 'ERROR';
        break;

      case CommandType.FILLFOOD:
        component = 'food';
        description = 'Problème de distribution de nourriture';
        severity = 'WARNING';
        break;

      case CommandType.CLEAN:
        component = 'cleaning';
        description = 'Problème du système de nettoyage';
        severity = 'WARNING';
        break;

      default:
        component = 'system';
        description = 'Erreur système indéterminée';
        severity = 'WARNING';
    }

    await this.recordSystemFault(coopId, component, description, severity);
  }

  async handleBatteryError(coopId: string, batteryLevel: number): Promise<void> {
    if (batteryLevel < 10) {
      await this.recordSystemFault(
        coopId,
        'battery',
        'Niveau de batterie critique - Arrêt imminent',
        'ERROR'
      );
    }
  }

  async handleCleaningSystemError(coopId: string, error: string): Promise<void> {
    await this.recordSystemFault(
      coopId,
      'cleaning',
      `Erreur système de nettoyage: ${error}`,
      'WARNING'
    );
  }

  async resolveSystemFault(coopId: string, faultId: string): Promise<void> {
    const faultRef = doc(this.firestore, `coops/${coopId}/faults/${faultId}`);
    await updateDoc(faultRef, {
      resolved: true,
      resolvedAt: serverTimestamp()
    });

    await this.notificationService.createNotification(
      coopId,
      '✅ Panne résolue avec succès',
      NotificationType.INFO
    );
  }
}