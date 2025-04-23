export interface Coop {
    id: string;
    name: string;
    ownerId: string;
    accessCode: string;
    shareCode: string;
    qrUsed?: boolean;
    isRunning?: boolean; // Fixed typo
    createdAt?: any; // Timestamp Firestore
}
