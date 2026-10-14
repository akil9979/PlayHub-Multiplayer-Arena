
import http from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import { strict as assert } from "node:assert";
import { io as Client } from "socket.io-client";

import { initializeSocket } from "./src/sockets/socket";
import pool from "./src/config/db";

type TestSocket = ReturnType<typeof Client>;

interface OnlineUser {
  userId: number;
  name: string;
}

interface ChallengeErrorPayload {
  message: string;
}

interface ChallengeReceivedPayload {
  challengeId: string;
  challenger: {
    userId: number;
    name: string;
  };
}

interface ChallengeSentPayload {
  challengeId: string;
  target: {
    userId: number;
    name: string;
  };
}

interface ChallengeAcceptedPayload {
  challengeId: string;
  roomId: string;
  player: "circle" | "cross";
}

interface ChallengeDeclinedPayload {
  challengeId: string;
  target: {
    userId: number;
    name: string;
  };
  reason?: string;
}

interface GameUpdatedPayload {
  board: Array<"circle" | "cross" | null>;
  currentPlayer: "circle" | "cross";
  winner: "circle" | "cross" | "draw" | null;
}

interface WaitOptions<T> {
  timeoutMs?: number;
  predicate?: (payload: T) => boolean;
}

const EVENT_TIMEOUT_MS = 5_000;

/**
 * Fail closed if the dedicated test environment is not configured.
 * Never silently fall back to a development or production database.
 */
function validateTestEnvironment(): string {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Refusing to run integration tests: NODE_ENV must be 'test'.",
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
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
  }

  if (actualHost.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(
      "Refusing to run: DATABASE_URL host does not match TEST_DATABASE_HOST.",
    );
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be a strong, test-only secret of at least 32 characters.",
    );
  }

  return secret;
}

const JWT_SECRET = validateTestEnvironment();

/**
 * Wait for one Socket.IO event, rejecting on timeout or connection error.
 *
 * Register this promise BEFORE emitting the event that should trigger it.
 */
function waitForEvent<T>(
  socket: TestSocket,
  eventName: string,
  options: WaitOptions<T> = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? EVENT_TIMEOUT_MS;

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
      socket.off("connect_error", onConnectError);
    };

    const onEvent = (payload: T) => {
      if (settled) return;

      if (options.predicate && !options.predicate(payload)) {
        return;
      }

      settled = true;
      cleanup();
      resolve(payload);
    };

    const onConnectError = (error: Error) => {
      if (settled) return;

      settled = true;
      cleanup();

      reject(
        new Error(
          `Socket connection error while waiting for "${eventName}": ${error.message}`,
        ),
      );
    };

    timer = setTimeout(() => {
      if (settled) return;

      settled = true;
      cleanup();

      reject(
        new Error(
          `Timed out after ${timeoutMs} ms waiting for Socket.IO event "${eventName}".`,
        ),
      );
    }, timeoutMs);

    socket.on(eventName, onEvent);
    socket.once("connect_error", onConnectError);
  });
}

/**
 * Listen for connection and online presence BEFORE connecting.
 *
 * The server currently awaits a database lookup during its connection
 * handler. Waiting for online-users prevents the test from emitting
 * challenge events before the user has been registered as online.
 */
async function connectClientAndWaitForPresence(
  socket: TestSocket,
  userId: number,
): Promise<void> {
  const connectedPromise = waitForEvent<void>(
    socket,
    "connect",
  );

  const presencePromise = waitForEvent<OnlineUser[]>(
    socket,
    "online-users",
    {
      predicate: (users) =>
        Array.isArray(users) &&
        users.some((user) => user.userId === userId),
    },
  );

  socket.connect();

  await Promise.all([connectedPromise, presencePromise]);
}

/**
 * Ask the operating system for an available local port instead of relying
 * on a fixed port that may already be occupied.
 */
async function listenOnAvailablePort(
  server: http.Server,
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);

      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Could not determine the test server port."));
        return;
      }

      resolve(address.port);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
}

function createClient(
  userId: number,
  port: number,
): TestSocket {
  const token = jwt.sign({ userId }, JWT_SECRET);

  return Client(`http://127.0.0.1:${port}`, {
    autoConnect: false,
    transports: ["websocket"],
    extraHeaders: {
      cookie: `token=${token}`,
    },
  });
}

