import { Injectable } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FanService {
  constructor(private firestore: Firestore) {}

  getFanStatus(coopId: string) {
    const ref = doc(this.firestore, `coops/${coopId}/fan/current`);
    return docData(ref, { idField: 'id' });
  }

  async setFanState(coopId: string, isOn: boolean) {
    const ref = doc(this.firestore, `coops/${coopId}/fan/current`);
    await setDoc(ref, {
      isOn,
      lastChanged: Timestamp.now()
    });
  }
}
