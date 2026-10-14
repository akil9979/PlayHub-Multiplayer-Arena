
import http from "node:http";
import { randomUUID } from "node:crypto";

import pool from "./src/config/db";
import app from "./src/app";
import { getLeaderboard } from "./src/models/gameModel";
import { generateRoomId } from "./src/utils/generateRoomId";

interface TestUser {
  id: number;
  name: string;
}

interface LeaderboardEntry {
  userId: number;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

/**
 * Prevent this script from running against an unexpected database.
 * Keep this guard aligned with test_suite.ts.
 */
function validateTestDatabase(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Refusing to run leaderboard tests: NODE_ENV must be 'test'.",
    );
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
    throw new Error("DATABASE_URL is not a valid database URL.");
  }

  if (actualHost.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(
      "Refusing to run leaderboard tests: database host does not match TEST_DATABASE_HOST.",
    );
  }
}

/**
 * Create one uniquely named test account.
 *
 * Its generated ID is recorded immediately after insertion so that
 * a later failure cannot leave an untracked user behind.
 */
async function createTestUser(
  name: string,
  email: string,
  createdUserIds: number[],
): Promise<TestUser> {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name`,
    [name, email, "integration-test-placeholder"],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error(`Failed to create test user: ${name}`);
  }

  const id = Number(row.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`Invalid database ID returned for test user: ${name}`);
  }

  createdUserIds.push(id);

  return {
    id,
    name: row.name,
  };
}

async function runLeaderboardTests(): Promise<void> {
  console.log("=== Running PlayHub Leaderboard Tests ===");

  const testSuffix = randomUUID().replaceAll("-", "");

  // Track only resources created by this execution.
  const createdUserIds: number[] = [];
  const createdRoomIds: string[] = [];

  let apiServer: http.Server | undefined;
  let testPassed = false;
  let cleanupSucceeded = true;

  try {
    validateTestDatabase();

    // ----------------------------------------------------
    // 1. Create four isolated test users.
    // ----------------------------------------------------

    console.log("\n--- Creating isolated test users ---");

    const userA = await createTestUser(
      `TestUserA_${testSuffix}`,
      `userA_${testSuffix}@test.local`,
      createdUserIds,
    );

    const userB = await createTestUser(
      `TestUserB_${testSuffix}`,
      `userB_${testSuffix}@test.local`,
      createdUserIds,
    );

    const userC = await createTestUser(
      `TestUserC_${testSuffix}`,
      `userC_${testSuffix}@test.local`,
      createdUserIds,
    );

    const userD = await createTestUser(
      `TestUserD_${testSuffix}`,
      `userD_${testSuffix}@test.local`,
      createdUserIds,
    );

    console.log("Created test users:", createdUserIds);

    // ----------------------------------------------------
    // 2. Generate unique room IDs and track them BEFORE
    //    inserting any game rows.
    // ----------------------------------------------------

    const r1 = generateRoomId();
    const r2 = generateRoomId();
    const r3 = generateRoomId();
    const r4 = generateRoomId();
    const r5 = generateRoomId();
    const r6 = generateRoomId();

    createdRoomIds.push(r1, r2, r3, r4, r5, r6);

    // ----------------------------------------------------
    // 3. Insert controlled game records.
    //
    // User A: 2 wins, 1 loss, 1 draw = 4 games, 50% win rate
    // User B: 1 win, 1 loss, 1 draw = 3 games, 33.3% win rate
    // User C: 1 loss = 1 game, 0% win rate
    // User D: no games, so absent from the leaderboard
    // ----------------------------------------------------

    console.log("\n--- Creating controlled game records ---");

    // Match 1: User A (circle) defeats User B (cross).
    await pool.query(
      `INSERT INTO games
         (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'circle', 'completed')`,
      [r1, userA.id, userB.id],
    );

    // Match 2: User B (cross) defeats User A (circle).
    await pool.query(
      `INSERT INTO games
         (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'cross', 'completed')`,
      [r2, userA.id, userB.id],
    );

    // Match 3: Draw between User A and User B.
    await pool.query(
      `INSERT INTO games
         (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'draw', 'completed')`,
      [r3, userA.id, userB.id],
    );

    // Match 4: User A defeats User C.
    await pool.query(
      `INSERT INTO games
         (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'circle', 'completed')`,
      [r4, userA.id, userC.id],
    );

    // Match 5: Waiting game must not count.
    await pool.query(
      `INSERT INTO games
         (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, NULL, NULL, 'waiting')`,
      [r5, userA.id],
    );

    // Match 6: Playing game must not count.
    await pool.query(
      `INSERT INTO games
         (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, NULL, 'playing')`,
      [r6, userB.id, userC.id],
    );

    // ----------------------------------------------------
    // 4. Check getLeaderboard() results.
    // ----------------------------------------------------

    console.log("\n--- Checking getLeaderboard() query results ---");

    const leaderboard =
      (await getLeaderboard()) as LeaderboardEntry[];

    const entryA = leaderboard.find(
      (entry) => entry.userId === userA.id,
    );

    const entryB = leaderboard.find(
      (entry) => entry.userId === userB.id,
    );

    const entryC = leaderboard.find(
      (entry) => entry.userId === userC.id,
    );

    const entryD = leaderboard.find(
      (entry) => entry.userId === userD.id,
    );

    console.log("Entry A:", entryA);
    console.log("Entry B:", entryB);
    console.log("Entry C:", entryC);
    console.log("Entry D:", entryD);

    // User A assertions.
    if (
      !entryA ||
      entryA.gamesPlayed !== 4 ||
      entryA.wins !== 2 ||
      entryA.losses !== 1 ||
      entryA.draws !== 1 ||
      entryA.winRate !== 50
    ) {
      throw new Error(
        `User A stats mismatch: ${JSON.stringify(entryA)}`,
      );
    }

    console.log(
      "PASS: User A has 4 games, 2 wins, 1 loss, 1 draw, and a 50% win rate.",
    );

    // User B assertions.
    if (
      !entryB ||
      entryB.gamesPlayed !== 3 ||
      entryB.wins !== 1 ||
      entryB.losses !== 1 ||
      entryB.draws !== 1 ||
      entryB.winRate !== 33.3
    ) {
      throw new Error(
        `User B stats mismatch: ${JSON.stringify(entryB)}`,
      );
    }

    console.log(
      "PASS: User B has 3 games, 1 win, 1 loss, 1 draw, and a 33.3% win rate.",
    );

    // User C assertions.
    if (
      !entryC ||
      entryC.gamesPlayed !== 1 ||
      entryC.wins !== 0 ||
      entryC.losses !== 1 ||
      entryC.draws !== 0 ||
      entryC.winRate !== 0
    ) {
      throw new Error(
        `User C stats mismatch: ${JSON.stringify(entryC)}`,
      );
    }

    console.log(
      "PASS: User C has 1 loss and a 0% win rate.",
    );

    // User D has no completed games.
    if (entryD !== undefined) {
      throw new Error(
        "User D with zero games should not appear on the leaderboard.",
      );
    }

    console.log(
      "PASS: User D is excluded because there are no completed games.",
    );

    // Ranking among these three users must be A, then B, then C.
    const indexA = leaderboard.findIndex(
      (entry) => entry.userId === userA.id,
    );

    const indexB = leaderboard.findIndex(
      (entry) => entry.userId === userB.id,
    );

    const indexC = leaderboard.findIndex(
      (entry) => entry.userId === userC.id,
    );

    if (!(indexA < indexB && indexB < indexC)) {
      throw new Error(
        `Ranking order incorrect: A=${indexA}, B=${indexB}, C=${indexC}`,
      );
    }

    console.log(
      `PASS: Relative ranking is A (#${indexA + 1}), B (#${indexB + 1}), C (#${indexC + 1}).`,
    );

    // ----------------------------------------------------
    // 5. Check the HTTP leaderboard endpoint.
    // The server is closed in finally even if a request fails.
    // ----------------------------------------------------

    console.log(
      "\n--- Checking HTTP endpoint: GET /api/v1/users/leaderboard ---",
    );

    const server = http.createServer(app);
    apiServer = server;

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        server.off("listening", onListening);
        reject(error);
      };

      const onListening = () => {
        server.off("error", onError);
        resolve();
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(0, "127.0.0.1");
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Could not determine HTTP test server port.");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/users/leaderboard`,
    );

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status} ${response.statusText}`,
      );
    }

    const apiData =
      (await response.json()) as LeaderboardEntry[];

    console.log(
      `API returned ${apiData.length} leaderboard records.`,
    );

    const apiEntryA = apiData.find(
      (entry) => entry.userId === userA.id,
    );

    if (!apiEntryA) {
      throw new Error(
        "User A was not found in the HTTP API response.",
      );
    }

    // Check that numeric API properties are actual JS numbers.
    if (
      typeof apiEntryA.userId !== "number" ||
      typeof apiEntryA.gamesPlayed !== "number" ||
      typeof apiEntryA.wins !== "number" ||
      typeof apiEntryA.losses !== "number" ||
      typeof apiEntryA.draws !== "number" ||
      typeof apiEntryA.winRate !== "number"
    ) {
      throw new Error(
        `API numeric types are incorrect: ${JSON.stringify(apiEntryA)}`,
      );
    }

    console.log(
      "PASS: HTTP endpoint responds successfully with numeric stat fields.",
    );

    testPassed = true;
  } catch (error) {
    console.error("\nLeaderboard test failed:", error);
    process.exitCode = 1;
  } finally {
    // ----------------------------------------------------
    // 6. Close the HTTP server first.
    // Do not let a server shutdown error skip DB cleanup.
    // ----------------------------------------------------

    if (apiServer?.listening) {
      try {
        await new Promise<void>((resolve, reject) => {
          apiServer!.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });

        console.log("HTTP test server closed.");
      } catch (error) {
        cleanupSucceeded = false;
        process.exitCode = 1;
        console.error("Failed to close HTTP test server:", error);
      }
    }

    // ----------------------------------------------------
    // 7. Remove only game records created by this run.
    // Attempt cleanup independently so a failure in one query
    // does not prevent the remaining cleanup attempts.
    // ----------------------------------------------------

    if (createdRoomIds.length > 0) {
      try {
        await pool.query(
          `DELETE FROM games WHERE room_id = ANY($1)`,
          [createdRoomIds],
        );

        console.log("Tracked game records cleaned up.");
      } catch (error) {
        cleanupSucceeded = false;
        process.exitCode = 1;
        console.error(
          "Failed to delete tracked game records:",
          error,
        );
      }
    }

    // Extra safety: remove any game rows involving our generated
    // test users, even if a room was not included in the room list.
    if (createdUserIds.length > 0) {
      try {
        await pool.query(
          `DELETE FROM games
           WHERE circle_user_id = ANY($1::int[])
              OR cross_user_id = ANY($1::int[])`,
          [createdUserIds],
        );

        console.log("Game records linked to test users cleaned up.");
      } catch (error) {
        cleanupSucceeded = false;
        process.exitCode = 1;
        console.error(
          "Failed to delete games associated with test users:",
          error,
        );
      }

      try {
        await pool.query(
          `DELETE FROM users WHERE id = ANY($1::int[])`,
          [createdUserIds],
        );

        console.log("Temporary test users cleaned up.");
      } catch (error) {
        cleanupSucceeded = false;
        process.exitCode = 1;
        console.error("Failed to delete temporary test users:", error);
      }
    }

    // Always attempt to close the PostgreSQL pool.
    try {
      await pool.end();
    } catch (error) {
      cleanupSucceeded = false;
      process.exitCode = 1;
      console.error("Failed to close PostgreSQL pool:", error);
    }
  }

  if (testPassed && cleanupSucceeded) {
    console.log("\n==========================================");
    console.log("ALL LEADERBOARD TESTS PASSED SUCCESSFULLY!");
    console.log("Statistics, ranking, and HTTP API verified.");
    console.log("Test records cleaned up.");
    console.log("Database pool closed.");
    console.log("==========================================");
  } else if (testPassed && !cleanupSucceeded) {
    console.error(
      "\nLeaderboard assertions passed, but cleanup was not fully successful.",
    );
  }
}

runLeaderboardTests().catch((error) => {
  console.error("Unexpected leaderboard test runner failure:", error);
  process.exitCode = 1;
});
