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
});
