
import { describe, expect, it } from "vitest";
import { checkWinner } from "./checkWinner";
import type { Cell } from "../types/game";

describe("checkWinner", () => {
  it("detects a horizontal win", () => {
    const board: Cell[] = [
      "cross", "cross", "cross",
      null, null, null,
      null, null, null,
    ];

    expect(checkWinner(board)).toBe("cross");
  });

  it("detects a diagonal win", () => {
    const board: Cell[] = [
      "circle", null, null,
      null, "circle", null,
      null, null, "circle",
    ];

    expect(checkWinner(board)).toBe("circle");
  });

  it("returns null while the game is ongoing", () => {
    const board: Cell[] = Array(9).fill(null);

    expect(checkWinner(board)).toBeNull();
  });

  it("detects a draw", () => {
    const board: Cell[] = [
      "cross", "circle", "cross",
      "cross", "circle", "circle",
      "circle", "cross", "cross",
    ];

    expect(checkWinner(board)).toBe("draw");
  });
});
