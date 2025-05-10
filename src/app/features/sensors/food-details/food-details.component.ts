import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, orderBy, getDocs, docData, doc, setDoc, writeBatch } from '@angular/fire/firestore';
import { addDoc, Timestamp } from 'firebase/firestore';
import { firstValueFrom, Observable, take, map } from 'rxjs';
import { Location } from '@angular/common';
import { CommandType } from '../../../core/enums/command.enum';
import { NotificationType } from '../../../core/enums/notification-type.enum';
import { Command } from '../../../core/models/user-coop-command';
import { Notification } from '../../../core/models/notification.model';
import { Feeder, FeedMoment } from '../../../core/models/coop.model';
import { collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-food-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './food-details.component.html',
  styleUrls: ['./food-details.component.scss']
})
export class FoodDetailsComponent implements OnInit {
  @Input() coopId!: string;
  newFeedTime: string = '12:00'; // Default time for new feed moments
  feedMoments$!: Observable<FeedMoment[]>;

  foodChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Niveau de nourriture (%)',
      fill: true,
      tension: 0.3,
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76,175,80,0.1)'
    }]
  };

  currentLevel?: number;
  feeder: Feeder = {
    level: 0,
    min: 20,
    isUsingThreshold: false,
    lastFilled: Timestamp.now()
  };

  constructor(private firestore: Firestore, private location: Location) {}

  ngOnInit() {
    this.loadFoodHistory();
    this.loadFeeder();
    this.feedMoments$ = collectionData(
      collection(this.firestore, `coops/${this.coopId}/feedMoments`),
      { idField: 'id' }
    ).pipe(
      map((moments: any[]) =>
        moments
          .filter((m: any) => m.enabled)
          .sort((a: any, b: any) => a.mealTime.seconds - b.mealTime.seconds)
      )
    );
    this.checkAutoActions();
  }

  async loadFoodHistory() {
    const q = query(
      collection(this.firestore, `coops/${this.coopId}/feeder`),
      orderBy('lastFilled')
    );
    const snap = await getDocs(q);

    const labels: string[] = [];
    const values: number[] = [];

    snap.forEach(doc => {
      const data = doc.data() as Feeder;
      labels.push(data.lastFilled.toDate().toLocaleString());
      values.push(data.level);
    });

    this.currentLevel = values.at(-1);
    this.foodChartData.labels = labels;
    this.foodChartData.datasets[0].data = values;
  }

  async loadFeeder() {
    const ref = doc(this.firestore, `coops/${this.coopId}/feeder/current`);
    const snapshot = await firstValueFrom(docData(ref));
    if (snapshot) this.feeder = snapshot as Feeder;
  }

  async saveFeeder() {
    const ref = doc(this.firestore, `coops/${this.coopId}/feeder/current`);
    await setDoc(ref, { ...this.feeder });
    
    // If switching to threshold mode, disable all feed moments
    if (this.feeder.isUsingThreshold) {
      await this.disableAllFeedMoments();
    }
  }

  async onThresholdModeChange() {
    if (this.feeder.isUsingThreshold) {
      // When switching to threshold mode, disable all feed moments
      await this.disableAllFeedMoments();
    }
  }

  async disableAllFeedMoments() {
    this.feedMoments$.pipe(take(1)).subscribe(async (moments) => {
      const batch = writeBatch(this.firestore);
      for (const moment of moments) {
        if (moment.id) {
          const ref = doc(this.firestore, `coops/${this.coopId}/feedMoments/${moment.id}`);
          batch.update(ref, { enabled: false });
        }
      }
      await batch.commit();
    });
  }

  async addFeedMoment() {
    if (this.feeder.isUsingThreshold) return;
    // Convert 'HH:mm' to a Date object for today
    const [hours, minutes] = this.newFeedTime.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    const newMoment: FeedMoment = {
      id: '',
      mealTime: Timestamp.fromDate(now),
      enabled: true
    };
    await this.saveFeedMoment(newMoment);
    this.newFeedTime = '12:00';
  }

  async saveFeedMoment(moment: FeedMoment) {
    const ref = collection(this.firestore, `coops/${this.coopId}/feedMoments`);
    await addDoc(ref, {
      mealTime: moment.mealTime,
      enabled: moment.enabled
    });
  }

  async checkAutoActions() {
    if (!this.currentLevel || !this.feeder.isUsingThreshold) return;

    if (this.currentLevel < this.feeder.min) {
      await this.sendNotification(
        `Niveau de nourriture bas: ${this.currentLevel}%`,
        NotificationType.WARNING
      );

      const command = new Command({
        command: CommandType.FILLFOOD,
        coopId: this.coopId,
        userId: 'system',
        sentAt: Timestamp.now()
      });

      const cmdRef = doc(this.firestore, `coops/${this.coopId}/commands/${command.id}`);
      await setDoc(cmdRef, command);
    }
  }

  async sendNotification(message: string, type: NotificationType) {
    const notification: Notification = {
      message,
      type,
      createdAt: Timestamp.now(),
      isRead: false,
      coopId: this.coopId
    };

    const ref = collection(this.firestore, `coops/${this.coopId}/notifications`);
    await addDoc(ref, notification);
  }

  async removeFeedMoment(index: number, id: string) {
    if (id) {
      const ref = doc(this.firestore, `coops/${this.coopId}/feedMoments/${id}`);
      await setDoc(ref, { enabled: false }, { merge: true });
    }
  }

  goBack() {
    this.location.back();
  }
}
