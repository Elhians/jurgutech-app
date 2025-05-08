export type NotificationType = 'info' | 'warning' | 'error';

export class Notification {
  id: string;
  message: string;
  timestamp: Date;
  coopId: string;
  isRead: boolean;
  type: NotificationType;

  constructor(data: Partial<Notification> = {}) {
    this.id = data.id || '';
    this.message = data.message || '';
    this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    this.coopId = data.coopId || '';
    this.isRead = data.isRead || false;
    this.type = data.type || 'info';
  }
  
  markAsRead(): void {
    this.isRead = true;
  }
}