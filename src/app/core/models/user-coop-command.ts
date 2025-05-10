import { CommandType } from '../enums/command.enum';
import { Status } from '../enums/status.enum';
import { Timestamp } from 'firebase/firestore';

export class Command {
  id?: string;
  command: CommandType;
  status: Status;
  userId: string;
  coopId: string;
  sentAt: Timestamp;

  constructor(data: Partial<Command> = {}) {
    this.id = data.id;
    this.command = data.command || CommandType.START;
    this.status = data.status || Status.PENDING;
    this.userId = data.userId || '';
    this.coopId = data.coopId || '';
    this.sentAt = data.sentAt || Timestamp.now();
  }
  
  isCompleted(): boolean {
    return this.status === Status.SUCCESS || this.status === Status.FAILED;
  }
  
  isPending(): boolean {
    return this.status === Status.PENDING;
  }
}