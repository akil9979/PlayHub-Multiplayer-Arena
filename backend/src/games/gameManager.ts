import type { Game, RematchRequest,DisconnectResult } from "../types/game";
import { checkWinner } from "./checkWinner";
export class GameManager {
  private games = new Map<string, Game>();
  private rematchRequests = new Map<string, RematchRequest>();
  createGame(roomId: string, socketId: string, userId: number): Game {
    if (this.games.has(roomId)) {
      return this.games.get(roomId)!;
    }
    const game: Game = {
      board: Array(9).fill(null),
      currentPlayer: "circle",
      startingPlayer: "circle",

      players: {
        circle: socketId,
      },

      playerUserIds: {
        circle: userId,
      },

      winner: null,
    };

    this.games.set(roomId, game);
    return game;
  }

  joinGame(roomId: string, socketId: string, userId: number): Game {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error("Game not found");
    }
    game.players.cross = socketId;
    game.playerUserIds.cross = userId;
    return game;
  }

  makeMove(roomId: string, index: number, socketId: string): Game | undefined {
    const game = this.games.get(roomId);

    if (!game) {
      return;
    }
    if (!game.players.cross) {
      return;
    }
    if (game.winner !== null) {
      return;
    }
    if (index < 0 || index >= game.board.length) {
      return;
    }

    if (game.board[index] !== null) {
      return;
    }

    const expectedSocket = game.players[game.currentPlayer];

    if (expectedSocket !== socketId) {
      return;
    }

    game.board[index] = game.currentPlayer;

    const winner = checkWinner(game.board);
    if (winner != null) {
      game.winner = winner;
      return game;
    } else {
      game.currentPlayer = game.currentPlayer === "circle" ? "cross" : "circle";
    }
    return game;
  }

  handleDisconnect(socketId: string): DisconnectResult | undefined {
  for (const [roomId, game] of this.games) {
    if (game.players.cross === socketId) {
      game.winner = "circle";

      return {
        type: "active-game",
        roomId,
        game,
      };
    }

    if (game.players.circle === socketId) {
      if (!game.players.cross) {
        this.games.delete(roomId);

        return {
          type: "waiting-room",
          roomId,
        };
      }

      game.winner = "cross";

      return {
        type: "active-game",
        roomId,
        game,
      };
    }
  }

  return undefined;
}
  requestRematch(
    roomId: string,
    socketId: string,
  ): { roomId: string; rematchRequests: RematchRequest } | undefined {
    const game = this.games.get(roomId);

    if (!game) {
      return;
    }

    // Get existing request, or create a fresh one
    let request = this.rematchRequests.get(roomId);

    if (!request) {
      request = {
        circle: false,
        cross: false,
      };
    }

    // Find which player requested the rematch
    if (game.players.circle === socketId) {
      request.circle = true;
    } else if (game.players.cross === socketId) {
      request.cross = true;
    } else {
      // Socket doesn't belong to this game
      return;
    }

    // Save/update it in the Map
    this.rematchRequests.set(roomId, request);

    return {
      roomId,
      rematchRequests: request,
    };
  }

  resetGame(roomId: string): Game | undefined {
    const game = this.games.get(roomId);
    if (!game) {
      return;
    }
    game.board = Array(9).fill(null);
    game.startingPlayer = game.startingPlayer === "circle" ? "cross" : "circle";
    game.currentPlayer = game.startingPlayer;
    game.winner = null;
    this.rematchRequests.delete(roomId);
    return game;
  }
}
