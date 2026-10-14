
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import app from "../src/app";
import pool from "../src/config/db";

const testSuffix = randomUUID().replaceAll("-", "");
const testEmail = `api-test-${testSuffix}@example.com`;
const testPassword = "PlayHubTestPass123!";
const testName = `API Test ${testSuffix.slice(0, 8)}`;

let databaseHostValidated = false;
let registeredUserId: number | undefined;

const agent = request.agent(app);

/**
 * API integration tests must only use the dedicated Neon test branch.
 */
function validateTestDatabase(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Refusing to run: NODE_ENV must be 'test'.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  const expectedHost = process.env.TEST_DATABASE_HOST;

  if (!databaseUrl || !expectedHost) {
    throw new Error(
      "DATABASE_URL and TEST_DATABASE_HOST must be configured in .env.test.",
    );
  }

  let actualHost: string;

  try {
    actualHost = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("DATABASE_URL is invalid.");
  }

  if (actualHost.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(
      "Refusing to run against an unexpected database host.",
    );
  }

  databaseHostValidated = true;
}

describe("PlayHub HTTP API integration tests", () => {
  beforeAll(async () => {
    validateTestDatabase();

    // Confirm that the isolated database is reachable before testing.
    await pool.query("SELECT 1");
  });

  afterAll(async () => {
    try {
      if (databaseHostValidated) {
        // Remove only game records associated with this test account.
        await pool.query(
          `DELETE FROM games
           WHERE circle_user_id IN (
             SELECT id FROM users WHERE email = $1
           )
           OR cross_user_id IN (
             SELECT id FROM users WHERE email = $1
           )`,
          [testEmail],
        );

        // Safe if registration never created the account.
        await pool.query(
          "DELETE FROM users WHERE email = $1",
          [testEmail],
        );
      }
    } finally {
      // Always release the PostgreSQL pool.
      await pool.end();
    }
  });

  // ----------------------------------------------------
  // 1. Health check
  // ----------------------------------------------------

  it("GET /health returns a healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  // ----------------------------------------------------
  // 2. Registration validation
  // ----------------------------------------------------

  it("rejects invalid registration data", async () => {
    const response = await request(app)
      .post("/api/v1/users/create")
      .send({
        name: "",
        email: "not-an-email",
        password: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  // ----------------------------------------------------
  // 3. Successful registration
  // ----------------------------------------------------

  it("creates a user and returns HTTP 201", async () => {
    const response = await request(app)
      .post("/api/v1/users/create")
      .send({
        name: testName,
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe(testName);
    expect(response.body.email).toBe(testEmail);

    // Record the generated ID for inspection and debugging.
    registeredUserId = Number(response.body.id);

    expect(Number.isSafeInteger(registeredUserId)).toBe(true);
    expect(registeredUserId).toBeGreaterThan(0);

    // A password hash must never be returned in the API response.
    expect(response.body.password_hash).toBeUndefined();
    expect(response.body.password).toBeUndefined();
  });

  // ----------------------------------------------------
  // 4. Duplicate registration
  // ----------------------------------------------------

  it("rejects registration using an existing email", async () => {
    const response = await request(app)
      .post("/api/v1/users/create")
      .send({
        name: testName,
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "User with this email already exists",
    );
  });

  // ----------------------------------------------------
  // 5. Login validation
  // ----------------------------------------------------

  it("rejects invalid login input", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: "invalid-email",
        password: "123",
      });

    expect(response.status).toBe(400);
  });

  // ----------------------------------------------------
  // 6. Unknown email
  // ----------------------------------------------------

  it("rejects login for a nonexistent account", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: `missing-${testSuffix}@example.com`,
        password: testPassword,
      });

    expect(response.status).toBe(401);
  });

  // ----------------------------------------------------
  // 7. Incorrect password
  // ----------------------------------------------------

  it("rejects login with an incorrect password", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: testEmail,
        password: "DefinitelyWrongPassword123!",
      });

    expect(response.status).toBe(401);
  });

  // ----------------------------------------------------
  // 8. Successful login and cookie
  // ----------------------------------------------------

  it("logs in and sets an HttpOnly authentication cookie", async () => {
    const response = await agent
      .post("/api/v1/users/login")
      .send({
        email: testEmail.toUpperCase(),
        password: testPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(registeredUserId);
    expect(response.body.email).toBe(testEmail);

    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();

    expect(
      cookies?.some((cookie) => /^token=/i.test(cookie)),
    ).toBe(true);

    expect(
      cookies?.some((cookie) => /;\s*httponly/i.test(cookie)),
    ).toBe(true);
  });

  // ----------------------------------------------------
  // 9. Protected route without authentication
  // ----------------------------------------------------

  it("rejects profile access without an authentication cookie", async () => {
    const response = await request(app)
      .get("/api/v1/users/profile");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Access denied. No token provided.",
    );
  });

  // ----------------------------------------------------
  // 10. Protected route with a valid login cookie
  // ----------------------------------------------------

  it("allows the authenticated user to retrieve their profile", async () => {
    // The Supertest agent retains the cookie set by the login test.
    const response = await agent.get("/api/v1/users/profile");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(registeredUserId);
    expect(response.body.name).toBe(testName);
    expect(response.body.email).toBe(testEmail);

    expect(response.body.password_hash).toBeUndefined();
  });

  // ----------------------------------------------------
  // 11. Malformed JSON
  // ----------------------------------------------------

  it("returns HTTP 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid request body.");
  });

  // ----------------------------------------------------
  // 12. Logout and cookie clearing
  // ----------------------------------------------------

  it("logs out and clears the authentication cookie", async () => {
    const response = await agent.get("/api/v1/users/logout");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logged out successfully");

    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();

    expect(
      cookies?.some(
        (cookie) =>
          /^token=/i.test(cookie) &&
          /;\s*expires=/i.test(cookie) &&
          /1970|1969/i.test(cookie),
      ),
    ).toBe(true);

    // The same agent should no longer be authenticated after logout.
    const profileResponse = await agent.get("/api/v1/users/profile");

    expect(profileResponse.status).toBe(401);
  });
});
