import Square from "./Square/Square";
import { socket } from "../Socket";
import type { Game, Player } from "../types/game";

type BoardProps = {
  game: Game | null;
  roomId: string;
  player: Player | null;
};

function Board({ game, roomId, player }: BoardProps) {
  const isMyTurn = game?.currentPlayer === player && game?.winner === null;

  const handleMakeMove = (index: number) => {
    if (!socket.connected) {
      alert("Not connected to game server.");
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

  return (
    <div
      className="relative aspect-square rounded-xl border border-[#27272a] bg-[#111113] p-2 sm:p-3 max-h-full max-w-full flex items-center justify-center"
      style={{
        width: "min(100cqw, 100cqh)",
        height: "min(100cqw, 100cqh)",
        aspectRatio: "1 / 1",
      }}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full h-full">
        {game.board.map((cell, index) => (
          <Square
            value={cell}
            key={index}
            disabled={!isMyTurn || cell !== null}
            onClick={() => handleMakeMove(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Board;