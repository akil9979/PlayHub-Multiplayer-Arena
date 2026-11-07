import Square from "./Square/Square";
import { socket } from "../Socket";
import type { Game, Player } from "../types/game";

type BoardProps = {
  game: Game | null;
  roomId: string;
  player: Player | null;
  onError?: (message: string) => void;
};

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function Board({ game, roomId, player, onError }: BoardProps) {
  const isMyTurn = game?.currentPlayer === player && game?.winner === null;

  const handleMakeMove = (index: number) => {
    if (!socket.connected) {
      onError?.("Cannot make move: not connected to game server.");
      return;
    }

    if (!game || !player) {
      return;
    }

    if (game.winner !== null) {
      return;
    }

    if (game.currentPlayer !== player) {
      return;
    }

    if (game.board[index] !== null) {
      return;
    }

    socket.emit("make-move", { roomId, index });
  };

  if (!game) {
    return null;
  }

  // Purely presentational helper to highlight winning trio
  const winningCombo = (() => {
    if (!game.winner || game.winner === "draw") return null;
    return (
      WINNING_COMBOS.find(
        ([a, b, c]) =>
          game.board[a] === game.winner &&
          game.board[b] === game.winner &&
          game.board[c] === game.winner
      ) || null
    );
  })();

  return (
    <div
      className="relative aspect-square rounded-2xl border border-zinc-800/80 bg-[#101015] p-2.5 sm:p-3.5 max-h-full max-w-full flex items-center justify-center shadow-[0_16px_50px_-12px_rgba(0,0,0,0.8)]"
      style={{
        width: "min(100cqw, 100cqh)",
        height: "min(100cqw, 100cqh)",
        aspectRatio: "1 / 1",
      }}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full h-full">
        {game.board.map((cell, index) => (
          <Square
            index={index}
            value={cell}
            key={index}
            isWinning={winningCombo ? winningCombo.includes(index) : false}
            disabled={!isMyTurn || cell !== null}
            onClick={() => handleMakeMove(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Board;
