export interface Coop {
    id?: string;
    name: string;
    ownerId: string;
    accessCode: string;
    qrUsed?: boolean;
    isRunning?: boolean; // Fixed typo
    authorizedUsers?: string[]; // Array of user IDs
    createdAt?: any; // Timestamp Firestore
}
