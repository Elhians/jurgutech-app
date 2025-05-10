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
import { AmmoniaSensor } from '../../../core/models/coop.model';

@Component({
  selector: 'app-ammonia-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './ammonia-details.component.html',
  styleUrls: ['./ammonia-details.component.scss']
})
export class AmmoniaDetailsComponent implements OnInit {
  @Input() coopId!: string;

  ammoniaChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Niveau d\'ammoniac (ppm)',
      fill: true,
      tension: 0.3,
      borderColor: '#9c27b0',
      backgroundColor: 'rgba(156,39,176,0.1)'
    }]
  };

  currentLevel?: number;
  threshold: AmmoniaSensor = {
    ammonia: 0,
    max: 25, // 25ppm is typically the maximum safe level
    lastChanged: Timestamp.now()
  };

  dangerLevels = {
    warning: 15, // Start warning at 15ppm
    danger: 25,  // Critical at 25ppm
    emergency: 35 // Emergency ventilation needed
  };

  constructor(private firestore: Firestore, private location: Location) {}

  async ngOnInit() {
    await this.loadAmmoniaHistory();
    await this.loadThreshold();
    this.checkAutoActions();
    this.monitorAmmonia();
  }

  async loadAmmoniaHistory() {
    const q = query(
      collection(this.firestore, `coops/${this.coopId}/ammoniaSensor`),
      orderBy('lastChanged')
    );
    const snap = await getDocs(q);

    const labels: string[] = [];
    const values: number[] = [];

    snap.forEach(doc => {
      const data = doc.data() as AmmoniaSensor;
      labels.push(data.lastChanged.toDate().toLocaleString());
      values.push(data.ammonia);
    });

    this.currentLevel = values.at(-1);
    this.ammoniaChartData.labels = labels;
    this.ammoniaChartData.datasets[0].data = values;
  }

  async loadThreshold() {
    const ref = doc(this.firestore, `coops/${this.coopId}/ammoniaSensor/current`);
    const snapshot = await firstValueFrom(docData(ref));
    if (snapshot) this.threshold = snapshot as AmmoniaSensor;
  }

  async saveThreshold() {
    const ref = doc(this.firestore, `coops/${this.coopId}/ammoniaSensor/current`);
    await setDoc(ref, { ...this.threshold });
  }

  getLevelStatus(): 'normal' | 'warning' | 'danger' | 'emergency' {
    if (!this.currentLevel) return 'normal';
    if (this.currentLevel >= this.dangerLevels.emergency) return 'emergency';
    if (this.currentLevel >= this.dangerLevels.danger) return 'danger';
    if (this.currentLevel >= this.dangerLevels.warning) return 'warning';
    return 'normal';
  }

  async checkAutoActions() {
    if (!this.currentLevel) return;

    const status = this.getLevelStatus();
    if (status !== 'normal') {
      const notificationType = status === 'emergency' ? NotificationType.CRITICAL : 
                              status === 'danger' ? NotificationType.WARNING : 
                              NotificationType.INFO;
      
      await this.sendNotification(
        `Niveau d'ammoniac ${status}: ${this.currentLevel}ppm`,
        notificationType
      );

      if (status === 'emergency' || status === 'danger') {
        const command = new Command({
          command: CommandType.EMERGENCY,
          coopId: this.coopId,
          userId: 'system',
          sentAt: Timestamp.now()
        });

        const cmdRef = doc(this.firestore, `coops/${this.coopId}/commands/${command.id}`);
        await setDoc(cmdRef, command);
      }
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

  monitorAmmonia() {
    setInterval(() => {
      this.checkAutoActions();
    }, 60000); // Check every minute
  }

  goBack() {
    this.location.back();
  }
}
