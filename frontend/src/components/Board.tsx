import Square from "./Square/Square";
import { socket } from "../Socket";
import type { Game, Player } from "../types/game";

type BoardProps = {
  game: Game | null;
  roomId: string;
  player: Player | null;
};

function Board({ game, roomId, player }: BoardProps) {
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
    <div className="mx-auto mb-8 grid w-fit grid-cols-3 gap-2 rounded-2xl bg-slate-800 p-3 shadow-xl">
      {game.board.map((cell, index) => (
        <Square
          value={cell}
          key={index}
          onClick={() => handleMakeMove(index)}
        />
      ))}
    </div>
  );
}

export default Board;