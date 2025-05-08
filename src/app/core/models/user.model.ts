export class User {
    prenom: string;
    nom: string;
    displayName?: string;
    password: string;
    uid: string;
    email: string;
    tel: string;
    constructor(data: Partial<User> = {}) {
        this.prenom = data.prenom || '';
        this.nom = data.nom || '';
        this.password = data.password || '';
        this.uid = data.uid || '';
        this.email = data.email || '';
        this.tel = data.tel || '';
    }

    get fullName(): string {
        return `${this.prenom} ${this.nom}`;
    }
}