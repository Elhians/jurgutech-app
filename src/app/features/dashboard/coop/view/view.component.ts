import { Component, input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoopService } from '../../../../core/services/coop.service';
import { CommonModule } from '@angular/common';
import { Firestore, doc, docData, updateDoc, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { VideoModalComponent } from '../../../video-modal/video-modal.component'; // Adjust the path as needed
import { Router } from '@angular/router';

@Component({
  selector: 'app-view',
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})

export class ViewComponent implements OnInit {
  coopId: string = '';
  coopData$: Observable<any> | undefined;
  coopData: any = { // Default values
    temperature: 0,
    humidity: 0,
    waterLevel: 0,
    foodLevel: 0,
    lastCleaned: null,
  };
  coop: any;

  cameras = [
    { streamUrl: 'https://example.com/stream1' },
    { streamUrl: 'https://example.com/stream2' },
    { streamUrl: 'https://example.com/stream3' },
    { streamUrl: 'https://example.com/stream4' }
  ];

  expandedVideoIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private coopService: CoopService,
    private snackBar: MatSnackBar,
    private location: Location, // Inject Location service
    private dialog: MatDialog, // Inject MatDialog service
    private router: Router // Inject Router service
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.coopId = id;
        this.coopService.getCoopById(id).subscribe({
          next: (coopData) => {
            this.coop = coopData; // Ensure coop is updated
          },
          error: (err) => {
            console.error('Error fetching coop data:', err);
          }
        });
        this.coopData$ = this.coopService.getLatestSensorData(id);
        this.coopData$.subscribe(data => this.coopData = data); // Resolve observable
      }
    });
  }

  showSnackbar(message: string) {
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }

  startSystem() {
    this.coopService.sendCommand(this.coopId, 'start');
    this.coopService.updateStatus(this.coopId, 'isRunning', true);
    this.showSnackbar('Système démarré');
  }

  stopSystem() {
    this.coopService.sendCommand(this.coopId, 'stop');
    this.coopService.updateStatus(this.coopId, 'isRunning', false);
    this.showSnackbar('Système arrêté');
  }

  increaseTemp() {
    const sensorRef = doc(this.firestore, `coops/${this.coopId}/sensorData/latest`);
    updateDoc(sensorRef, { temperature: (this.coop?.temperature || 20) + 1 });
    this.coopService.sendCommand(this.coopId, 'increaseTemp');
    this.showSnackbar('Température augmentée');
  }

  decreaseTemp() {
    this.showSnackbar('Température réduite');
  }

  async fillWater() {
    this.coopService.refillResource(this.coopId, 'water');
    const logRef = collection(this.firestore, `coops/${this.coopId}/sensorLogs`);
    await addDoc(logRef, {
      type: 'waterLevel',
      value: 100,
      timestamp: serverTimestamp()
    });
    this.showSnackbar("Niveau d'eau rempli");
  }

  fillFood() {
    this.coopService.refillResource(this.coopId, 'food');
    this.showSnackbar('Nourriture remplie');
  }

  cleanCoop() {
    if (!this.checkSystemRunning()) return;
    this.coopService.markCleaned(this.coopId);
    this.coopService.sendCommand(this.coopId, 'clean');
    this.showSnackbar('Nettoyage effectué');
  }

  toggleFan(on: boolean) {
    this.showSnackbar(on ? 'Ventilateur allumé' : 'Ventilateur éteint');
  }

  changeTemperature() {
    if (!this.checkSystemRunning()) return;
    const newTemperature = prompt('Entrez la nouvelle température :');
    if (newTemperature) {
      const sensorRef = doc(this.firestore, `coops/${this.coopId}/sensorData/latest`);
      updateDoc(sensorRef, { temperature: parseFloat(newTemperature) })
        .then(() => this.showSnackbar('Température mise à jour'))
        .catch(err => this.showSnackbar(`Erreur : ${err.message}`));
    }
  }

  toggleVent() {
    if (!this.checkSystemRunning()) return;
    const isRunning = this.coop?.isRunning;
    const command = isRunning ? 'ventOff' : 'ventOn';
    this.coopService.sendCommand(this.coopId, command)
      .then(() => this.showSnackbar(isRunning ? 'Ventilateur éteint' : 'Ventilateur allumé'))
      .catch((err: Error) => this.showSnackbar(`Erreur : ${err.message}`)); // Explicitly typed `err`
  }

  viewHumidityDetails() {
    this.router.navigate([`/dashboard/coop/sensors/humidity-details`, { coopId: this.coopId }]);
  }

  async refillWater() {
    if (!this.checkSystemRunning()) return;
    const sensorRef = doc(this.firestore, `coops/${this.coopId}/sensorData/latest`);
    await updateDoc(sensorRef, { waterLevel: 100 })
      .then(() => this.showSnackbar("Niveau d'eau rempli"))
      .catch(err => this.showSnackbar(`Erreur : ${err.message}`));
  }

  async refillFood() {
    if (!this.checkSystemRunning()) return;
    const sensorRef = doc(this.firestore, `coops/${this.coopId}/sensorData/latest`);
    await updateDoc(sensorRef, { foodLevel: 100 })
      .then(() => this.showSnackbar('Nourriture remplie'))
      .catch(err => this.showSnackbar(`Erreur : ${err.message}`));
  }

  viewTemperatureDetails() {
    this.router.navigate([`/dashboard/coop/sensors/temperature-details`, { coopId: this.coopId }]);
  }

  viewWaterDetails() {
    this.router.navigate([`/dashboard/coop/sensors/water-details`, { coopId: this.coopId }]);
  }

  viewFoodDetails() {
    this.router.navigate([`/dashboard/coop/sensors/food-details`, { coopId: this.coopId }]);
  }

  viewCleanDetails() {
    this.router.navigate([`/dashboard/coop/sensors/clean-details`, { coopId: this.coopId }]);
  }

  viewAmmoniaDetails() {
    this.router.navigate([`/dashboard/coop/sensors/ammonia-details`, { coopId: this.coopId }]);
  }

  goBack() {
    this.location.back(); // Navigate to the previous page
  }

  toggleExpand(index: number): void {
    this.expandedVideoIndex = this.expandedVideoIndex === index ? null : index;
  }

  openVideoModal(streamUrl: string): void {
    this.dialog.open(VideoModalComponent, {
      data: { streamUrl },
      width: '80%',
      height: '80%'
    });
  }

  private checkSystemRunning(): boolean {
    if (!this.coop?.isRunning) {
      this.showSnackbar('Veuillez démarrer le système avant de commander.');
      return false;
    }
    return true;
  }
}
