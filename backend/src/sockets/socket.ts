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
const gameManager = new GameManager();

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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    console.log("Authenticated user ID:", socket.userId);

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
