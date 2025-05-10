export enum Status {
    // Command statuses
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    
    // System statuses
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED',
    MAINTENANCE = 'MAINTENANCE',
    ERROR = 'ERROR',
    
    // Component statuses
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CLEANING = 'CLEANING',
    FILLING = 'FILLING',
    CHARGING = 'CHARGING',
    LOW_BATTERY = 'LOW_BATTERY',
    DISABLED = 'DISABLED'
}