async function runTests(): Promise<void> {
  console.log("--- Starting PlayHub Challenge Feature Test Suite ---");

  const app = express();
  const server = http.createServer(app);
  const ioServer = initializeSocket(server);

  const clients: TestSocket[] = [];
  let createdUserIds: number[] = [];
  let testPassed = false;
  let cleanupSucceeded = true;

  try {
    const testPort = await listenOnAvailablePort(server);

    console.log(`Test server running on port ${testPort}`);

    // ----------------------------------------------------
    // Create two unique test users.
    // Never depend on hardcoded development user IDs.
    // ----------------------------------------------------

    const testSuffix = randomUUID().replaceAll("-", "");

    const userAEmail = `challenge-a-${testSuffix}@test.local`;
    const userBEmail = `challenge-b-${testSuffix}@test.local`;

    console.log("\nCreating isolated integration-test users...");

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3), ($4, $5, $6)
       RETURNING id, email`,
      [
        `ChallengeTestA_${testSuffix}`,
        userAEmail,
        "integration-test-placeholder",
        `ChallengeTestB_${testSuffix}`,
        userBEmail,
        "integration-test-placeholder",
      ],
    );

    // Record every returned ID before further validation so cleanup
    // can remove successfully created accounts if validation fails.
    createdUserIds = userResult.rows
      .map((row: { id: number | string }) => Number(row.id))
      .filter((id: number) => Number.isSafeInteger(id) && id > 0);

    const userARecord = userResult.rows.find(
      (row: { id: number | string; email: string }) =>
        row.email === userAEmail,
    );

    const userBRecord = userResult.rows.find(
      (row: { id: number | string; email: string }) =>
        row.email === userBEmail,
    );

    if (!userARecord || !userBRecord || createdUserIds.length !== 2) {
      throw new Error(
        "Could not create and identify both integration-test users.",
      );
    }

    const userAId = Number(userARecord.id);
    const userBId = Number(userBRecord.id);

    assert.ok(userAId > 0, "User A must have a valid database ID.");
    assert.ok(userBId > 0, "User B must have a valid database ID.");
    assert.notEqual(userAId, userBId, "Test users must be distinct.");

    console.log("Created two isolated test users.");

    // ----------------------------------------------------
    // Connect User A and wait for server-side presence.
    // ----------------------------------------------------

    const clientA = createClient(userAId, testPort);
    clients.push(clientA);

    await connectClientAndWaitForPresence(clientA, userAId);

    // ----------------------------------------------------
    // TEST 1: Self-challenge prevention
    // ----------------------------------------------------

    console.log("\n[TEST 1] Self-challenge prevention...");

    const selfChallengePromise =
      waitForEvent<ChallengeErrorPayload>(
        clientA,
        "challenge-error",
      );

    clientA.emit("send-challenge", {
      targetUserId: userAId,
    });

    const selfChallengeError = await selfChallengePromise;

    assert.equal(
      selfChallengeError.message,
      "You cannot challenge yourself.",
    );

    console.log("PASS: Self-challenge was rejected.");

    // ----------------------------------------------------
    // TEST 2: Challenge an offline player
    // User B exists in the database but is not connected.
    // ----------------------------------------------------

    console.log("\n[TEST 2] Challenge to an offline player...");

    const offlineErrorPromise =
      waitForEvent<ChallengeErrorPayload>(
        clientA,
        "challenge-error",
      );

    clientA.emit("send-challenge", {
      targetUserId: userBId,
    });

    const offlineError = await offlineErrorPromise;

    assert.equal(
      offlineError.message,
      "Player is currently offline.",
    );

    console.log("PASS: Offline player was rejected.");

    // ----------------------------------------------------
    // Connect User B and wait for presence.
    // ----------------------------------------------------

    const clientB = createClient(userBId, testPort);
    clients.push(clientB);

    await connectClientAndWaitForPresence(clientB, userBId);

    // ----------------------------------------------------
    // TEST 3: Send a challenge and receive it.
    // ----------------------------------------------------

    console.log("\n[TEST 3] Send and receive challenge...");

    const challengeReceivedPromise =
      waitForEvent<ChallengeReceivedPayload>(
        clientB,
        "challenge-received",
      );

    const challengeSentPromise =
      waitForEvent<ChallengeSentPayload>(
        clientA,
        "challenge-sent",
      );

    clientA.emit("send-challenge", {
      targetUserId: userBId,
    });

    const [receivedPayload, sentPayload] = await Promise.all([
      challengeReceivedPromise,
      challengeSentPromise,
    ]);

    assert.ok(
      receivedPayload.challengeId,
      "Received challenge must have an ID.",
    );

    assert.equal(
      receivedPayload.challenger.userId,
      userAId,
    );

    assert.equal(
      sentPayload.challengeId,
      receivedPayload.challengeId,
      "Sender and recipient must receive the same challenge ID.",
    );

    const challengeId = receivedPayload.challengeId;

    console.log("PASS: Challenge delivered to User B.");

    // ----------------------------------------------------
    // TEST 4: Prevent a duplicate pending challenge.
    // ----------------------------------------------------

    console.log("\n[TEST 4] Duplicate challenge prevention...");

    const duplicateErrorPromise =
      waitForEvent<ChallengeErrorPayload>(
        clientA,
        "challenge-error",
      );

    clientA.emit("send-challenge", {
      targetUserId: userBId,
    });

    const duplicateError = await duplicateErrorPromise;

    assert.equal(
      duplicateError.message,
      "A challenge is already pending with this player.",
    );

    console.log("PASS: Duplicate challenge was rejected.");

    // ----------------------------------------------------
    // TEST 5: Accept a challenge and create a match.
    // ----------------------------------------------------

    console.log("\n[TEST 5] Accept challenge and create match...");

    const acceptedByA =
      waitForEvent<ChallengeAcceptedPayload>(
        clientA,
        "challenge-accepted",
      );

    const acceptedByB =
      waitForEvent<ChallengeAcceptedPayload>(
        clientB,
        "challenge-accepted",
      );

    clientB.emit("accept-challenge", {
      challengeId,
    });

    const [acceptedA, acceptedB] = await Promise.all([
      acceptedByA,
      acceptedByB,
    ]);

    assert.ok(acceptedA.roomId, "Room ID must not be empty.");

    assert.equal(
      acceptedA.roomId,
      acceptedB.roomId,
      "Both players must enter the same room.",
    );

    assert.equal(acceptedA.player, "circle");
    assert.equal(acceptedB.player, "cross");

    assert.equal(
      acceptedA.challengeId,
      challengeId,
    );

    assert.equal(
      acceptedB.challengeId,
      challengeId,
    );

    console.log("PASS: Both players entered the same room.");
    console.log("PASS: Player symbols were assigned correctly.");

    // ----------------------------------------------------
    // TEST 6: Synchronize a move between both players.
    // ----------------------------------------------------

    console.log("\n[TEST 6] Multiplayer move synchronization...");

    const moveUpdatedPromise =
      waitForEvent<GameUpdatedPayload>(
        clientB,
        "game-updated",
      );

    clientA.emit("make-move", {
      roomId: acceptedA.roomId,
      index: 0,
    });

    const updatedGame = await moveUpdatedPromise;

    assert.equal(
      updatedGame.board[0],
      "circle",
      "The first move should place circle at index 0.",
    );

    assert.equal(
      updatedGame.currentPlayer,
      "cross",
      "The turn should pass to cross.",
    );

    console.log("PASS: The move reached User B.");
    console.log("PASS: Board state and turn were updated.");

    // End this game through the existing leave-game flow.
    // Wait for the server's notification instead of sleeping.
    const gameLeaveNotice =
      waitForEvent<GameUpdatedPayload>(
        clientB,
        "player-disconnected",
      );

    clientA.emit("leave-game", acceptedA.roomId);

    await gameLeaveNotice;

    clientB.emit("leave-game", acceptedB.roomId);

    // ----------------------------------------------------
    // TEST 7: Decline a challenge.
    // ----------------------------------------------------

    console.log("\n[TEST 7] Challenge decline...");

    const secondChallengeReceived =
      waitForEvent<ChallengeReceivedPayload>(
        clientB,
        "challenge-received",
      );

    clientA.emit("send-challenge", {
      targetUserId: userBId,
    });

    const secondChallenge = await secondChallengeReceived;

    const declineNoticePromise =
      waitForEvent<ChallengeDeclinedPayload>(
        clientA,
        "challenge-declined",
      );

    clientB.emit("decline-challenge", {
      challengeId: secondChallenge.challengeId,
    });

    const declineNotice = await declineNoticePromise;

    assert.equal(
      declineNotice.challengeId,
      secondChallenge.challengeId,
    );

    assert.equal(
      declineNotice.target.userId,
      userBId,
    );

    console.log("PASS: Challenger was notified of the decline.");

    // ----------------------------------------------------
    // TEST 8: Notify the challenger when User B disconnects
    // while a challenge is pending.
    // ----------------------------------------------------

    console.log("\n[TEST 8] Disconnect during a pending challenge...");

    const thirdChallengeReceived =
      waitForEvent<ChallengeReceivedPayload>(
        clientB,
        "challenge-received",
      );

    clientA.emit("send-challenge", {
      targetUserId: userBId,
    });

    const thirdChallenge = await thirdChallengeReceived;

    assert.ok(thirdChallenge.challengeId);

    // Register both waits before disconnecting User B.
    const disconnectNoticePromise =
      waitForEvent<ChallengeDeclinedPayload>(
        clientA,
        "challenge-declined",
      );

    const userBOfflinePromise =
      waitForEvent<OnlineUser[]>(
        clientA,
        "online-users",
        {
          predicate: (users) =>
            Array.isArray(users) &&
            !users.some((user) => user.userId === userBId),
        },
      );

    clientB.disconnect();

    const [disconnectNotice] = await Promise.all([
      disconnectNoticePromise,
      userBOfflinePromise,
    ]);

    assert.equal(
      disconnectNotice.challengeId,
      thirdChallenge.challengeId,
    );

    assert.equal(
      disconnectNotice.reason,
      "Player went offline",
    );

    console.log("PASS: Challenger received the disconnect notice.");
    console.log("PASS: User B was removed from online presence.");

    // ----------------------------------------------------
    // TEST 9: Verify manual room creation and joining.
    // Reconnect User B using a new socket.
    // ----------------------------------------------------

    console.log("\n[TEST 9] Manual room creation and joining...");

    const clientB2 = createClient(userBId, testPort);
    clients.push(clientB2);

    await connectClientAndWaitForPresence(clientB2, userBId);

    const roomCreatedPromise =
      waitForEvent<string>(
        clientA,
        "room-created",
      );

    clientA.emit("create-room");

    const manualRoomId = await roomCreatedPromise;

    assert.ok(
      manualRoomId,
      "Manual room creation must return a room ID.",
    );

    const roomJoinedPromise =
      waitForEvent<string>(
        clientB2,
        "room-joined",
      );

    clientB2.emit("join-room", manualRoomId);

    const joinedRoomId = await roomJoinedPromise;

    assert.equal(
      joinedRoomId,
      manualRoomId,
      "The joining player must enter the requested room.",
    );

    console.log("PASS: Manual room was created.");
    console.log("PASS: Second player joined the room.");

    // Persisted rows and any remaining in-memory room state are handled
    // by the final cleanup below.

    testPassed = true;
  } catch (error) {
    console.error("\nTest suite failed:", error);
    process.exitCode = 1;
  } finally {
    // ----------------------------------------------------
    // Disconnect clients and close the temporary Socket.IO server.
    // ----------------------------------------------------

    for (const client of clients) {
      try {
        if (client.connected) {
          client.disconnect();
        }
      } catch (error) {
        cleanupSucceeded = false;
        console.error("Failed to disconnect a test client:", error);
      }
    }

    try {
      await new Promise<void>((resolve) => {
        ioServer.close(() => resolve());
      });
    } catch (error) {
      cleanupSucceeded = false;
      console.error("Failed to close the test server:", error);
    }

    // ----------------------------------------------------
    // Delete only test games and users created by this run.
    // Existing development accounts and their games are untouched.
    // ----------------------------------------------------

    try {
      if (createdUserIds.length > 0) {
        await pool.query(
          `DELETE FROM games
           WHERE circle_user_id = ANY($1::int[])
              OR cross_user_id = ANY($1::int[])`,
          [createdUserIds],
        );

        await pool.query(
          `DELETE FROM users
           WHERE id = ANY($1::int[])`,
          [createdUserIds],
        );

        console.log(
          "Temporary test users and associated game records cleaned up.",
        );
      }
    } catch (error) {
      cleanupSucceeded = false;
      process.exitCode = 1;

      console.error(
        "Test database cleanup failed. Check for leftover test records.",
        error,
      );
    } finally {
      try {
        await pool.end();
      } catch (error) {
        cleanupSucceeded = false;
        process.exitCode = 1;
        console.error("Failed to close the PostgreSQL pool:", error);
      }
    }
  }

  if (testPassed && cleanupSucceeded) {
    console.log("\n==========================================");
    console.log("ALL 9 TEST SCENARIOS PASSED SUCCESSFULLY!");
    console.log("Test server and database pool closed.");
    console.log("Test records cleaned up.");
    console.log("==========================================");
  } else {
    process.exitCode = 1;

    if (testPassed && !cleanupSucceeded) {
      console.error(
        "Scenarios passed, but cleanup was not fully successful.",
      );
    }
  }
}

runTests().catch((error) => {
  console.error("Unexpected test runner failure:", error);
  process.exitCode = 1;
});
