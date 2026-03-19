import supertest from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../src/server.js";

const app = createApp();

type AuthBody = { success: boolean; data?: { accessToken: string } };

describe("Auth — POST /auth/register", () => {
    it("registers a new user and returns access token + refresh cookie", async () => {
        const res = await supertest(app)
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });

        const body = res.body as AuthBody;
        expect(res.status).toBe(201);
        expect(body.success).toBe(true);
        expect(body.data?.accessToken).toBeDefined();
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects duplicate email with 409", async () => {
        await supertest(app)
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });
        const res = await supertest(app)
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });

        const body = res.body as AuthBody;
        expect(res.status).toBe(409);
        expect(body.success).toBe(false);
    });

    it("rejects invalid payload with 400", async () => {
        const res = await supertest(app)
            .post("/auth/register")
            .send({ email: "not-an-email", password: "short" });

        const body = res.body as AuthBody;
        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
    });
});

describe("Auth — POST /auth/login", () => {
    it("returns tokens when credentials are correct", async () => {
        await supertest(app)
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });
        const res = await supertest(app)
            .post("/auth/login")
            .send({ email: "alice@example.com", password: "password123" });

        const body = res.body as AuthBody;
        expect(res.status).toBe(200);
        expect(body.data?.accessToken).toBeDefined();
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects wrong password with 401", async () => {
        await supertest(app)
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });
        const res = await supertest(app)
            .post("/auth/login")
            .send({ email: "alice@example.com", password: "wrongpassword" });

        const body = res.body as AuthBody;
        expect(res.status).toBe(401);
        expect(body.success).toBe(false);
    });
});

describe("Auth — POST /auth/refresh", () => {
    it("rotates refresh token and returns new access token", async () => {
        // Use an agent so the refresh token cookie set by register is sent automatically
        const agent = supertest.agent(app);
        await agent
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });

        const res = await agent.post("/auth/refresh").send({});

        const body = res.body as AuthBody;
        expect(res.status).toBe(200);
        expect(body.data?.accessToken).toBeDefined();
        expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects request with no refresh token cookie with 401", async () => {
        const res = await supertest(app).post("/auth/refresh").send({});

        expect(res.status).toBe(401);
    });
});

describe("Auth — POST /auth/logout", () => {
    it("clears the refresh token cookie and revokes the token", async () => {
        // Use an agent so the refresh token cookie set by register is sent automatically
        const agent = supertest.agent(app);
        await agent
            .post("/auth/register")
            .send({ email: "alice@example.com", password: "password123" });

        const res = await agent.post("/auth/logout").send({});

        const body = res.body as AuthBody;
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        // Cookie should be cleared (value set to empty string)
        const cookie = (res.headers["set-cookie"] as unknown as string[])?.[0] ?? "";
        expect(cookie).toMatch(/refreshToken=;/);
    });
});
