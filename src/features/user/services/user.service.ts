import type { UserRepository } from "../repositories/user.repository.js";

export class UserService {
    constructor(private readonly repo: UserRepository) {}

    async getUsers() {
        return this.repo.findAll();
    }
}
