import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CoopService } from '../../../../core/services/coop.service';
import { MatDialog } from '@angular/material/dialog';
import { CommandType } from '../../../../core/enums/command.enum';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { Coop } from '../../../../core/models/coop.model';
import { VideoModalComponent } from '../../../video-modal/video-modal.component';

interface Camera {
  id: string;
  location: string;
  streamUrl: string;
}

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
  ],
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {
  coopId: string = '';
  private coopSubscription?: Subscription;
  private sensorSubscription?: Subscription;
  private camerasSubscription?: Subscription;

  coop = new Coop();
  cameras: Camera[] = [];

  constructor(
    private route: ActivatedRoute,
    private coopService: CoopService,
    private monitoringService: MonitoringService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.coopId = this.route.snapshot.paramMap.get('id') || '';
    if (this.coopId) {
      this.loadCoopData();
      this.loadCameras();
    }
  }

  ngOnDestroy(): void {
    this.coopSubscription?.unsubscribe();
    this.sensorSubscription?.unsubscribe();
    this.camerasSubscription?.unsubscribe();
  }

  private loadCoopData(): void {
    this.coopSubscription = this.coopService.getCoopById(this.coopId)
      .subscribe(coop => {
        if (coop) {
          this.coop = new Coop(coop);
        }
      });

    this.sensorSubscription = this.monitoringService.sensorData$
      .subscribe(data => {
        if (data) {
          this.coop = new Coop({
            ...this.coop,
            ...data
          });
        }
      });
  }

  private loadCameras(): void {
    this.camerasSubscription = this.coopService.getCoopCameras(this.coopId)
      .subscribe(cameras => {
        this.cameras = cameras.map(camera => ({
          id: camera['id'],
          location: camera['location'],
          streamUrl: camera['streamUrl']
        }));
      });
  }

  openCamera(camera: Camera): void {
    this.dialog.open(VideoModalComponent, {
      data: {
        streamUrl: camera.streamUrl,
        location: camera.location
      },
      width: '80%',
      height: '80%',
      panelClass: 'video-dialog'
    });
  }

  async startSystem(): Promise<void> {
    try {
      await this.coopService.sendCommand(this.coopId, CommandType.START);
      this.showNotification('Système en cours de démarrage...');
    } catch (error) {
      this.showNotification('Erreur lors du démarrage du système');
    }
  }

  async stopSystem(): Promise<void> {
    try {
      await this.coopService.sendCommand(this.coopId, CommandType.STOP);
      this.showNotification('Arrêt du système en cours...');
    } catch (error) {
      this.showNotification('Erreur lors de l\'arrêt du système');
    }
  }

  async toggleVent(): Promise<void> {
    try {
      const command = this.coop.fan.isOn ? CommandType.STOPFAN : CommandType.STARTFAN;
      await this.coopService.sendCommand(this.coopId, command);
      this.showNotification(`Ventilateur ${this.coop.fan.isOn ? 'arrêté' : 'démarré'}`);
    } catch (error) {
      this.showNotification('Erreur lors de la commande du ventilateur');
    }
  }

  async refillWater(): Promise<void> {
    try {
      await this.coopService.sendCommand(this.coopId, CommandType.FILLWATER);
      this.showNotification('Remplissage d\'eau en cours...');
    } catch (error) {
      this.showNotification('Erreur lors du remplissage d\'eau');
    }
  }

  async refillFood(): Promise<void> {
    try {
      await this.coopService.sendCommand(this.coopId, CommandType.FILLFOOD);
      this.showNotification('Distribution de nourriture en cours...');
    } catch (error) {
      this.showNotification('Erreur lors de la distribution de nourriture');
    }
  }

  async cleanCoop(): Promise<void> {
    try {
      await this.coopService.sendCommand(this.coopId, CommandType.CLEAN);
      this.showNotification('Nettoyage en cours...');
    } catch (error) {
      this.showNotification('Erreur lors du nettoyage');
    }
  }

  viewTemperatureDetails(): void {
    this.router.navigate(['/coop/sensors/temperature-details'], { queryParams: { coopId: this.coopId } });
  }

  viewHumidityDetails(): void {
    this.router.navigate(['/coop/sensors/humidity-details'], { queryParams: { coopId: this.coopId } });
  }

  viewWaterDetails(): void {
    this.router.navigate(['/coop/sensors/water-details'], { queryParams: { coopId: this.coopId } });
  }

  viewFoodDetails(): void {
    this.router.navigate(['/coop/sensors/food-details'], { queryParams: { coopId: this.coopId } });
  }

  viewAmmoniaDetails(): void {
    this.router.navigate(['/coop/sensors/ammonia-details'], { queryParams: { coopId: this.coopId } });
  }

  viewBatteryDetails(): void {
    this.router.navigate(['/coop/sensors/battery-details'], { queryParams: { coopId: this.coopId } });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
