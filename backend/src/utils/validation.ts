// Keep in sync with the frontend/backend copy.

// Each validate function returns an error message, or null when the value is valid.

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(input: string): string | null {
  const email = normalizeEmail(input);
  const invalid = "Enter a valid email address, like name@example.com.";

  if (!email) return "Email is required.";
  if (email.length > 254) return "Email is too long.";

  // Split into local part and domain: there must be exactly one "@".
  const parts = email.split("@");
  if (parts.length !== 2) return invalid;
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) return invalid;

  // Local part: 1-64 allowed characters, no leading/trailing dot, no "..".
  if (local.length === 0 || local.length > 64) return invalid;
  if (!/^[a-z0-9._%+-]+$/.test(local)) return invalid;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return invalid;

  // Domain: at least two labels separated by dots, each label non-empty,
  // only letters/digits/hyphens, not starting or ending with a hyphen.
  const labels = domain.split(".");
  if (labels.length < 2) return invalid;
  for (const label of labels) {
    if (!/^[a-z0-9-]+$/.test(label)) return invalid; // also rejects empty labels ("gmail....com")
    if (label.startsWith("-") || label.endsWith("-")) return invalid;
  }

  // The last label (like "com" or "in") must be letters only, at least 2 long.
  const lastLabel = labels[labels.length - 1];
  if (!lastLabel || !/^[a-z]{2,}$/.test(lastLabel)) return invalid;

  return null;
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " "); // collapse repeated spaces
}

export function validateName(input: string): string | null {
  const name = normalizeName(input);
  if (!name) return "Name is required.";
  if (name.length < 2 || name.length > 30) return "Name must be 2-30 characters.";
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) {
    return "Name can only use letters, numbers, spaces, and . _ -";
  }
  if (!/\p{L}/u.test(name)) return "Name must include at least one letter.";
  return null;
}

// Signup only. Login must NOT use this, so old accounts can still log in.
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  // bcrypt only uses the first 72 bytes, so we cap the size in bytes.
  if (new TextEncoder().encode(password).length > 72) return "Password is too long.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}

// Login: only check that something was entered.
export function validateLoginPassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (new TextEncoder().encode(password).length > 72) return "Password is too long.";
  return null;
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

// Match the character set and length the server uses when it generates codes.
export function validateRoomCode(input: string): string | null {
  const code = normalizeRoomCode(input);
  if (!code) return "Enter the room code.";
  if (!/^[A-Z0-9]{6}$/.test(code)) return "Room code must be 6 letters or numbers.";
  return null;
}

// --- Compatibility exports for existing backend logic ---

export const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const isValidEmail = (value: unknown): value is string =>
  typeof value === "string" && validateEmail(value) === null;

export const isValidName = (value: unknown): value is string =>
  typeof value === "string" && validateName(value) === null;

export const isValidPassword = (value: unknown): value is string =>
  typeof value === "string" && validatePassword(value) === null;

export const isValidRoomId = (value: unknown): value is string =>
  typeof value === "string" && validateRoomCode(value) === null && value === normalizeRoomCode(value);

export const isValidChallengeId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 100 &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const isValidTargetUserPayload = (
  value: unknown,
): value is { targetUserId: number } => {
  if (!value || typeof value !== "object") return false;
  const payload = value as { targetUserId?: unknown };
  return isPositiveInteger(payload.targetUserId);
};

export const isValidChallengePayload = (
  value: unknown,
): value is { challengeId: string } => {
  if (!value || typeof value !== "object") return false;
  const payload = value as { challengeId?: unknown };
  return isValidChallengeId(payload.challengeId);
};

export const isValidMovePayload = (
  value: unknown,
): value is { roomId: string; index: number } => {
  if (!value || typeof value !== "object") return false;
  const payload = value as { roomId?: unknown; index?: unknown };
  return (
    typeof payload.roomId === "string" &&
    validateRoomCode(payload.roomId) === null &&
    typeof payload.index === "number" &&
    Number.isInteger(payload.index) &&
    payload.index >= 0 &&
    payload.index < 9
  );
};
