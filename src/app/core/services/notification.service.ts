import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, serverTimestamp, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { NotificationType } from '../enums/notification-type.enum';
import { Notification } from '../models/notification.model';
import { Coop } from '../models/coop.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private firestore: Firestore) {}

  getNotifications(coopId: string): Observable<Notification[]> {
    const ref = collection(this.firestore, `coops/${coopId}/notifications`);
    const q = query(ref, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Notification[]>;
  }

  async createNotification(coopId: string, message: string, type: NotificationType): Promise<void> {
    const ref = collection(this.firestore, `coops/${coopId}/notifications`);
    await addDoc(ref, {
      message,
      type,
      createdAt: serverTimestamp(),
      isRead: false,
      coopId
    });
  }

  async markAsRead(coopId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(this.firestore, `coops/${coopId}/notifications/${notificationId}`);
    await updateDoc(notificationRef, { isRead: true });
  }

  // Intelligent notification generation based on coop status
  async checkCoopStatus(coop: Coop): Promise<void> {
    // Check temperature
    if (coop.isTemperatureOutOfRange()) {
      const message = coop.thermometer.temperature > coop.thermometer.max
        ? `🌡️ Température trop élevée (${coop.thermometer.temperature}°C) > ventilateur déclenché`
        : `❄️ Température trop basse (${coop.thermometer.temperature}°C)`;
      await this.createNotification(coop.id, message, NotificationType.WARNING);
    }

    // Check humidity
    if (coop.isHumidityTooHigh()) {
      await this.createNotification(
        coop.id,
        `💧 Humidité trop élevée (${coop.humiditySensor.humidity}%) > ventilation activée`,
        NotificationType.WARNING
      );
    }

    // Check water level
    if (coop.needsWaterRefill()) {
      await this.createNotification(
        coop.id,
        `🚰 Niveau d'eau bas (${coop.waterTrough.level}%) - Remplissage nécessaire`,
        NotificationType.CRITICAL
      );
    }

    // Check food level
    if (coop.needsFoodRefill()) {
      await this.createNotification(
        coop.id,
        `🥜 Niveau de nourriture bas (${coop.feeder.level}%) - Remplissage nécessaire`,
        NotificationType.WARNING
      );
    }

    // Check cleaning system
    if (coop.needsCleaning()) {
      const lastCleaned = coop.cleaningSystem?.lastCleaned.toDate();
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastCleaned!.getTime()) / (1000 * 60 * 60 * 24));
      
      await this.createNotification(
        coop.id,
        `🧹 Nettoyage nécessaire - Dernier nettoyage il y a ${diffDays} jours`,
        NotificationType.INFO
      );
    }

    // Check battery if present
    if (coop.haveBattery && coop.battery && coop.battery.level < 20) {
      await this.createNotification(
        coop.id,
        `🔋 Batterie faible (${coop.battery.level}%) - Recharge nécessaire`,
        NotificationType.CRITICAL
      );
    }
  }
}