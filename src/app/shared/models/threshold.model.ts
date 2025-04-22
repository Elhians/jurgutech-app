export interface Threshold {
    id?: string;
    coopId?: string; // pour faciliter les requêtes si besoin
    type: 'temperature' | 'humidity' | 'waterLevel' | 'foodLevel' | 'ammonia';
    min: number;
    max: number;
    commandToSend: string;
    notify: boolean;
}  