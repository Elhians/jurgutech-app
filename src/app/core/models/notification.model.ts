import { NotificationType } from '../enums/notification-type.enum';
import { Timestamp } from 'firebase/firestore';

export interface Notification {
    id?: string;
    message: string;
    type: NotificationType;
    createdAt: Timestamp;
    isRead: boolean;
    coopId: string;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    critical: boolean;
    warning: boolean;
    info: boolean;
}