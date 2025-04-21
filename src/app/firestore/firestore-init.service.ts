import { Injectable } from '@angular/core';
import { Firestore, setDoc, doc, serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreInitService {
  constructor(private firestore: Firestore) {}

  async createTestCoop(uid: string) {
    const coopId = 'coop_test';
    const coopRef = doc(this.firestore, `coops/${coopId}`);
    await setDoc(coopRef, {
      name: 'Poulailler Démo',
      ownerId: uid,
      createdAt: serverTimestamp(),
      isRunning: false,
      accessCode: 'ABC123',
      qrUsed: false,
      authorizedUsers: [uid],
      foodLevel: 60,
      waterLevel: 80,
      lastCleaned: serverTimestamp(),
      temperature: 25,
      humidity: 50
    });

    const sensorRef = doc(this.firestore, `coops/${coopId}/sensorData/latest`);
    await setDoc(sensorRef, {
      temperature: 25,
      humidity: 50,
      waterLevel: 80,
      foodLevel: 60,
      lastCleaned: serverTimestamp()
    });
  }
}
