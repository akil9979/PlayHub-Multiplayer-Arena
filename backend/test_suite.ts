import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { io as Client } from "../frontend/node_modules/socket.io-client/build/esm/index.js";
import { initializeSocket } from "./src/sockets/socket";
import pool from "./src/config/db";

const JWT_SECRET = process.env.JWT_SECRET || "your_long_random_secret";
const TEST_PORT = 5055;

function createClient(userId: number): ReturnType<typeof Client> {
  const token = jwt.sign({ userId }, JWT_SECRET);
  return Client(`http://localhost:${TEST_PORT}`, {
    extraHeaders: {
      cookie: `token=${token}`,
    },
    autoConnect: true,
    transports: ["websocket"],
  });
}

async function runTests() {
  console.log("--- Starting PlayHub Challenge Feature Test Suite ---");

  const app = express();
  const server = http.createServer(app);
  const ioServer = initializeSocket(server);

  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`Test server running on port ${TEST_PORT}`);

  const userAId = 10;
  const userBId = 11;

  try {
    // ----------------------------------------------------
    // Scenario 6A: Self-Challenge Prevention
    // ----------------------------------------------------
    console.log("\n[TEST 1] Scenario: Self-challenge prevention...");
    const clientA = createClient(userAId);
    await new Promise<void>((resolve) => clientA.on("connect", () => resolve()));

    const selfChallengeError = await new Promise<string>((resolve) => {
      clientA.on("challenge-error", (err: { message: string }) => {
        resolve(err.message);
      });
      clientA.emit("send-challenge", { targetUserId: userAId });
    });
    console.log(`✓ Self-challenge was prevented: "${selfChallengeError}"`);

    // ----------------------------------------------------
    // Scenario 5: User B is offline
    // ----------------------------------------------------
    console.log("\n[TEST 2] Scenario: Target user is offline...");
    const offlineError = await new Promise<string>((resolve) => {
      clientA.once("challenge-error", (err: { message: string }) => {
        resolve(err.message);
      });
      clientA.emit("send-challenge", { targetUserId: userBId });
    });
    console.log(`✓ Offline target handled: "${offlineError}"`);

    // ----------------------------------------------------
    // Connect User B
    // ----------------------------------------------------
    const clientB = createClient(userBId);
    await new Promise<void>((resolve) => clientB.on("connect", () => resolve()));
    // Small delay to ensure both are registered in onlineUserManager
    await new Promise((r) => setTimeout(r, 200));

    // ----------------------------------------------------
    // Scenario 1 & 2 & 3: User A challenges User B, User B accepts, both enter game
    // ----------------------------------------------------
    console.log("\n[TEST 3] Scenario: User A challenges User B, User B accepts...");
    let challengeId = "";

    const challengeReceivedPromise = new Promise<any>((resolve) => {
      clientB.once("challenge-received", (data: any) => {
        resolve(data);
      });
    });

    clientA.emit("send-challenge", { targetUserId: userBId });
    const receivedPayload = await challengeReceivedPromise;
    challengeId = receivedPayload.challengeId;
    console.log(`✓ User B received challenge ID: ${challengeId} from User A (#${receivedPayload.challenger.userId})`);

    // ----------------------------------------------------
    // Scenario 6B: Duplicate challenge prevention while pending
    // ----------------------------------------------------
    console.log("\n[TEST 4] Scenario: Duplicate challenge prevention...");
    const duplicateErrorPromise = new Promise<string>((resolve) => {
      clientA.once("challenge-error", (err: { message: string }) => {
        resolve(err.message);
      });
    });
    clientA.emit("send-challenge", { targetUserId: userBId });
    const duplicateError = await duplicateErrorPromise;
    console.log(`✓ Duplicate challenge prevented: "${duplicateError}"`);

    // ----------------------------------------------------
    // User B accepts
    // ----------------------------------------------------
    console.log("\n[TEST 5] User B accepts challenge...");
    const acceptPromiseA = new Promise<any>((resolve) => {
      clientA.once("challenge-accepted", (data: any) => resolve(data));
    });
    const acceptPromiseB = new Promise<any>((resolve) => {
      clientB.once("challenge-accepted", (data: any) => resolve(data));
    });

    clientB.emit("accept-challenge", { challengeId });

    const [acceptedA, acceptedB] = await Promise.all([acceptPromiseA, acceptPromiseB]);
    console.log(`✓ User A accepted payload: Room ${acceptedA.roomId}, Player: ${acceptedA.player}`);
    console.log(`✓ User B accepted payload: Room ${acceptedB.roomId}, Player: ${acceptedB.player}`);

    if (acceptedA.roomId !== acceptedB.roomId) {
      throw new Error("Room IDs do not match!");
    }
    if (acceptedA.player !== "circle" || acceptedB.player !== "cross") {
      throw new Error("Player symbol assignments incorrect!");
    }
    console.log("✓ Both players entered the same room with correct symbols (Circle & Cross)!");

    // Verify move syncing
    console.log("\n[TEST 6] Verifying move sync in challenge match room...");
    const movePromiseB = new Promise<any>((resolve) => {
      clientB.once("game-updated", (game: any) => resolve(game));
    });
    clientA.emit("make-move", { roomId: acceptedA.roomId, index: 0 });
    const updatedGame = await movePromiseB;
    console.log(`✓ Board updated at index 0 to ${updatedGame.board[0]}, next player: ${updatedGame.currentPlayer}`);

    // Leave game to clean room
    clientA.emit("leave-game", acceptedA.roomId);
    clientB.emit("leave-game", acceptedB.roomId);
    await new Promise((r) => setTimeout(r, 200));

    // ----------------------------------------------------
    // Scenario 4: User A challenges User B, User B declines
    // ----------------------------------------------------
    console.log("\n[TEST 7] Scenario: User A challenges User B, User B declines...");
    const challengeReceived2 = new Promise<any>((resolve) => {
      clientB.once("challenge-received", (data: any) => resolve(data));
    });
    clientA.emit("send-challenge", { targetUserId: userBId });
    const rec2 = await challengeReceived2;

    const declinePromiseA = new Promise<any>((resolve) => {
      clientA.once("challenge-declined", (data: any) => resolve(data));
    });
    clientB.emit("decline-challenge", { challengeId: rec2.challengeId });
    const declinedData = await declinePromiseA;
    console.log(`✓ User A received decline notification: ${declinedData.target.name} declined`);

    // ----------------------------------------------------
    // Scenario 5: User B disconnects while challenge is pending
    // ----------------------------------------------------
    console.log("\n[TEST 8] Scenario: User B disconnects while challenge is pending...");
    const challengeReceived3 = new Promise<any>((resolve) => {
      clientB.once("challenge-received", (data: any) => resolve(data));
    });
    clientA.emit("send-challenge", { targetUserId: userBId });
    await challengeReceived3;

    const disconnectNoticePromise = new Promise<any>((resolve) => {
      clientA.once("challenge-declined", (data: any) => resolve(data));
    });
    // Disconnect User B
    clientB.disconnect();
    const disconnectNotice = await disconnectNoticePromise;
    console.log(`✓ Challenger was notified of target departure: ${disconnectNotice.reason}`);

    // ----------------------------------------------------
    // Scenario 7: Existing manual room create / join still works
    // ----------------------------------------------------
    console.log("\n[TEST 9] Scenario: Existing manual room creation / joining...");
    const clientB2 = createClient(userBId);
    await new Promise<void>((resolve) => clientB2.on("connect", () => resolve()));

    const manualRoomCreatedPromise = new Promise<string>((resolve) => {
      clientA.once("room-created", (roomId: string) => resolve(roomId));
    });
    clientA.emit("create-room");
    const manualRoomId = await manualRoomCreatedPromise;
    console.log(`✓ Manual room created: ${manualRoomId}`);

    const manualJoinedPromise = new Promise<string>((resolve) => {
      clientB2.once("room-joined", (roomId: string) => resolve(roomId));
    });
    clientB2.emit("join-room", manualRoomId);
    const joinedRoomId = await manualJoinedPromise;
    console.log(`✓ Manual room joined: ${joinedRoomId}`);

    clientA.emit("leave-game", manualRoomId);
    clientB2.emit("leave-game", joinedRoomId);

    // Clean up connections
    clientA.disconnect();
    clientB2.disconnect();
    await new Promise((r) => server.close(r));
    await pool.end();

    console.log("\n==========================================");
    console.log("ALL 9 TEST SCENARIOS PASSED SUCCESSFULLY!");
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  }
}

runTests();
