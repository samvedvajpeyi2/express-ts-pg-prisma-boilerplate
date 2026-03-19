import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../src/server.js";
import { createAdminUser } from "./db-helpers.js";

const app = createApp();
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "adminpassword123";

describe("Users — GET /users/all", () => {
    beforeEach(async () => {
        // Create admin after global beforeEach cleans the DB
        await createAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    it("rejects request with no auth token with 401", async () => {
        const res = await supertest(app).get("/users/all");

        expect(res.status).toBe(401);
    });

    it("rejects USER role with 403", async () => {
        const registerRes = await supertest(app)
            .post("/auth/register")
            .send({ email: "user@example.com", password: "password123" });
        const { accessToken } = (registerRes.body as { data: { accessToken: string } }).data;

        const res = await supertest(app)
            .get("/users/all")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(403);
    });

    it("allows ADMIN role with 200 and returns users array", async () => {
        const loginRes = await supertest(app)
            .post("/auth/login")
            .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
        const { accessToken } = (loginRes.body as { data: { accessToken: string } }).data;

        const res = await supertest(app)
            .get("/users/all")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
