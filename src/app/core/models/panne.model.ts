import { CommandType } from '../enums/command.enum';
import { Timestamp } from 'firebase/firestore';

export type ComponentType = 'ventilation' | 'water' | 'food' | 'cleaning' | 'battery' | 'system';
export type SeverityLevel = 'WARNING' | 'ERROR';

export interface Panne {
    id?: string;
    coopId: string;
    component: ComponentType;
    command?: CommandType;
    description: string;
    severity: SeverityLevel;
    timestamp: Timestamp;
    resolved: boolean;
    resolvedAt?: Timestamp;
    maintenanceRequired: boolean;
    resolutionNotes?: string;
    failureCount?: number;
}

export interface MaintenanceRecord {
    id?: string;
    coopId: string;
    component: ComponentType;
    description: string;
    performedAt: Timestamp;
    nextMaintenanceDue?: Timestamp;
    technician?: string;
    notes?: string;
}

export class Panne implements Panne {
    constructor(data: Partial<Panne> = {}) {
        this.id = data.id;
        this.coopId = data.coopId || '';
        this.component = data.component || 'system';
        this.command = data.command;
        this.description = data.description || '';
        this.severity = data.severity || 'WARNING';
        this.timestamp = data.timestamp || Timestamp.now();
        this.resolved = data.resolved || false;
        this.resolvedAt = data.resolvedAt;
        this.maintenanceRequired = data.maintenanceRequired || false;
        this.resolutionNotes = data.resolutionNotes;
        this.failureCount = data.failureCount || 1;
    }

    isRoutineMaintenance(): boolean {
        return this.severity === 'WARNING' && !this.maintenanceRequired;
    }

    requiresImmediateAttention(): boolean {
        return this.severity === 'ERROR' || (this.failureCount ?? 0) > 3;
    }

    getMaintenanceTimeframe(): string {
        if (this.requiresImmediateAttention()) {
            return 'Immédiat';
        }
        return this.severity === 'WARNING' ? '24 heures' : '7 jours';
    }

    getSeverityLabel(): string {
        return this.severity === 'ERROR' ? 'Critique' : 'Avertissement';
    }

    getComponentLabel(): string {
        switch (this.component) {
            case 'ventilation': return 'Ventilation';
            case 'water': return 'Système d\'eau';
            case 'food': return 'Système de nourriture';
            case 'cleaning': return 'Système de nettoyage';
            case 'battery': return 'Batterie';
            default: return 'Système général';
        }
    }
}
