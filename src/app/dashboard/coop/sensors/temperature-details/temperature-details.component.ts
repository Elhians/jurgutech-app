import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, orderBy, getDocs, docData, doc, updateDoc, setDoc } from '@angular/fire/firestore';
import { Threshold } from '../../../../shared/models/threshold.model';
import { SensorData } from '../../../../shared/models/sensor-data.model';
import { addDoc, Timestamp } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-temperature-details',
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './temperature-details.component.html',
  styleUrl: './temperature-details.component.scss'
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
  threshold: Threshold = {
    type: 'temperature',
    min: 0,
    max: 100,
    commandToSend: '',
    notify: false
  };

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.loadTemperatureHistory();
    await this.loadThreshold();
    this.checkAutoActions();
  }

  async loadTemperatureHistory() {
    const q = query(
      collection(this.firestore, `coops/${this.coopId}/sensorData`),
      orderBy('time')
    );
    const snap = await getDocs(q);

    const labels: string[] = [];
    const values: number[] = [];

    snap.forEach(doc => {
      const data = doc.data() as SensorData;
      labels.push(data.time?.toDate().toLocaleString());
      values.push(data.temperature);
    });

    this.currentTemp = values.at(-1);
    this.temperatureChartData.labels = labels;
    this.temperatureChartData.datasets[0].data = values;
  }

  async loadThreshold() {
    const ref = doc(this.firestore, `coops/${this.coopId}/thresholds/temperature`);
    const snapshot = await firstValueFrom(docData(ref));
    if (snapshot) this.threshold = snapshot as Threshold;
  }

  async saveThreshold() {
    const ref = doc(this.firestore, `coops/${this.coopId}/thresholds/temperature`);
    await setDoc(ref, { ...this.threshold });
  }

  async checkAutoActions() {
    if (!this.currentTemp || !this.threshold) return;

    if (this.currentTemp < this.threshold.min || this.currentTemp > this.threshold.max) {
      if (this.threshold.notify) {
        await this.sendNotification(`🚨 Température anormale détectée : ${this.currentTemp}°C`);
      }
      if (this.threshold.commandToSend) {
        const cmdRef = doc(this.firestore, `coops/${this.coopId}/commands/current`);
        await setDoc(cmdRef, {
          type: this.threshold.commandToSend,
          timestamp: Timestamp.now()
        });
      }
    }
  }

  async sendNotification(message: string) {
    const ref = collection(this.firestore, `coops/${this.coopId}/notifications`);
    await addDoc(ref, {
      message,
      timestamp: Timestamp.now()
    });
  }
}