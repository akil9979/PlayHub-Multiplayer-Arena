export type Player = "circle" | "cross";

export type Cell = Player | null;

export type Winner = Player | "draw" | null;

export interface Game {
  board: Cell[];
  currentPlayer: Player;
  startingPlayer: Player;
  players: {
  circle: string;
  cross?: string;
};

playerUserIds: {
  circle: number;
  cross?: number;
};

  winner: Winner;
}

export interface RematchRequest {
  circle: boolean;
  cross: boolean;
}
export type DisconnectResult =
  | {
      type: "waiting-room";
      roomId: string;
    }
  | {
      type: "active-game";
      roomId: string;
      game: Game;
    };