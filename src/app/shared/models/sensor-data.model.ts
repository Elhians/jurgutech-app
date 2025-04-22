// 📁 dashboard/coop/models/sensor-data.model.ts
export interface SensorData {
    humidity: number;
    temperature: number;
    waterLevel: number;
    foodLevel: number;
    ammonia: number;
    lastCleaned: Date;
    lastFed: Date;
    lastWatered: Date;
    time: any;
}