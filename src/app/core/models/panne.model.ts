export class Panne {
    id: string;
    message: string;
    timestamp: Date;
    coopId: string;
    isResolved: boolean;
  
    constructor(data: Partial<Panne> = {}) {
      this.id = data.id || '';
      this.message = data.message || '';
      this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
      this.coopId = data.coopId || '';
      this.isResolved = data.isResolved || false;
    }
    
    markAsResolved(): void {
      this.isResolved = true;
    }
  }
  