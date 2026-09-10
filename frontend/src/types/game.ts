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