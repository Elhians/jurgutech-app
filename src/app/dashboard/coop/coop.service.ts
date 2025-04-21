  import {
    Firestore, collection, query, where, getDocs, updateDoc, doc, docData, arrayUnion
  } from '@angular/fire/firestore';
  import { inject, Injectable } from '@angular/core';
  import { Auth } from '@angular/fire/auth';
  import { Observable } from 'rxjs';
  import { collectionData } from '@angular/fire/firestore';
  
  @Injectable({ providedIn: 'root' })
  export class CoopService {
    private firestore = inject(Firestore);
    private auth = inject(Auth);
  
    async linkCoopByCode(code: string): Promise<void> {
      const user = this.auth.currentUser;
      if (!user) throw new Error('Utilisateur non connecté');
  
      const ref = collection(this.firestore, 'coops');
      const q = query(ref, where('accessCode', '==', code));
      const result = await getDocs(q);
  
      if (result.empty) throw new Error('Aucun poulailler trouvé avec ce code');
  
      const coopDoc = result.docs[0];
      const coopRef = doc(this.firestore, `coops/${coopDoc.id}`);
  
      await updateDoc(coopRef, {
        authorizedUsers: arrayUnion(user.uid),
        qrUsed: true
      });
    }
  
    getUserCoops(uid: string): Observable<any[]> {
      const ref = collection(this.firestore, 'coops');
      const q = query(ref, where('authorizedUsers', 'array-contains', uid));
      return collectionData(q, { idField: 'id' }) as Observable<any[]>;
    }
    getLatestSensorData(coopId: string): Observable<any> {
      const ref = doc(this.firestore, `coops/${coopId}/sensorData/latest`);
      return docData(ref);
    }
  }
  

