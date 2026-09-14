import { randomUUID } from "node:crypto";

export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface Challenge {
  id: string;
  challengerUserId: number;
  challengerName: string;
  challengerSocketId: string;
  challengedUserId: number;
  challengedName: string;
  challengedSocketId: string;
  status: ChallengeStatus;
  createdAt: number;
}

export interface CreateChallengeInput {
  challengerUserId: number;
  challengerName: string;
  challengerSocketId: string;
  challengedUserId: number;
  challengedName: string;
  challengedSocketId: string;
}

export class ChallengeManager {
  private challenges = new Map<string, Challenge>();

  createChallenge(input: CreateChallengeInput): Challenge {
    const challenge: Challenge = {
      id: randomUUID(),
      challengerUserId: input.challengerUserId,
      challengerName: input.challengerName,
      challengerSocketId: input.challengerSocketId,
      challengedUserId: input.challengedUserId,
      challengedName: input.challengedName,
      challengedSocketId: input.challengedSocketId,
      status: "pending",
      createdAt: Date.now(),
    };

    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  getChallenge(id: string): Challenge | undefined {
    return this.challenges.get(id);
  }

  getPendingChallengeBetween(
    userId1: number,
    userId2: number,
  ): Challenge | undefined {
    for (const challenge of this.challenges.values()) {
      if (challenge.status !== "pending") continue;

      const isDirectMatch =
        challenge.challengerUserId === userId1 &&
        challenge.challengedUserId === userId2;
      const isReverseMatch =
        challenge.challengerUserId === userId2 &&
        challenge.challengedUserId === userId1;

      if (isDirectMatch || isReverseMatch) {
        return challenge;
      }
    }
    return undefined;
  }

  updateStatus(id: string, status: ChallengeStatus): Challenge | undefined {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;
    challenge.status = status;
    return challenge;
  }

  removeChallenge(id: string): boolean {
    return this.challenges.delete(id);
  }

  handleDisconnect(socketId: string, userId?: number): Challenge[] {
    const affected: Challenge[] = [];

    for (const [id, challenge] of this.challenges.entries()) {
      if (challenge.status !== "pending") continue;

      const matchesSocket =
        challenge.challengerSocketId === socketId ||
        challenge.challengedSocketId === socketId;
      const matchesUser =
        userId !== undefined &&
        (challenge.challengerUserId === userId ||
          challenge.challengedUserId === userId);

      if (matchesSocket || matchesUser) {
        challenge.status = "cancelled";
        affected.push(challenge);
        this.challenges.delete(id);
      }
    }

    return affected;
  }

  cleanExpired(maxAgeMs = 60000): Challenge[] {
    const now = Date.now();
    const expired: Challenge[] = [];

    for (const [id, challenge] of this.challenges.entries()) {
      if (now - challenge.createdAt > maxAgeMs) {
        if (challenge.status === "pending") {
          challenge.status = "expired";
          expired.push(challenge);
        }
        this.challenges.delete(id);
      }
    }

    return expired;
  }
}
