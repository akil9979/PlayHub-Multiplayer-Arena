import pool from "./src/config/db";
import app from "./src/app";
import { getLeaderboard } from "./src/models/gameModel";
import { generateRoomId } from "./src/utils/generateRoomId";
import http from "http";

async function runLeaderboardTests() {
  console.log("=== Running PlayHub Leaderboard Tests ===");
  const testSuffix = Date.now().toString().slice(-6);

  let userA: any, userB: any, userC: any, userD: any;
  const createdRoomIds: string[] = [];

  try {
    // 1. Create 4 test users: User A, User B, User C, User D (0 games)
    const resA = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'hash') RETURNING id, name`,
      [`TestUserA_${testSuffix}`, `userA_${testSuffix}@test.com`]
    );
    const resB = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'hash') RETURNING id, name`,
      [`TestUserB_${testSuffix}`, `userB_${testSuffix}@test.com`]
    );
    const resC = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'hash') RETURNING id, name`,
      [`TestUserC_${testSuffix}`, `userC_${testSuffix}@test.com`]
    );
    const resD = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'hash') RETURNING id, name`,
      [`TestUserD_${testSuffix}`, `userD_${testSuffix}@test.com`]
    );

    userA = resA.rows[0];
    userB = resB.rows[0];
    userC = resC.rows[0];
    userD = resD.rows[0];

    console.log(`Created test users: A (${userA.id}), B (${userB.id}), C (${userC.id}), D (${userD.id})`);

    const r1 = generateRoomId(); createdRoomIds.push(r1);
    const r2 = generateRoomId(); createdRoomIds.push(r2);
    const r3 = generateRoomId(); createdRoomIds.push(r3);
    const r4 = generateRoomId(); createdRoomIds.push(r4);
    const r5 = generateRoomId(); createdRoomIds.push(r5);
    const r6 = generateRoomId(); createdRoomIds.push(r6);

    // 2. Insert controlled game matches
    // Match 1: User A (circle) vs User B (cross) -> Winner: 'circle'
    // User A gets 1 win, User B gets 1 loss
    await pool.query(
      `INSERT INTO games (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'circle', 'completed')`,
      [r1, userA.id, userB.id]
    );

    // Match 2: User B (cross) vs User A (circle) -> Winner: 'cross'
    // User B gets 1 win, User A gets 1 loss
    await pool.query(
      `INSERT INTO games (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'cross', 'completed')`,
      [r2, userA.id, userB.id]
    );

    // Match 3: User A (circle) vs User B (cross) -> Winner: 'draw'
    // Both get 1 draw
    await pool.query(
      `INSERT INTO games (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'draw', 'completed')`,
      [r3, userA.id, userB.id]
    );

    // Match 4: User A (circle) vs User C (cross) -> Winner: 'circle'
    // User A gets another win, User C gets 1 loss
    await pool.query(
      `INSERT INTO games (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, 'circle', 'completed')`,
      [r4, userA.id, userC.id]
    );

    // Match 5: INCOMPLETE GAME (cross_user_id is NULL) -> MUST NOT COUNT
    await pool.query(
      `INSERT INTO games (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, NULL, NULL, 'waiting')`,
      [r5, userA.id]
    );

    // Match 6: Status != 'completed' -> MUST NOT COUNT
    await pool.query(
      `INSERT INTO games (room_id, circle_user_id, cross_user_id, winner, status)
       VALUES ($1, $2, $3, NULL, 'playing')`,
      [r6, userB.id, userC.id]
    );

    console.log("\n--- Checking getLeaderboard() query results ---");
    const leaderboard = await getLeaderboard();

    const entryA = leaderboard.find((r: any) => r.userId === userA.id);
    const entryB = leaderboard.find((r: any) => r.userId === userB.id);
    const entryC = leaderboard.find((r: any) => r.userId === userC.id);
    const entryD = leaderboard.find((r: any) => r.userId === userD.id);

    console.log("Entry A:", entryA);
    console.log("Entry B:", entryB);
    console.log("Entry C:", entryC);
    console.log("Entry D (zero games):", entryD);

    if (!entryA || entryA.gamesPlayed !== 4 || entryA.wins !== 2 || entryA.losses !== 1 || entryA.draws !== 1 || entryA.winRate !== 50) {
      throw new Error(`User A stats mismatch: ${JSON.stringify(entryA)}`);
    }
    console.log("✓ User A stats verified (Circle wins, draws, losses, winRate=50%)");

    if (!entryB || entryB.gamesPlayed !== 3 || entryB.wins !== 1 || entryB.losses !== 1 || entryB.draws !== 1 || entryB.winRate !== 33.3) {
      throw new Error(`User B stats mismatch: ${JSON.stringify(entryB)}`);
    }
    console.log("✓ User B stats verified (Cross win, draws, losses, winRate=33.3%)");

    if (!entryC || entryC.gamesPlayed !== 1 || entryC.wins !== 0 || entryC.losses !== 1 || entryC.draws !== 0 || entryC.winRate !== 0) {
      throw new Error(`User C stats mismatch: ${JSON.stringify(entryC)}`);
    }
    console.log("✓ User C stats verified (0 wins, 1 loss, winRate=0%)");

    if (entryD !== undefined) {
      throw new Error("User D with 0 games should NOT be in the leaderboard!");
    }
    console.log("✓ User D correctly excluded (zero completed games)");

    // Check ordering: User A (2 wins) should be ahead of User B (1 win), ahead of User C (0 wins)
    const indexA = leaderboard.findIndex((r: any) => r.userId === userA.id);
    const indexB = leaderboard.findIndex((r: any) => r.userId === userB.id);
    const indexC = leaderboard.findIndex((r: any) => r.userId === userC.id);

    if (!(indexA < indexB && indexB < indexC)) {
      throw new Error(`Ranking order incorrect: indexA=${indexA}, indexB=${indexB}, indexC=${indexC}`);
    }
    console.log(`✓ Ranking order verified: A (#${indexA + 1}) > B (#${indexB + 1}) > C (#${indexC + 1})`);

    // 3. Test HTTP API endpoint
    console.log("\n--- Checking HTTP API endpoint: GET /api/v1/users/leaderboard ---");
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    const res = await fetch(`http://localhost:${port}/api/v1/users/leaderboard`);
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }
    const apiData: any[] = await res.json();
    console.log(`API returned ${apiData.length} leaderboard records.`);

    const apiEntryA = apiData.find((r) => r.userId === userA.id);
    if (!apiEntryA) {
      throw new Error("User A not found in API response!");
    }

    // Verify types are strict JavaScript numbers (not strings from postgres bigint)
    if (typeof apiEntryA.userId !== "number" || typeof apiEntryA.gamesPlayed !== "number" ||
        typeof apiEntryA.wins !== "number" || typeof apiEntryA.losses !== "number" ||
        typeof apiEntryA.draws !== "number" || typeof apiEntryA.winRate !== "number") {
      throw new Error(`Types are not numbers in API response: ${JSON.stringify(apiEntryA)}`);
    }
    console.log("✓ API response types verified (all numeric fields are true JavaScript numbers)");

    server.close();
    console.log("\n>>> ALL BACKEND LEADERBOARD TESTS PASSED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    // Clean up
    console.log("\n--- Cleaning up test records ---");
    if (createdRoomIds.length > 0) {
      await pool.query(`DELETE FROM games WHERE room_id = ANY($1)`, [createdRoomIds]);
    }
    const userIdsToClean = [userA?.id, userB?.id, userC?.id, userD?.id, 13, 14, 15, 16].filter(Boolean);
    if (userIdsToClean.length > 0) {
      await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [userIdsToClean]);
    }
    console.log("✓ Cleanup completed cleanly");
    await pool.end();
  }
}

runLeaderboardTests();
