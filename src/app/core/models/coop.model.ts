import { Role } from '../enums/role.enum';
import { Timestamp } from 'firebase/firestore';

export interface Fan {
  isOn: boolean;
  lastChanged: Timestamp;
}

export interface HumiditySensor {
  humidity: number;
  max: number;
  lastChanged: Timestamp;
}

export interface Camera {
  id: string;
  location: string;
  streamUrl: string;
}

export interface AmmoniaSensor {
  ammonia: number;
  max: number;
  lastChanged: Timestamp;
}

export interface Thermometer {
  temperature: number;
  lastChanged: Timestamp;
  min: number;
  max: number;
}

export interface WaterTrough {
  level: number;
  min: number;
  lastFilled: Timestamp;
}

export interface Feeder {
  level: number;
  min: number;
  isUsingThreshold: boolean;
  lastFilled: Timestamp;
}

export interface Light {
  isOn: boolean;
  intensity: number;
}

export interface Battery {
  level: number;
}

export interface CleaningSystem {
  lastCleaned: Timestamp;
  intervalDay: number;  // Added to match Firestore structure
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

export interface FeedMoment {
  id: string;
  mealTime: any;
  enabled: boolean;
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
  haveBattery: boolean;
  haveCleanSys: boolean;
  
  // Sensors and components
  fan: Fan;
  humiditySensor: HumiditySensor;
  thermometer: Thermometer;
  waterTrough: WaterTrough;
  feeder: Feeder;
  light: Light;
  ammoniaSensor: AmmoniaSensor;
  
  // Optional components
  battery?: Battery;
  cleaningSystem?: CleaningSystem;
  
  // Reserves
  foodReserve: FoodReserve;
  waterReserve: WaterReserve;
  
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
    this.haveBattery = data.haveBattery || false;
    this.haveCleanSys = data.haveCleanSys || false;
    
    // Sensors and components
    this.fan = data.fan || { isOn: false, lastChanged: Timestamp.now() };
    this.humiditySensor = data.humiditySensor || { 
      humidity: 0, 
      max: 80,
      lastChanged: Timestamp.now() 
    };
    this.thermometer = data.thermometer || { 
      temperature: 0,
      min: 18,
      max: 24, 
      lastChanged: Timestamp.now() 
    };
    this.waterTrough = data.waterTrough || { level: 0, min: 20, lastFilled: Timestamp.now() };
    this.feeder = data.feeder || { level: 0, min: 20, isUsingThreshold: false, lastFilled: Timestamp.now() };
    this.light = data.light || { isOn: false, intensity: 0 };
    this.ammoniaSensor = data.ammoniaSensor || {
      ammonia: 0,
      max: 25,
      lastChanged: Timestamp.now()
    };
    
    // Optional components based on coop configuration
    if (this.haveBattery) {
      this.battery = data.battery || { 
        level: 100
      };
    }
    
    if (this.haveCleanSys) {
      this.cleaningSystem = data.cleaningSystem || { 
        lastCleaned: Timestamp.now(),
        intervalDay: 7
      };
    }
    
    // Reserves
    this.foodReserve = data.foodReserve || { currentLevel: 0, capacity: 100, unit: 'g' };
    this.waterReserve = data.waterReserve || { currentLevel: 0, capacity: 1000, unit: 'ml' };
    
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
    return this.waterTrough.level < this.waterTrough.min;
  }
  
  needsFoodRefill(): boolean {
    return this.feeder.isUsingThreshold && this.feeder.level < this.feeder.min;
  }
  
  isTemperatureOutOfRange(): boolean {
    return this.thermometer.temperature < this.thermometer.min || 
            this.thermometer.temperature > this.thermometer.max;
  }
  
  isHumidityTooHigh(): boolean {
    return this.humiditySensor.humidity > this.humiditySensor.max;
  }
  
  needsCleaning(): boolean {
    if (!this.haveCleanSys || !this.cleaningSystem) return false;
    
    const lastCleaned = this.cleaningSystem.lastCleaned.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastCleaned.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays >= this.cleaningSystem.intervalDay;  // Use intervalDay from cleaningSystem
  }

  isBatteryLow(): boolean {
    if (!this.haveBattery || !this.battery) return false;
    return this.battery.level < 20;
  }

  isBatteryCritical(): boolean {
    if (!this.haveBattery || !this.battery) return false;
    return this.battery.level < 10;
  }

  shouldStartCleaning(): boolean {
    if (!this.haveCleanSys || !this.cleaningSystem) return false;
    
    const lastCleaned = this.cleaningSystem.lastCleaned.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastCleaned.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays >= this.cleaningSystem.intervalDay;
  }
}

