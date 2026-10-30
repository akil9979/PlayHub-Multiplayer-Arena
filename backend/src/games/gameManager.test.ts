import { describe, expect, it } from "vitest";
import { GameManager } from "./gameManager";

describe("GameManager disconnect handling", () => {
  it("preserves the winner when a player disconnects after the game ends", () => {
    const manager = new GameManager();
    const roomId = "ABC123";

    manager.createGame(roomId, "circle-socket", 10);
    manager.joinGame(roomId, "cross-socket", 25);

    // Circle wins across the top row.
    manager.makeMove(roomId, 0, "circle-socket");
    manager.makeMove(roomId, 3, "cross-socket");
    manager.makeMove(roomId, 1, "circle-socket");
    manager.makeMove(roomId, 4, "cross-socket");

    const completedGame = manager.makeMove(roomId, 2, "circle-socket");

    expect(completedGame?.winner).toBe("circle");

    // The winner disconnects after the game has ended.
    manager.handleDisconnect("circle-socket");

    // The original result must remain unchanged.
    expect(completedGame?.winner).toBe("circle");
  });

  it("awards the remaining player a win when an active player disconnects", () => {
    const manager = new GameManager();
    const roomId = "DEF456";

    manager.createGame(roomId, "circle-socket", 10);
    manager.joinGame(roomId, "cross-socket", 25);

    const result = manager.handleDisconnect("circle-socket");
    expect(result?.type).toBe("active-game");

    if (result?.type !== "active-game") {
      throw new Error("Expected active-game result");
    }

    expect(result.game.winner).toBe("cross");
  });

  it("removes a waiting room when its creator disconnects", () => {
    const manager = new GameManager();
    const roomId = "GHI789";

    manager.createGame(roomId, "circle-socket", 10);

    const result = manager.handleDisconnect("circle-socket");

    expect(result?.type).toBe("waiting-room");
    expect(result?.roomId).toBe(roomId);

    // The same room should no longer exist in the manager.
    expect(manager.handleDisconnect("circle-socket")).toBeUndefined();
  });

  it("does not allow a rematch after a player disconnects from a finished game", () => {
    const manager = new GameManager();
    const roomId = "JKL123";

    manager.createGame(roomId, "circle-socket", 10);
    manager.joinGame(roomId, "cross-socket", 25);

    manager.makeMove(roomId, 0, "circle-socket");
    manager.makeMove(roomId, 3, "cross-socket");
    manager.makeMove(roomId, 1, "circle-socket");
    manager.makeMove(roomId, 4, "cross-socket");

    const completedGame = manager.makeMove(roomId, 2, "circle-socket");

    expect(completedGame?.winner).toBe("circle");

    const result = manager.handleDisconnect("circle-socket");

    expect(result?.type).toBe("finished-game");

    if (result?.type !== "finished-game") {
      throw new Error("Expected finished-game result");
    }

    expect(result.game.winner).toBe("circle");

    // A disconnected opponent cannot participate in a rematch.
    expect(manager.requestRematch(roomId, "cross-socket")).toBeUndefined();
  });

  it("prevents a non-player from deleting a completed game or its rematch requests", () => {
    const manager = new GameManager();
    const roomId = "MNO345";

    manager.createGame(roomId, "circle-socket", 10);
    manager.joinGame(roomId, "cross-socket", 25);

    // Complete the game (Circle wins)
    manager.makeMove(roomId, 0, "circle-socket");
    manager.makeMove(roomId, 3, "cross-socket");
    manager.makeMove(roomId, 1, "circle-socket");
    manager.makeMove(roomId, 4, "cross-socket");
    const completedGame = manager.makeMove(roomId, 2, "circle-socket");
    expect(completedGame?.winner).toBe("circle");

    // Cross requests a rematch
    const rematchResult = manager.requestRematch(roomId, "cross-socket");
    expect(rematchResult?.rematchRequests.cross).toBe(true);

    // An unauthorized third-party socket attempts to leave the completed game
    const nonPlayerResult = manager.leaveGame(roomId, "unauthorized-socket");
    expect(nonPlayerResult).toBeUndefined();

    // Verify game state and rematch requests are still intact for legitimate players
    const circleRematchResult = manager.requestRematch(roomId, "circle-socket");
    expect(circleRematchResult).toBeDefined();
    expect(circleRematchResult?.rematchRequests.cross).toBe(true);
    expect(circleRematchResult?.rematchRequests.circle).toBe(true);

    // Verify a legitimate player can still leave the finished game
    const legitLeaveResult = manager.leaveGame(roomId, "circle-socket");
    expect(legitLeaveResult?.type).toBe("finished-game");
    expect(legitLeaveResult?.roomId).toBe(roomId);
  });
});

