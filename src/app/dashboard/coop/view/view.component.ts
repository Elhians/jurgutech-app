import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoopService } from '../coop.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view',
  imports: [
    CommonModule
  ],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})

export class ViewComponent implements OnInit {
  coopId = '';
  sensorData: any;

  constructor(private route: ActivatedRoute, private coopService: CoopService) {}

  ngOnInit(): void {
    this.coopId = this.route.snapshot.paramMap.get('id')!;
    this.coopService.getLatestSensorData(this.coopId).subscribe((data) => {
      this.sensorData = data;
    });
  }

  viewDetails(sensorType: string) {
    alert(`Voir les détails pour : ${sensorType}`);
    // TODO : rediriger ou ouvrir une modale pour chaque capteur
  }

  sendCommand(command: string) {
    alert(`Commande envoyée : ${command}`);
    // TODO : implémenter via Firebase ou backend
  }
}

