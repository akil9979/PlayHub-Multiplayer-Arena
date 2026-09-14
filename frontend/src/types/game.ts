export type Player = "circle" | "cross";

export type Cell = Player | null;

export type Winner = Player | "draw" ;

export interface Game {
  board: Cell[];
  currentPlayer: Player;

  winner: Winner;
}
export type GameHistory = {
  id: number;
  room_id: string;
  circle_user_id: number;
  circle_user_name: string;
  cross_user_id: number;
  cross_user_name: string;
  winner: "circle" | "cross" | "draw" | null;
  status: "completed";
  created_at: string;
};
export type GameStats = {
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
};

export interface OnlineUser {
  userId: number;
  name: string;
}

export interface ChallengeParticipant {
  userId: number;
  name: string;
}

export interface ChallengeReceivedPayload {
  challengeId: string;
  challenger: ChallengeParticipant;
  createdAt: number;
}

export interface ChallengeSentPayload {
  challengeId: string;
  target: ChallengeParticipant;
  createdAt: number;
}

export interface ChallengeAcceptedPayload {
  challengeId: string;
  roomId: string;
  game: Game;
  player: Player;
  opponent: ChallengeParticipant;
}

export interface ChallengeDeclinedPayload {
  challengeId: string;
  target: ChallengeParticipant;
  reason?: string;
}

export interface ChallengeCancelledPayload {
  challengeId: string;
  challenger?: ChallengeParticipant;
  reason?: string;
}

export interface ChallengeErrorPayload {
  message: string;
}