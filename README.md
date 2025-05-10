# JurgutechApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


📘 JurguiTech – Système intelligent de gestion de poulaillers connectés
🎯 Résumé du projet
JurguiTech est une application web et un système embarqué destinés à automatiser, surveiller et faciliter la gestion de poulaillers à distance. Il s'agit d'un projet IoT (Internet of Things) combinant :
    • 🐔 des capteurs physiques dans le poulailler,
    • 📶 une connectivité réseau,
    • 💻 une application web (Angular) moderne,
    • Une utilisation de firebase avec firestore pour stocker et recuperer les donnees et de son dysteme d’authentification.
Elle est conçue pour offrir un outil intuitif, intelligent et collaboratif aux éleveurs, techniciens et partenaires agricoles.
🧩 Fonctionnalités principales
🔐 Authentification & rôles
    • Création de compte avec sécurisation par mot de passe ou connexion via Google
    • Gestion des rôles par poulailler :
        ◦ ADMIN : gestion totale
        ◦ EMPLOYEE : contrôle technique limité
        ◦ GUEST : visualisation seule
    • L’admin accede au poulailler via un code d’acces disponible en texte et en code QR, a usage unique.
    • L’admin peut inviter un utilisateur à un poulailler via un code de partage (ou QR code) qu’il peut generer pour un poulailler. L’admin peut voir l’historique des commandesdeclenche et qui les a declenches.
🐣 Tableau de bord personnalisé

    • Affichage dynamique des poulaillers associés à l’utilisateur
    • Affichage des moyens d’ajouter un poulaiiler, code d’acces, ou qrcode
En cliquant sur un poulailler, on peut, selon notre role dans ce poulailler:
    • Affichage des capteurs en temps réel :
        ◦ Température
        ◦ Humidité
        ◦ Niveau d’eau
        ◦ Niveau d’aliment
        ◦ Date du dernier nettoyage
        ◦ Les videos des cameras integres dans le poulaillers
        ◦ Niveau des Réservoirs externes connectés pour eau et aliment
    • Commandes rapides : allumer/éteindre systeme,  allumer/éteindre ventilateur, remplir abreuvoir ou mangeoire, nettoyage automatique
📈 Pages de données capteurs
    • Détail par capteur avec :
        ◦ Visualisation sous forme de graphique historique
        ◦ Définition de seuils d’alerte personnalisés
        ◦ Déclenchement automatique de commandes selon seuils
    • Actions de remplissage (eau/nourriture) manuelles ou programmées
📣 Notifications intelligentes
    • Détection de pannes ou dysfonctionnements (ventilo bloqué, seuil dépassé…)
    • Affichage de notifications à l’utilisateur concerné
    • Définition du message selon la cause connue (ex : “température trop élevée > ventilateur déclenché”)
⏰ Programmation
    • Possibilité de programmer :
        ◦ L’heure de distribution des aliments
        ◦ Le nettoyage automatique
    • Mode de remplissage configurable : par heure ou par seuil
⚙️ Gestion technique 
    • Système de nettoyage automatique
    • Batterie pour fonctionnement hors ligne
    • État en temps réel de ces systèmes visibles dans l’app


STRICTURE FIRESTORE: 
users (collection)
  └── {userId} (document)
      email: string
      firstName: string
      lastName: string
      tel: string
      createdAt: timestamp

coops (collection)
  └── {coopId} (document)
      name: string
      ownerId: string
      accessCode: string
      shareCode: string
      qrUsed: boolean
      isRunning: boolean
      haveBattery: boolean
      haveCleanSys: boolean
      createdAt: timestamp

      authorisations (subcollection)
        └── {userId} (document)
            role: "ADMIN" | "EMPLOYEE" | "GUEST"
            assignedAt: timestamp

      fan (subcollection)
        └── current (document)
            isOn: boolean
            lastChanged: timestamp
      
      camera (subcollection)
        └── {cameraId} (document)
            location: String
            streamUrl: timestamp

      thermometer (subcollection)
        └── current (document)
            temperature: number
            lastChanged: timestamp
            min: number
            max:number

      humiditySensor (subcollection)
        └── current (document)
            humidity: number
            max: number
            lastChanged: timestamp

      ammoniaSensor (subcollection)
        └── current (document)
            ammonia: number
            max: number
            lastChanged: timestamp

      feeder (subcollection)
        └── current (document)
            level: number
            min: number
            isUsingThreshold: boolean
            lastFilled: timestamp

      waterThrough (subcollection)
        └── current (document)
            level: number
            min: number
            lastFilled: timestamp

      waterReservoir (subcollection)
        └── current (document)
            level: number
            capacity: number
            
      foodReservoir (subcollection)
        └── current (document)
            level: number
            capacity: number

      battery (subcollection)
        └── current (document)
            level: number

      cleaningSystem (subcollection)
        └── current (document)
            lastCleaned: timestamp
            intervalDay: number

      feedMoments (subcollection)
        └── {momentId} (document)
            mealTime: timestamp

      notifications (subcollection)
        └── {notifId} (document)
            message: string
            type: "info" | "warning" | "critical"
            createdAt: timestamp
           

      commands (subcollection)
        └── {commandId} (document)
            command: string  # EnumCommand
            status: "PENDING" | "SUCCESS" | "FAILED"
            userId: string
            sentAt: timestamp
