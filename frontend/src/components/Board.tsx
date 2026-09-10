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
    <div className="relative mx-auto w-fit rounded-3xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
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