import { CommandType } from '../enums/command.enum';
import { Status } from '../enums/status.enum';

export class Command {
  command: CommandType;
  status: Status;
  sentDate: Date;
  coopId: string;
  userId: string;

  constructor(data: Partial<Command> = {}) {
    this.command = data.command || CommandType.START;
    this.status = data.status || Status.PENDING;
    this.sentDate = data.sentDate ? new Date(data.sentDate) : new Date();
    this.coopId = data.coopId || '';
    this.userId = data.userId || '';
  }
  
  isCompleted(): boolean {
    return this.status === Status.SUCCESS || this.status === Status.FAILED;
  }
  
  isPending(): boolean {
    return this.status === Status.PENDING;
  }
}