
import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidMovePayload,
  isValidRoomId,
} from "./validation";

describe("PlayHub input validation", () => {
  it("accepts a valid email", () => {
    expect(isValidEmail("player@example.com")).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(isValidEmail("invalid-email")).toBe(false);
  });

  it("accepts a valid move payload", () => {
    expect(
      isValidMovePayload({
        roomId: "ABC123",
        index: 8,
      }),
    ).toBe(true);
  });

  it("rejects an out-of-range move", () => {
    expect(
      isValidMovePayload({
        roomId: "ABC123",
        index: 9,
      }),
    ).toBe(false);
  });

  it("rejects a lowercase room ID", () => {
    expect(isValidRoomId("abc123")).toBe(false);
  });
});
