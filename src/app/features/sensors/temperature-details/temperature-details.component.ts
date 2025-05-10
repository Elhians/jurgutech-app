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
import { Thermometer } from '../../../core/models/coop.model';

@Component({
  selector: 'app-temperature-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './temperature-details.component.html',
  styleUrls: ['./temperature-details.component.scss']
})
export class TemperatureDetailsComponent implements OnInit {
  @Input() coopId!: string;

  temperatureChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Température (°C)',
      fill: true,
      tension: 0.3,
      borderColor: '#e91e63',
      backgroundColor: 'rgba(233,30,99,0.1)'
    }]
  };

  currentTemp?: number;
  thermometer: Thermometer = {
    temperature: 0,
    min: 15,
    max: 28,
    lastChanged: Timestamp.now()
  };

  constructor(private firestore: Firestore, private location: Location) {}

  async ngOnInit() {
    await this.loadTemperatureHistory();
    await this.loadThermometer();
    this.checkAutoActions();
  }

  async loadTemperatureHistory() {
    const q = query(
      collection(this.firestore, `coops/${this.coopId}/thermometer`),
      orderBy('lastChanged')
    );
    const snap = await getDocs(q);

    const labels: string[] = [];
    const values: number[] = [];

    snap.forEach(doc => {
      const data = doc.data() as Thermometer;
      labels.push(data.lastChanged.toDate().toLocaleString());
      values.push(data.temperature);
    });

    this.currentTemp = values.at(-1);
    this.temperatureChartData.labels = labels;
    this.temperatureChartData.datasets[0].data = values;
  }

  async loadThermometer() {
    const ref = doc(this.firestore, `coops/${this.coopId}/thermometer/current`);
    const snapshot = await firstValueFrom(docData(ref));
    if (snapshot) this.thermometer = snapshot as Thermometer;
  }

  async saveThermometer() {
    const ref = doc(this.firestore, `coops/${this.coopId}/thermometer/current`);
    await setDoc(ref, { 
      ...this.thermometer,
      lastChanged: Timestamp.now()
    });
  }

  async checkAutoActions() {
    if (!this.currentTemp) return;

    if (this.currentTemp < this.thermometer.min || this.currentTemp > this.thermometer.max) {
      await this.sendNotification(
        `Température anormale: ${this.currentTemp}°C`,
        NotificationType.WARNING
      );

      const command = new Command({
        command: this.currentTemp > this.thermometer.max ? CommandType.STARTFAN : CommandType.STOPFAN,
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