describe("GameManager game lifecycle and rematch", () => {
  it("enforces turn order, rejects invalid moves, and alternates starting player upon rematch", () => {
    const manager = new GameManager();
    const roomId = "PQR789";

    manager.createGame(roomId, "circle-socket", 10);

    // Moves cannot be made before an opponent joins
    expect(manager.makeMove(roomId, 0, "circle-socket")).toBeUndefined();

    manager.joinGame(roomId, "cross-socket", 25);

    // Cross cannot move first when Circle is the starting player
    expect(manager.makeMove(roomId, 0, "cross-socket")).toBeUndefined();

    // Circle makes valid first move
    const move1 = manager.makeMove(roomId, 0, "circle-socket");
    expect(move1?.board[0]).toBe("circle");
    expect(move1?.currentPlayer).toBe("cross");

    // Circle cannot move twice in a row
    expect(manager.makeMove(roomId, 1, "circle-socket")).toBeUndefined();

    // Cross cannot play in an already occupied square
    expect(manager.makeMove(roomId, 0, "cross-socket")).toBeUndefined();

    // Complete the match with Circle winning top row
    manager.makeMove(roomId, 3, "cross-socket");
    manager.makeMove(roomId, 1, "circle-socket");
    manager.makeMove(roomId, 4, "cross-socket");
    const completedGame = manager.makeMove(roomId, 2, "circle-socket");
    expect(completedGame?.winner).toBe("circle");

    // Moves after completion are rejected
    expect(manager.makeMove(roomId, 5, "cross-socket")).toBeUndefined();

    // Both players request a rematch
    manager.requestRematch(roomId, "circle-socket");
    const bothRequested = manager.requestRematch(roomId, "cross-socket");
    expect(bothRequested?.rematchRequests.circle).toBe(true);
    expect(bothRequested?.rematchRequests.cross).toBe(true);

    // Reset game for rematch
    const rematchGame = manager.resetGame(roomId);
    expect(rematchGame?.winner).toBeNull();
    expect(rematchGame?.board.every((cell) => cell === null)).toBe(true);
    expect(rematchGame?.startingPlayer).toBe("cross");
    expect(rematchGame?.currentPlayer).toBe("cross");

    // In the rematch, Circle cannot move first; Cross must make the first move
    expect(manager.makeMove(roomId, 0, "circle-socket")).toBeUndefined();
    const rematchMove1 = manager.makeMove(roomId, 4, "cross-socket");
    expect(rematchMove1?.board[4]).toBe("cross");
    expect(rematchMove1?.currentPlayer).toBe("circle");
  });

  it("rejects rematch requests during an active game and enforces eligibility", () => {
    const manager = new GameManager();
    const roomId = "ELIG123";

    manager.createGame(roomId, "circle-socket", 10);
    manager.joinGame(roomId, "cross-socket", 25);

    // 1. A player cannot request a rematch during an active game (before any move)
    expect(manager.requestRematch(roomId, "circle-socket")).toBeUndefined();
    expect(manager.requestRematch(roomId, "cross-socket")).toBeUndefined();

    // 2. An active-game request does not create a rematchRequests entry
    manager.makeMove(roomId, 0, "circle-socket");
    expect(manager.requestRematch(roomId, "circle-socket")).toBeUndefined();
    expect(manager.requestRematch(roomId, "cross-socket")).toBeUndefined();

    // 3. Unauthorized sockets cannot request rematches
    expect(manager.requestRematch(roomId, "stranger-socket")).toBeUndefined();

    // Complete the match with Circle winning top row: 0, 1, 2
    manager.makeMove(roomId, 3, "cross-socket");
    manager.makeMove(roomId, 1, "circle-socket");
    manager.makeMove(roomId, 4, "cross-socket");
    const finishedGame = manager.makeMove(roomId, 2, "circle-socket");
    expect(finishedGame?.winner).toBe("circle");

    // Stranger still cannot request rematch on finished game
    expect(manager.requestRematch(roomId, "stranger-socket")).toBeUndefined();

    // 4. A legitimate player can request a rematch after the game finishes
    const circleRematch = manager.requestRematch(roomId, "circle-socket");
    expect(circleRematch).toBeDefined();
    expect(circleRematch?.rematchRequests.circle).toBe(true);
    expect(circleRematch?.rematchRequests.cross).toBe(false);

    // 5. Both players can request and successfully complete the mutual rematch flow
    const crossRematch = manager.requestRematch(roomId, "cross-socket");
    expect(crossRematch).toBeDefined();
    expect(crossRematch?.rematchRequests.circle).toBe(true);
    expect(crossRematch?.rematchRequests.cross).toBe(true);

    // 6. The starting player still alternates after a successful rematch
    const newGame = manager.resetGame(roomId);
    expect(newGame?.winner).toBeNull();
    expect(newGame?.board.every((cell) => cell === null)).toBe(true);
    expect(newGame?.startingPlayer).toBe("cross");
    expect(newGame?.currentPlayer).toBe("cross");

    // Once reset, the game is active again, so rematch requests are rejected again
    expect(manager.requestRematch(roomId, "cross-socket")).toBeUndefined();
    expect(manager.requestRematch(roomId, "circle-socket")).toBeUndefined();
  });
});
