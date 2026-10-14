import { describe, expect, it } from "vitest";
import {
  isValidMovePayload,
  normalizeEmail,
  normalizeName,
  normalizeRoomCode,
  validateEmail,
  validateLoginPassword,
  validateName,
  validatePassword,
  validateRoomCode,
} from "./validation";

describe("PlayHub input validation", () => {
  describe("validateEmail (table-driven)", () => {
    const rejectedEmails = [
      { input: "k@gmail....com", reason: "multiple dots in domain" },
      { input: "k@gmail..com", reason: "consecutive dots in domain" },
      { input: "k@.com", reason: "domain starts with a dot" },
      { input: "k@gmail.com.", reason: "domain ends with a dot" },
      { input: ".k@gmail.com", reason: "local part starts with a dot" },
      { input: "k.@gmail.com", reason: "local part ends with a dot" },
      { input: "k..k@gmail.com", reason: "consecutive dots in local part" },
      { input: "k@gmail", reason: "domain missing TLD / only one label" },
      { input: "k@gmail.c", reason: "TLD shorter than 2 characters" },
      { input: "k@-gmail.com", reason: "label starts with a hyphen" },
      { input: "k@@gmail.com", reason: "multiple @ characters" },
      { input: "k @gmail.com", reason: "contains space" },
      { input: "", reason: "empty string" },
      {
        input: `${"a".repeat(245)}@example.com`,
        reason: "a 300-character address exceeding 254 characters",
      },
    ];

    it.each(rejectedEmails)(
      "rejects email '$input' ($reason)",
      ({ input }) => {
        expect(validateEmail(input)).not.toBeNull();
      },
    );

    const acceptedEmails = [
      "k@gmail.com",
      "first.last@sub.example.co.in",
      "name+tag@example.org",
      "K@Gmail.COM",
    ];

    it.each(acceptedEmails)(
      "accepts email '%s'",
      (email) => {
        expect(validateEmail(email)).toBeNull();
      },
    );

    it("normalizes mixed-case and padded email", () => {
      expect(normalizeEmail("  K@Gmail.COM  ")).toBe("k@gmail.com");
    });
  });

  describe("validateName", () => {
    it("normalizes name by collapsing repeated spaces", () => {
      expect(normalizeName("  Alex   Smith  ")).toBe("Alex Smith");
    });

    it("accepts valid names", () => {
      expect(validateName("Alex")).toBeNull();
      expect(validateName("José Silva")).toBeNull();
      expect(validateName("Alex-Smith")).toBeNull();
      expect(validateName("John_Doe")).toBeNull();
      expect(validateName("A. Einstein")).toBeNull();
    });

    it("rejects names that are too short or too long", () => {
      expect(validateName("")).toBe("Name is required.");
      expect(validateName("A")).toBe("Name must be 2-30 characters.");
      expect(validateName("A".repeat(31))).toBe("Name must be 2-30 characters.");
    });

    it("rejects names without letters", () => {
      expect(validateName("12345")).toBe("Name must include at least one letter.");
    });

    it("rejects names with invalid characters", () => {
      expect(validateName("<script>")).toBe(
        "Name can only use letters, numbers, spaces, and . _ -",
      );
    });
  });

  describe("validatePassword (signup vs login)", () => {
    it("accepts a valid password", () => {
      expect(validatePassword("PlayHub123")).toBeNull();
    });

    it("rejects password shorter than 8 characters", () => {
      expect(validatePassword("Pass1")).toBe("Password must be at least 8 characters.");
      expect(validatePassword("1234567")).toBe("Password must be at least 8 characters.");
    });

    it("rejects password with no numbers", () => {
      expect(validatePassword("passwordLetters")).toBe(
        "Password must include at least one letter and one number.",
      );
    });

    it("rejects password with no letters", () => {
      expect(validatePassword("1234567890")).toBe(
        "Password must include at least one letter and one number.",
      );
    });

    it("rejects password longer than 72 bytes", () => {
      const pw73Bytes = "A1" + "a".repeat(71);
      expect(new TextEncoder().encode(pw73Bytes).length).toBe(73);
      expect(validatePassword(pw73Bytes)).toBe("Password is too long.");
    });

    it("allows existing weak passwords on login as long as non-empty and <=72 bytes", () => {
      expect(validateLoginPassword("123456")).toBeNull();
      expect(validateLoginPassword("password")).toBeNull();
      expect(validateLoginPassword("")).toBe("Password is required.");

      const pw73Bytes = "A1" + "a".repeat(71);
      expect(validateLoginPassword(pw73Bytes)).toBe("Password is too long.");
    });
  });

  describe("validateRoomCode", () => {
    it("normalizes and validates 6-character room codes", () => {
      expect(normalizeRoomCode(" abc123 ")).toBe("ABC123");
      expect(validateRoomCode("ABC123")).toBeNull();
      expect(validateRoomCode("abc123")).toBeNull(); // normalizeRoomCode handles uppercase
    });

    it("rejects room codes that are empty or wrong length/chars", () => {
      expect(validateRoomCode("")).toBe("Enter the room code.");
      expect(validateRoomCode("ABC12")).toBe("Room code must be 6 letters or numbers.");
      expect(validateRoomCode("ABC1234")).toBe("Room code must be 6 letters or numbers.");
      expect(validateRoomCode("AB-123")).toBe("Room code must be 6 letters or numbers.");
    });

    it("validates move payload with room ID", () => {
      expect(isValidMovePayload({ roomId: "ABC123", index: 0 })).toBe(true);
      expect(isValidMovePayload({ roomId: "ABC123", index: 9 })).toBe(false);
      expect(isValidMovePayload({ roomId: "invalid", index: 0 })).toBe(false);
    });
  });
});
