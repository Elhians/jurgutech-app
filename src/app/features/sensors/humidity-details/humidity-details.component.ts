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
import { HumiditySensor } from '../../../core/models/coop.model';

@Component({
  selector: 'app-humidity-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './humidity-details.component.html',
  styleUrls: ['./humidity-details.component.scss']
})
export class HumidityDetailsComponent implements OnInit {
  @Input() coopId!: string;

  humidityChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Humidité (%)',
      fill: true,
      tension: 0.3,
      borderColor: '#03a9f4',
      backgroundColor: 'rgba(3,169,244,0.1)'
    }]
  };

  currentHumidity?: number;
  humiditySensor: HumiditySensor = {
    humidity: 0,
    max: 70,
    lastChanged: Timestamp.now()
  };

  constructor(private firestore: Firestore, private location: Location) {}

  async ngOnInit() {
    await this.loadHumidityHistory();
    await this.loadHumiditySensor();
    this.checkAutoActions();
  }

  async loadHumidityHistory() {
    const q = query(
      collection(this.firestore, `coops/${this.coopId}/humiditySensor`),
      orderBy('lastChanged')
    );
    const snap = await getDocs(q);

    const labels: string[] = [];
    const values: number[] = [];

    snap.forEach(doc => {
      const data = doc.data() as HumiditySensor;
      labels.push(data.lastChanged.toDate().toLocaleString());
      values.push(data.humidity);
    });

    this.currentHumidity = values.at(-1);
    this.humidityChartData.labels = labels;
    this.humidityChartData.datasets[0].data = values;
  }

  async loadHumiditySensor() {
    const ref = doc(this.firestore, `coops/${this.coopId}/humiditySensor/current`);
    const snapshot = await firstValueFrom(docData(ref));
    if (snapshot) this.humiditySensor = snapshot as HumiditySensor;
  }

  async saveHumiditySensor() {
    const ref = doc(this.firestore, `coops/${this.coopId}/humiditySensor/current`);
    await setDoc(ref, { ...this.humiditySensor });
  }

  async checkAutoActions() {
    if (!this.currentHumidity) return;

    if (this.currentHumidity > this.humiditySensor.max) {
      await this.sendNotification(
        `Humidité élevée: ${this.currentHumidity}%`,
        NotificationType.WARNING
      );

      const command = new Command({
        command: CommandType.STARTFAN,
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
