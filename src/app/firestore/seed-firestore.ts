import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'jurgutech-dev' });
const db = getFirestore();

async function seed() {
  // 1. Utilisateur
  const user = await db.collection('users').add({
    email: 'admin@jurgutech.com',
    firstName: 'Jurgu',
    lastName: 'Tech',
    tel: '+221700000000',
    createdAt: new Date(),
  });

  // 2. Coop
  const coop = await db.collection('coops').add({
    name: 'Coop Démo',
    ownerId: user.id,
    accessCode: 'ABC123',
    shareCode: 'SHARE456',
    qrUsed: false,
    isRunning: true,
    haveBattery: true,
    haveCleanSys: true,
    createdAt: new Date(),
  });

  // 3. Authorisations
  await db.collection('coops').doc(coop.id)
    .collection('authorisations').doc(user.id).set({
      role: 'ADMIN',
      assignedAt: new Date(),
    });

  // 4. Fan, capteurs et seuils
  await db.collection('coops').doc(coop.id).collection('fan').doc('current').set({
    isOn: false, lastChanged: new Date(),
  });

  await db.collection('coops').doc(coop.id).collection('thermometer').doc('current').set({
    temperature: 25, min: 18, max: 24, lastChanged: new Date(),
  });

  await db.collection('coops').doc(coop.id).collection('humiditySensor').doc('current').set({
    humidity: 60, max: 80, lastChanged: new Date(),
  });

  // 5. Réservoirs
  await db.collection('coops').doc(coop.id).collection('foodReservoir').doc('current').set({
    level: 70, min: 30, isUsingThreshold: true, lastFilled: new Date(),
  });
  await db.collection('coops').doc(coop.id).collection('waterReservoir').doc('current').set({
    level: 80, min: 40, lastFilled: new Date(),
  });

  // 6. Réservoirs externes
  await db.collection('coops').doc(coop.id).collection('foodTanks').doc('current').set({
    level: 100, capacity: 200,
  });
  await db.collection('coops').doc(coop.id).collection('waterTank').doc('current').set({
    level: 150, capacity: 300,
  });

  // 7. Batterie & nettoyage
  await db.collection('coops').doc(coop.id).collection('battery').doc('current').set({
    level: 95,
  });
  await db.collection('coops').doc(coop.id).collection('cleaningSystem').doc('current').set({
    lastCleaned: new Date(),
  });

  // 8. Feed moments
  await db.collection('coops').doc(coop.id).collection('feedMoments').add({
    mealTime: new Date(new Date().setHours(8, 0, 0)),
  });

  // 9. Notifications et commandes
  await db.collection('coops').doc(coop.id).collection('notifications').add({
    message: 'Température > seuil maximum',
    type: 'warning',
    createdAt: new Date(),
  });
  await db.collection('coops').doc(coop.id).collection('commands').add({
    command: 'START_FAN',
    status: 'PENDING',
    userId: user.id,
    sentAt: new Date(),
  });

  console.log('✅ Firestore seed completed.');
}

seed().catch(console.error);
