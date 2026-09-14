import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { generateRoomId } from "../utils/generateRoomId";
import { GameManager } from "../games/gameManager";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";

import {
  createGameRecord,
  joinGameRecord,
  updateGameResult,
  deleteGameRecord,
} from "../models/gameModel";
import { OnlineUserManager } from "../utils/onlineUserManager";
import { ChallengeManager } from "../utils/challengeManager";

const gameManager = new GameManager();
const onlineUserManager = new OnlineUserManager();
const challengeManager = new ChallengeManager();

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      return next(new Error("Authentication required"));
    }

    const parsedCookies = cookie.parseCookie(cookies);
    const token = parsedCookies.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return next(new Error("JWT secret is not configured"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      socket.userId = decoded.userId;
      console.log("Authenticated user:", decoded.userId);

      next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);
    console.log("Authenticated user ID:", socket.userId);

    // Track online user presence
    if (socket.userId) {
      const onlineUsers = await onlineUserManager.addUser(
        socket.userId,
        socket.id,
      );
      io.emit("online-users", onlineUsers);
    }

    socket.on("get-online-users", () => {
      socket.emit("online-users", onlineUserManager.getOnlineUsers());
    });

    // ==========================================
    // CHALLENGE / INVITATION SYSTEM
    // ==========================================

    socket.on(
      "send-challenge",
      async ({ targetUserId }: { targetUserId: number }) => {
        try {
          challengeManager.cleanExpired();

          const challengerUserId = socket.userId;
          if (!challengerUserId) {
            socket.emit("challenge-error", {
              message: "Authentication required to challenge.",
            });
            return;
          }

          if (challengerUserId === targetUserId) {
            socket.emit("challenge-error", {
              message: "You cannot challenge yourself.",
            });
            return;
          }

          if (!onlineUserManager.isUserOnline(targetUserId)) {
            socket.emit("challenge-error", {
              message: "Player is currently offline.",
            });
            return;
          }

          const targetSocketId =
            onlineUserManager.getPrimarySocketId(targetUserId);
          if (!targetSocketId) {
            socket.emit("challenge-error", {
              message: "Player is currently unavailable.",
            });
            return;
          }

          const existingChallenge = challengeManager.getPendingChallengeBetween(
            challengerUserId,
            targetUserId,
          );
          if (existingChallenge) {
            socket.emit("challenge-error", {
              message: "A challenge is already pending with this player.",
            });
            return;
          }

          const challengerUser = onlineUserManager.getUser(challengerUserId);
          const targetUser = onlineUserManager.getUser(targetUserId);

          const challengerName = challengerUser?.name || "Player";
          const targetName = targetUser?.name || "Player";

          const challenge = challengeManager.createChallenge({
            challengerUserId,
            challengerName,
            challengerSocketId: socket.id,
            challengedUserId: targetUserId,
            challengedName: targetName,
            challengedSocketId: targetSocketId,
          });

          // Notify target player in real time
          io.to(targetSocketId).emit("challenge-received", {
            challengeId: challenge.id,
            challenger: {
              userId: challengerUserId,
              name: challengerName,
            },
            createdAt: challenge.createdAt,
          });

          // Notify challenger of successful dispatch
          socket.emit("challenge-sent", {
            challengeId: challenge.id,
            target: {
              userId: targetUserId,
              name: targetName,
            },
            createdAt: challenge.createdAt,
          });

          console.log(
            `[Challenge] ${challengerName} (#${challengerUserId}) challenged ${targetName} (#${targetUserId})`,
          );
        } catch (err) {
          console.error("Failed to send challenge:", err);
          socket.emit("challenge-error", {
            message: "Failed to send challenge.",
          });
        }
      },
    );

    socket.on(
      "accept-challenge",
      async ({ challengeId }: { challengeId: string }) => {
        try {
          challengeManager.cleanExpired();

          const challengedUserId = socket.userId;
          const challenge = challengeManager.getChallenge(challengeId);

          if (!challenge || challenge.status !== "pending") {
            socket.emit("challenge-error", {
              message: "Challenge has expired or is no longer valid.",
            });
            return;
          }

          if (challenge.challengedUserId !== challengedUserId) {
            socket.emit("challenge-error", {
              message: "You are not authorized to accept this challenge.",
            });
            return;
          }

          // Verify challenger is still online and connected
          if (!onlineUserManager.isUserOnline(challenge.challengerUserId)) {
            challengeManager.removeChallenge(challengeId);
            socket.emit("challenge-error", {
              message: "Challenger is no longer online.",
            });
            return;
          }

          const challengerSocket = io.sockets.sockets.get(
            challenge.challengerSocketId,
          );
          if (!challengerSocket) {
            challengeManager.removeChallenge(challengeId);
            socket.emit("challenge-error", {
              message: "Challenger has disconnected.",
            });
            return;
          }

          // Remove challenge from pending list
          challengeManager.updateStatus(challengeId, "accepted");
          challengeManager.removeChallenge(challengeId);

          // Create match room using existing game/room flow
          const roomId = generateRoomId();

          const gameRecord = await createGameRecord(
            roomId,
            challenge.challengerUserId,
          );
          await joinGameRecord(roomId, challenge.challengedUserId);

          const game = gameManager.createGame(
            roomId,
            challenge.challengerSocketId,
            challenge.challengerUserId,
          );
          gameManager.joinGame(roomId, socket.id, challenge.challengedUserId);

          // Make sure both sockets join the same room
          challengerSocket.join(roomId);
          socket.join(roomId);

          console.log(
            `[Challenge Accepted] Room ${roomId} created for ${challenge.challengerName} vs ${challenge.challengedName}. DB record:`,
            gameRecord,
          );

          // Notify both players of the created game/room
          challengerSocket.emit("challenge-accepted", {
            challengeId,
            roomId,
            game,
            player: "circle",
            opponent: {
              userId: challenge.challengedUserId,
              name: challenge.challengedName,
            },
          });

          socket.emit("challenge-accepted", {
            challengeId,
            roomId,
            game,
            player: "cross",
            opponent: {
              userId: challenge.challengerUserId,
              name: challenge.challengerName,
            },
          });

          // Emit existing standard game setup events for seamless game synchronization
          challengerSocket.emit("room-created", roomId);
          challengerSocket.emit("game-created", game);
          challengerSocket.emit("player-assigned", "circle");
          challengerSocket.emit("player-joined");

          socket.emit("room-joined", roomId);
          socket.emit("game-created", game);
          socket.emit("player-assigned", "cross");
          socket.emit("player-joined");
        } catch (err) {
          console.error("Failed to accept challenge:", err);
          socket.emit("challenge-error", {
            message: "Failed to initialize challenge match.",
          });
        }
      },
    );

    socket.on(
      "decline-challenge",
      ({ challengeId }: { challengeId: string }) => {
        try {
          const challenge = challengeManager.getChallenge(challengeId);
          if (!challenge || challenge.status !== "pending") return;

          if (challenge.challengedUserId !== socket.userId) return;

          challengeManager.updateStatus(challengeId, "declined");
          challengeManager.removeChallenge(challengeId);

          // Notify challenger
          io.to(challenge.challengerSocketId).emit("challenge-declined", {
            challengeId,
            target: {
              userId: challenge.challengedUserId,
              name: challenge.challengedName,
            },
          });

          socket.emit("challenge-declined-ack", { challengeId });
          console.log(
            `[Challenge Declined] Challenge ${challengeId} was declined`,
          );
        } catch (err) {
          console.error("Failed to decline challenge:", err);
        }
      },
    );

    socket.on(
      "cancel-challenge",
      ({ challengeId }: { challengeId: string }) => {
        try {
          const challenge = challengeManager.getChallenge(challengeId);
          if (!challenge || challenge.status !== "pending") return;

          if (challenge.challengerUserId !== socket.userId) return;

          challengeManager.updateStatus(challengeId, "cancelled");
          challengeManager.removeChallenge(challengeId);

          // Notify challenged target player
          io.to(challenge.challengedSocketId).emit("challenge-cancelled", {
            challengeId,
            challenger: {
              userId: challenge.challengerUserId,
              name: challenge.challengerName,
            },
          });

          socket.emit("challenge-cancelled-ack", { challengeId });
          console.log(
            `[Challenge Cancelled] Challenge ${challengeId} was cancelled by challenger`,
          );
        } catch (err) {
          console.error("Failed to cancel challenge:", err);
        }
      },
    );

    socket.on("create-room", async () => {
      try {
        const roomId = generateRoomId();

        const gameRecord = await createGameRecord(roomId, socket.userId);

        const game = gameManager.createGame(roomId, socket.id, socket.userId);

        socket.join(roomId);

        socket.emit("room-created", roomId);
        socket.emit("game-created", game);
        socket.emit("player-assigned", "circle");

        console.log(`Room ${roomId} created by ${socket.id}`);
        console.log("Game:", game);
        console.log("Database record:", gameRecord);
      } catch (error) {
        console.error("Failed to create game:", error);

        socket.emit("game-creation-failed");
      }
    });

    socket.on("join-room", async (joinRoomId) => {
      const room = io.sockets.adapter.rooms.get(joinRoomId);

      if (!room) {
        socket.emit("room-not-found");
        return;
      }

      if (room.size >= 2) {
        socket.emit("room-full");
        return;
      }

      try {
        const gameRecord = await joinGameRecord(joinRoomId, socket.userId);

        if (!gameRecord) {
          socket.emit("room-full");
          return;
        }

        const game = gameManager.joinGame(joinRoomId, socket.id, socket.userId);

        socket.join(joinRoomId);

        socket.emit("room-joined", joinRoomId);
        socket.emit("game-created", game);
        socket.emit("player-assigned", "cross");

        io.to(joinRoomId).emit("player-joined");

        console.log("Game:", game);
        console.log("Game DB record:", gameRecord);
      } catch (error) {
        console.error("Failed to join game:", error);
        socket.emit("join-failed");
      }
    });
    socket.on("make-move", async ({ roomId, index }) => {
      const updatedGame = gameManager.makeMove(roomId, index, socket.id);

      if (updatedGame) {
        if (updatedGame.winner) {
          try {
            const gameRecord = await updateGameResult(
              roomId,
              updatedGame.winner,
            );

            console.log("Game result saved:", gameRecord);
          } catch (error) {
            console.error("Failed to save game result:", error);
          }
        }

        io.to(roomId).emit("game-updated", updatedGame);

        console.log(
          `Player ${socket.id} made a move in room ${roomId} at index ${index}`,
        );
      }
    });
    socket.on("disconnect", async () => {
      // Remove presence tracking
      const { changed, onlineUsers } = onlineUserManager.removeUser(socket.id);
      if (changed) {
        io.emit("online-users", onlineUsers);
      }

      // Invalidate and clean up any pending challenges involving this socket/user
      const affectedChallenges = challengeManager.handleDisconnect(
        socket.id,
        socket.userId,
      );
      for (const challenge of affectedChallenges) {
        if (challenge.challengerSocketId === socket.id) {
          io.to(challenge.challengedSocketId).emit("challenge-cancelled", {
            challengeId: challenge.id,
            challenger: {
              userId: challenge.challengerUserId,
              name: challenge.challengerName,
            },
            reason: "Challenger disconnected",
          });
        } else if (challenge.challengedSocketId === socket.id) {
          io.to(challenge.challengerSocketId).emit("challenge-declined", {
            challengeId: challenge.id,
            target: {
              userId: challenge.challengedUserId,
              name: challenge.challengedName,
            },
            reason: "Player went offline",
          });
        }
      }

      const result = gameManager.handleDisconnect(socket.id);

      if (!result) {
        return;
      }

      try {
        if (result.type === "waiting-room") {
          await deleteGameRecord(result.roomId);

          console.log(`Waiting room ${result.roomId} deleted`);

          return;
        }

        await updateGameResult(result.roomId, result.game.winner!);

        io.to(result.roomId).emit("player-disconnected", result.game);

        console.log(
          `Player ${socket.id} disconnected from room ${result.roomId}`,
        );
      } catch (error) {
        console.error("Failed to handle disconnect:", error);
      }
    });
    socket.on("request-rematch", (roomId) => {
      const result = gameManager.requestRematch(roomId, socket.id);

      if (!result) {
        return;
      }

      if (result.rematchRequests.circle && result.rematchRequests.cross) {
        const newGame = gameManager.resetGame(result.roomId);

        if (newGame) {
          io.to(result.roomId).emit("rematch-accepted", newGame);
        }

        return;
      }

      socket.to(result.roomId).emit("rematch-requested");

      console.log(
        `Player ${socket.id} requested a rematch in room ${result.roomId}`,
      );
    });
    socket.on("leave-game", async (roomId) => {
      const result = gameManager.leaveGame(roomId, socket.id);

      if (!result) {
        return;
      }

      try {
        if (result.type === "waiting-room") {
          await deleteGameRecord(result.roomId);

          socket.leave(result.roomId);

          console.log(`Player ${socket.id} left waiting room ${result.roomId}`);

          return;
        }
        if (result.type === "finished-game") {
          socket.leave(result.roomId);

          socket
            .to(result.roomId)
            .emit("player-left-finished-game", result.game);

          return;
        }

        await updateGameResult(result.roomId, result.game!.winner!);

        socket.leave(result.roomId);

        socket.to(result.roomId).emit("player-disconnected", result.game);

        console.log(`Player ${socket.id} left game ${result.roomId}`);
      } catch (error) {
        console.error("Failed to handle leave-game:", error);
      }
    });
  });

  return io;
}
