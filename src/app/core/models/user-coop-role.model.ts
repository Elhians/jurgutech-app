export class UserCoopRole {
    id: string;
    userId: string;
    coopId: string;
    role: string;
    createdAt: Date;

    constructor(data: Partial<UserCoopRole> = {}) {
        this.id = data.id || '';
        this.userId = data.userId || '';
        this.coopId = data.coopId || '';
        this.role = data.role || '';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    }
}