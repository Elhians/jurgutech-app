import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, orderBy, getDocs, docData, doc, setDoc } from '@angular/fire/firestore';
import { addDoc, Timestamp } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';
import { Location } from '@angular/common';
import { CommandType } from '../../../core/enums/command.enum';
import { NotificationType } from '../../../core/enums/notification-type.enum';
import { Command } from '../../../core/models/user-coop-command';
import { Notification } from '../../../core/models/notification.model';
import { WaterTrough } from '../../../core/models/coop.model';

@Component({
  selector: 'app-water-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './water-details.component.html',
  styleUrls: ['./water-details.component.scss']
})
export class WaterDetailsComponent implements OnInit {
  @Input() coopId!: string;

  waterChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Niveau d\'eau (%)',
      fill: true,
      tension: 0.3,
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33,150,243,0.1)'
    }]
  };

  currentLevel?: number;
  waterTrough: WaterTrough = {
    level: 0,
    min: 20,
    lastFilled: Timestamp.now()
  };

  constructor(private firestore: Firestore, private location: Location) {}

  async ngOnInit() {
    await this.loadWaterHistory();
    await this.loadWaterTrough();
    this.checkAutoActions();
  }

  async loadWaterHistory() {
    const q = query(
      collection(this.firestore, `coops/${this.coopId}/waterTrough`),
      orderBy('lastFilled')
    );
    const snap = await getDocs(q);

    const labels: string[] = [];
    const values: number[] = [];

    snap.forEach(doc => {
      const data = doc.data() as WaterTrough;
      labels.push(data.lastFilled.toDate().toLocaleString());
      values.push(data.level);
    });

    this.currentLevel = values.at(-1);
    this.waterChartData.labels = labels;
    this.waterChartData.datasets[0].data = values;
  }

  async loadWaterTrough() {
    const ref = doc(this.firestore, `coops/${this.coopId}/waterTrough/current`);
    const snapshot = await firstValueFrom(docData(ref));
    if (snapshot) this.waterTrough = snapshot as WaterTrough;
  }

  async saveWaterTrough() {
    const ref = doc(this.firestore, `coops/${this.coopId}/waterTrough/current`);
    await setDoc(ref, { 
      ...this.waterTrough,
      lastFilled: Timestamp.now()
    });
  }

  async checkAutoActions() {
    if (!this.currentLevel) return;

    if (this.currentLevel < this.waterTrough.min) {
      await this.sendNotification(
        `Niveau d'eau bas: ${this.currentLevel}%`,
        NotificationType.WARNING
      );

      const command = new Command({
        command: CommandType.FILLWATER,
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

  goBack() {
    this.location.back();
  }
}
