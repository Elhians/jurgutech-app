export interface Threshold {
    id?: string;
    coopId?: string; // pour faciliter les requêtes si besoin
    type: 'temperature' | 'humidity' | 'waterLevel' | 'foodLevel' | 'ammonia';
    min: number;
    max: number;
    notify: boolean;
    commandToSend?: string; // commande à envoyer si la condition est remplie
}  