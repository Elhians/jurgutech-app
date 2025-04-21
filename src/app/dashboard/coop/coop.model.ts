export interface Coop {
    id?: string;
    name: string;
    ownerId: string;
    accessCode: string;
    qrUsed?: boolean;
    createdAt?: any; // Timestamp Firestore
}
