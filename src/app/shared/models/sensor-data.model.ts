// 📁 dashboard/coop/models/sensor-data.model.ts
export interface SensorData {
    humidity: number;
    temperature: number;
    waterLevel: number;
    foodLevel: number;
    lastCleaned: Date;
    lastFed: Date;
    lastWatered: Date;
    sensorCheckDate: Date;
}