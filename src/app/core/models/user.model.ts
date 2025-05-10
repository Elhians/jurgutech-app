export class User {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    tel: string;
    createdAt: Date;

    constructor(data: Partial<User> = {}) {
        this.uid = data.uid || '';
        this.email = data.email || '';
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.tel = data.tel || '';
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    }

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}