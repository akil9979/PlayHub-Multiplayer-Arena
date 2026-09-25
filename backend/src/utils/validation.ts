export const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const isValidEmail = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isValidName = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 80;

export const isValidPassword = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length >= 6 &&
  value.length <= 128;

export const isValidRoomId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z0-9]{6}$/.test(value);

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
    isValidRoomId(payload.roomId) &&
    typeof payload.index === "number" &&
    Number.isInteger(payload.index) &&
    payload.index >= 0 &&
    payload.index < 9
  );
};
