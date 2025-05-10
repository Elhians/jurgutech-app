import { Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, getDocs, docData, doc, setDoc, onSnapshot, updateDoc, serverTimestamp, CollectionReference, DocumentData, FieldValue, addDoc } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { NotificationService } from './notification.service';
import { NotificationType } from '../enums/notification-type.enum';
import { CommandType } from '../enums/command.enum';
import { 
  Fan, 
  Thermometer, 
  HumiditySensor, 
  WaterTrough, 
  Feeder, 
  Battery, 
  CleaningSystem, 
  FoodReserve, 
  WaterReserve 
} from '../models/coop.model';
import { Command } from '../models/user-coop-command';
import { Status } from '../enums/status.enum';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';

type SensorData = Fan | Thermometer | HumiditySensor | WaterTrough | Feeder | Battery | CleaningSystem | FoodReserve | WaterReserve;

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private sensorState = new BehaviorSubject<Record<string, SensorData> | null>(null);
  sensorData$ = this.sensorState.asObservable();
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private notificationService = inject(NotificationService);

  startMonitoring(coopId: string): void {
    // Monitor fan state
    this.monitorSubcollection(coopId, 'fan');
    // Monitor thermometer
    this.monitorSubcollection(coopId, 'thermometer');
    // Monitor humidity sensor
    this.monitorSubcollection(coopId, 'humiditySensor');
    // Monitor water trough
    this.monitorSubcollection(coopId, 'waterTrough');
    // Monitor feeder
    this.monitorSubcollection(coopId, 'feeder');
    // Monitor food reservoir
    this.monitorSubcollection(coopId, 'foodReservoir');
    // Monitor water reservoir
    this.monitorSubcollection(coopId, 'waterReservoir');
    // Monitor battery if exists
    this.monitorSubcollection(coopId, 'battery');
    // Monitor cleaning system if exists
    this.monitorSubcollection(coopId, 'cleaningSystem');
  }

  private monitorSubcollection(coopId: string, subcollection: string): void {
    const ref = doc(this.firestore, `coops/${coopId}/${subcollection}/current`);
    onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const currentState = this.sensorState.value || {};
        this.sensorState.next({
          ...currentState,
          [subcollection]: snapshot.data() as SensorData
        });
        this.checkThresholds(coopId);
      }
    });
  }

  private async checkThresholds(coopId: string): Promise<void> {
    const currentState = this.sensorState.value;
    if (!currentState) return;

    // Temperature checks
    const thermometer = currentState['thermometer'] as Thermometer;
    if (thermometer?.temperature !== undefined && thermometer.max !== undefined) {
      if (thermometer.temperature > thermometer.max) {
        await this.notificationService.createNotification(
          coopId,
          `🌡️ Température élevée (${thermometer.temperature}°C)`,
          NotificationType.WARNING
        );
      }
    }

    // Humidity checks
    const humiditySensor = currentState['humiditySensor'] as HumiditySensor;
    if (humiditySensor?.humidity !== undefined && humiditySensor.max !== undefined) {
      if (humiditySensor.humidity > humiditySensor.max) {
        await this.notificationService.createNotification(
          coopId,
          `💧 Humidité élevée (${humiditySensor.humidity}%)`,
          NotificationType.WARNING
        );
      }
    }

    // Water trough checks
    const waterTrough = currentState['waterTrough'] as WaterTrough;
    if (waterTrough?.level !== undefined && waterTrough.min !== undefined) {
      if (waterTrough.level < waterTrough.min) {
        await this.notificationService.createNotification(
          coopId,
          `💧 Niveau d'eau bas (${waterTrough.level}%)`,
          NotificationType.WARNING
        );
      }
    }

    // Feeder checks
    const feeder = currentState['feeder'] as Feeder;
    if (feeder?.level !== undefined && feeder.min !== undefined && feeder.isUsingThreshold) {
      if (feeder.level < feeder.min) {
        await this.notificationService.createNotification(
          coopId,
          `🍽️ Niveau de nourriture bas (${feeder.level}%)`,
          NotificationType.WARNING
        );
      }
    }
  }

  private async checkSystemStatus(coopId: string, coopData: any): Promise<void> {
    // Check battery status if the coop has a battery
    if (coopData.haveBattery && this.sensorState.value?.['battery']) {
      const battery = this.sensorState.value['battery'] as Battery;
      if (battery.level < 20) {
        await this.notificationService.createNotification(
          coopId,
          `🔋 Batterie faible (${battery.level}%)`,
          NotificationType.CRITICAL
        );
      } else if (battery.level < 30) {
        await this.notificationService.createNotification(
          coopId,
          `🔋 Niveau de batterie bas (${battery.level}%)`,
          NotificationType.WARNING
        );
      }
    }

    // Check cleaning system if the coop has one
    if (coopData.haveCleanSys && this.sensorState.value?.['cleaningSystem']) {
      const cleaningSystem = this.sensorState.value['cleaningSystem'] as CleaningSystem;
      const lastCleaned = cleaningSystem.lastCleaned.toDate();
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastCleaned.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= cleaningSystem.intervalDay) {
        await this.notificationService.createNotification(
          coopId,
          `🧹 Nettoyage nécessaire (Dernier: ${diffDays} jours)`,
          NotificationType.WARNING
        );
      }
    }
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
  }

  async updateSensorData(coopId: string, subcollection: string, data: SensorData): Promise<void> {
    const sensorRef = doc(this.firestore, `coops/${coopId}/${subcollection}/current`);
    
    let updateData: any = {};

    switch (subcollection) {
      case 'fan':
        updateData = {
          isOn: (data as Fan).isOn,
          lastChanged: serverTimestamp()
        };
        break;

      case 'thermometer':
        updateData = {
          temperature: (data as Thermometer).temperature,
          min: (data as Thermometer).min,
          max: (data as Thermometer).max,
          lastChanged: serverTimestamp()
        };
        break;

      case 'humiditySensor':
        updateData = {
          humidity: (data as HumiditySensor).humidity,
          max: (data as HumiditySensor).max,
          lastChanged: serverTimestamp()
        };
        break;

      case 'waterTrough':
        updateData = {
          level: (data as WaterTrough).level,
          min: (data as WaterTrough).min,
          lastFilled: serverTimestamp()
        };
        break;

      case 'feeder':
        updateData = {
          level: (data as Feeder).level,
          min: (data as Feeder).min,
          isUsingThreshold: (data as Feeder).isUsingThreshold,
          lastFilled: serverTimestamp()
        };
        break;

      case 'battery':
        updateData = {
          level: (data as Battery).level
        };
        break;

      case 'cleaningSystem':
        updateData = {
          lastCleaned: serverTimestamp(),
          intervalDay: (data as CleaningSystem).intervalDay
        };
        break;

      case 'waterReservoir':
        updateData = {
          level: (data as WaterReserve).currentLevel,
          capacity: (data as WaterReserve).capacity
        };
        break;

      case 'foodReservoir':
        updateData = {
          level: (data as FoodReserve).currentLevel,
          capacity: (data as FoodReserve).capacity
        };
        break;

      default:
        throw new Error(`Unknown sensor type: ${subcollection}`);
    }

    await updateDoc(sensorRef, updateData);
  }
}
