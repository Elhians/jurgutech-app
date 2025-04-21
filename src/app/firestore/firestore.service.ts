import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  createDocument(collectionName: string, data: any) {
    const colRef = collection(this.firestore, collectionName);
    return addDoc(colRef, data);
  }

  readDocument(collectionName: string, docId: string) {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return getDoc(docRef);
  }

  updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return updateDoc(docRef, data);
  }

  deleteDocument(collectionName: string, docId: string) {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return deleteDoc(docRef);
  }
}
