import { Role } from '../enums/role.enum';

export interface Fan {
  isOn: boolean;
  lastChanged: Date;
}

export interface HumiditySensor {
  humidity: number;
  lastChanged: Date;
}

export interface Thermometer {
  temperature: number;
  unit: string;
  lastChanged: Date;
}

export interface WaterTrough {
  level: number;
  lastFilled: Date;
}

export interface Feeder {
  level: number;
  lastFilled: Date;
}

export interface Light {
  isOn: boolean;
  intensity: number;
}

export interface Battery {
  level: number;
}

export interface CleaningSystem {
  lastCleaned: Date;
}

export interface FoodReserve {
  currentLevel: number;
  capacity: number;
  unit: string;
}

export interface WaterReserve {
  currentLevel: number;
  capacity: number;
  unit: string;
}

export interface HumidityThreshold {
  max: number;
}

export interface TemperatureThreshold {
  min: number;
  max: number;
}

export interface FoodThreshold {
  isUsed: boolean;
  min: number;
}

export interface WaterThreshold {
  min: number;
}

export interface CleanThreshold {
  intervalDays: number;
}

export interface FeedMoment {
  isUsed: boolean;
  mealTime: Date;
}

export class Coop {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  ownerId: string;
  authorizedUsers: string[];
  accessCode: string;
  qrUsed: boolean;
  shareCode: string;
  isRunning: boolean;
  hasBattery: boolean;
  hasCleanSys: boolean;
  
  // Sensors and components
  fan: Fan;
  humiditySensor: HumiditySensor;
  thermometer: Thermometer;
  waterTrough: WaterTrough;
  feeder: Feeder;
  light: Light;
  
  // Optional components
  battery?: Battery;
  cleaningSystem?: CleaningSystem;
  
  // Reserves
  foodReserve: FoodReserve;
  waterReserve: WaterReserve;
  
  // Thresholds
  humidityThreshold: HumidityThreshold;
  temperatureThreshold: TemperatureThreshold;
  foodThreshold: FoodThreshold;
  waterThreshold: WaterThreshold;
  cleanThreshold: CleanThreshold;
  
  // Feed scheduling
  feedMoments: FeedMoment[];

  constructor(data: Partial<Coop> = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.location = data.location || '';
    this.isActive = data.isActive || false;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.ownerId = data.ownerId || '';
    this.authorizedUsers = data.authorizedUsers || [];
    this.accessCode = data.accessCode || '';
    this.qrUsed = data.qrUsed || false;
    this.shareCode = data.shareCode || '';
    this.isRunning = data.isRunning || false;
    this.hasBattery = data.hasBattery || false;
    this.hasCleanSys = data.hasCleanSys || false;
    
    // Sensors and components
    this.fan = data.fan || { isOn: false, lastChanged: new Date() };
    this.humiditySensor = data.humiditySensor || { humidity: 0, lastChanged: new Date() };
    this.thermometer = data.thermometer || { temperature: 0, unit: 'C', lastChanged: new Date() };
    this.waterTrough = data.waterTrough || { level: 0, lastFilled: new Date() };
    this.feeder = data.feeder || { level: 0, lastFilled: new Date() };
    this.light = data.light || { isOn: false, intensity: 0 };
    
    // Optional components based on coop configuration
    if (this.hasBattery) {
      this.battery = data.battery || { level: 100 };
    }
    
    if (this.hasCleanSys) {
      this.cleaningSystem = data.cleaningSystem || { lastCleaned: new Date() };
    }
    
    // Reserves
    this.foodReserve = data.foodReserve || { currentLevel: 0, capacity: 100, unit: 'g' };
    this.waterReserve = data.waterReserve || { currentLevel: 0, capacity: 1000, unit: 'ml' };
    
    // Thresholds
    this.humidityThreshold = data.humidityThreshold || { max: 70 };
    this.temperatureThreshold = data.temperatureThreshold || { min: 15, max: 28 };
    this.foodThreshold = data.foodThreshold || { isUsed: false, min: 20 };
    this.waterThreshold = data.waterThreshold || { min: 20 };
    this.cleanThreshold = data.cleanThreshold || { intervalDays: 7 };
    
    // Feed scheduling
    this.feedMoments = data.feedMoments || [];
  }

  isUserAuthorized(userId: string): boolean {
    return this.ownerId === userId || this.authorizedUsers.includes(userId);
  }

  getUserRole(userId: string): Role | null {
    if (this.ownerId === userId) return Role.ADMIN;
    if (this.authorizedUsers.includes(userId)) return Role.GUEST;
    return null;
  }
  
  needsWaterRefill(): boolean {
    return this.waterTrough.level < this.waterThreshold.min;
  }
  
  needsFoodRefill(): boolean {
    return this.foodThreshold.isUsed && this.feeder.level < this.foodThreshold.min;
  }
  
  isTemperatureOutOfRange(): boolean {
    return this.thermometer.temperature < this.temperatureThreshold.min || 
           this.thermometer.temperature > this.temperatureThreshold.max;
  }
  
  isHumidityTooHigh(): boolean {
    return this.humiditySensor.humidity > this.humidityThreshold.max;
  }
  
  needsCleaning(): boolean {
    if (!this.hasCleanSys || !this.cleaningSystem) return false;
    
    const now = new Date();
    const lastCleaned = new Date(this.cleaningSystem.lastCleaned);
    const diffTime = Math.abs(now.getTime() - lastCleaned.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= this.cleanThreshold.intervalDays;
  }
}

