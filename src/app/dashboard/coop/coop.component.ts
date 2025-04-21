import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../../firestore/firestore.service';
import { AuthService } from '../../auth/auth.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-coop',
  imports: [NgFor, NgIf],
  templateUrl: './coop.component.html',
  styleUrl: './coop.component.scss'
})
export class CoopComponent implements OnInit {
  coops: any[] = [];
  threshold = { temperature: 30, humidity: 70 }; // Example thresholds

  constructor(
              private firestoreService: FirestoreService,
              private authService: AuthService
            ) {}

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.firestoreService.readDocument('coops', user.uid).then(doc => {
        if (doc.exists()) {
          this.coops = doc.data()?.[`coops`] || [];
        }
      });
    }
  }

  isThresholdBreached(coop: any): boolean {
    return coop.temperature > this.threshold.temperature || coop.humidity > this.threshold.humidity;
  }
}
