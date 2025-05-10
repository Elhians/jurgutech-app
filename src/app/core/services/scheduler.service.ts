import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, query, where, getDocs, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { CommandType } from '../enums/command.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { CoopService } from './coop.service';
import { NotificationService } from './notification.service';

interface Schedule {
  type: 'feed' | 'clean';
  time: string; // HH:mm format
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  lastRun?: Date;
}

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private scheduleIntervals: { [key: string]: any } = {};

  constructor(
    private firestore: Firestore,
    private coopService: CoopService,
    private notificationService: NotificationService
  ) {}

  async createSchedule(coopId: string, schedule: Schedule): Promise<void> {
    const schedulesRef = collection(this.firestore, `coops/${coopId}/schedules`);
    await addDoc(schedulesRef, {
      ...schedule,
      createdAt: serverTimestamp(),
      lastRun: null
    });

    if (schedule.enabled) {
      this.startSchedule(coopId, schedule);
    }
  }

  async updateSchedule(coopId: string, scheduleId: string, updates: Partial<Schedule>): Promise<void> {
    const scheduleRef = doc(this.firestore, `coops/${coopId}/schedules/${scheduleId}`);
    await updateDoc(scheduleRef, updates);

    if ('enabled' in updates) {
      if (updates.enabled) {
        const schedule = { ...updates } as Schedule;
        this.startSchedule(coopId, schedule);
      } else {
        this.stopSchedule(coopId, scheduleId);
      }
    }
  }

  async getSchedules(coopId: string): Promise<any[]> {
    const schedulesRef = collection(this.firestore, `coops/${coopId}/schedules`);
    const q = query(schedulesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  startAllSchedules(coopId: string): void {
    this.getSchedules(coopId).then(schedules => {
      schedules.forEach(schedule => {
        if (schedule.enabled) {
          this.startSchedule(coopId, schedule);
        }
      });
    });
  }

  stopAllSchedules(coopId: string): void {
    Object.keys(this.scheduleIntervals).forEach(key => {
      if (key.startsWith(coopId)) {
        this.stopSchedule(coopId, key.split('_')[1]);
      }
    });
  }

  private startSchedule(coopId: string, schedule: Schedule): void {
    const intervalKey = `${coopId}_${schedule.type}`;
    if (this.scheduleIntervals[intervalKey]) {
      clearInterval(this.scheduleIntervals[intervalKey]);
    }

    this.scheduleIntervals[intervalKey] = setInterval(() => {
      this.checkAndExecuteSchedule(coopId, schedule);
    }, 60000); // Check every minute
  }

  private stopSchedule(coopId: string, scheduleId: string): void {
    const intervalKey = `${coopId}_${scheduleId}`;
    if (this.scheduleIntervals[intervalKey]) {
      clearInterval(this.scheduleIntervals[intervalKey]);
      delete this.scheduleIntervals[intervalKey];
    }
  }

  private async checkAndExecuteSchedule(coopId: string, schedule: Schedule): Promise<void> {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (schedule.days.includes(currentDay) && currentTime === schedule.time) {
      if (schedule.type === 'feed') {
        await this.executeFeedSchedule(coopId);
      } else if (schedule.type === 'clean') {
        await this.executeCleanSchedule(coopId);
      }

      // Update last run time
      const schedulesRef = collection(this.firestore, `coops/${coopId}/schedules`);
      const q = query(
        schedulesRef,
        where('type', '==', schedule.type),
        where('time', '==', schedule.time)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const scheduleDoc = snapshot.docs[0];
        await updateDoc(doc(schedulesRef, scheduleDoc.id), {
          lastRun: serverTimestamp()
        });
      }
    }
  }

  private async executeFeedSchedule(coopId: string): Promise<void> {
    await this.coopService.sendCommand(coopId, CommandType.FILLFOOD);
    await this.notificationService.createNotification(
      coopId,
      '🥜 Distribution automatique de nourriture effectuée',
      NotificationType.INFO
    );
  }

  private async executeCleanSchedule(coopId: string): Promise<void> {
    await this.coopService.sendCommand(coopId, CommandType.CLEAN);
    await this.notificationService.createNotification(
      coopId,
      '🧹 Nettoyage automatique effectué',
      NotificationType.INFO
    );
  }

  async getNextScheduledTasks(coopId: string): Promise<{ type: string; nextRun: Date }[]> {
    const schedules = await this.getSchedules(coopId);
    const now = new Date();
    const nextTasks: { type: string; nextRun: Date }[] = [];

    schedules.forEach(schedule => {
      if (!schedule.enabled) return;

      const [hours, minutes] = schedule.time.split(':').map(Number);
      let nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);

      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      while (!schedule.days.includes(nextRun.getDay())) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      nextTasks.push({
        type: schedule.type,
        nextRun
      });
    });

    return nextTasks.sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  }
}