import type { GameHistory } from "../types/game";

type GameHistoryProps = {
  games: GameHistory[];
  userId: number | undefined;
};

function GameHistoryComponent({ games, userId }: GameHistoryProps) {
  return (
    <section>
      <h2>Game History</h2>
      <div className="grid grid-cols-2 gap-4 font-semibold md:grid-cols-6">
        <div>Room ID</div>
        <div>Circle User</div>
        <div>Cross User</div>
        <div>Winner</div>
        <div>Status</div>
        <div>Created At</div>
      </div>

      <div>
        {games.map((game) => {
          const result =
            game.winner === "draw"
              ? "Draw"
              : game.winner === "circle"
                ? game.circle_user_id === userId
                  ? "You won"
                  : "You lost"
                : game.cross_user_id === userId
                  ? "You won"
                  : "You lost";

          const resultClass =
            result === "You won"
              ? "font-semibold text-green-400"
              : result === "You lost"
                ? "font-semibold text-red-400"
                : "font-semibold text-yellow-400";

          return (
            <div
              key={game.id}
              className="grid grid-cols-2 gap-4 border-b py-3 md:grid-cols-6"
            >
              <div>
                <span className="font-semibold md:hidden">Room ID: </span>
                {game.room_id}
              </div>

              <div>
                <span className="font-semibold md:hidden">Circle User: </span>
                {game.circle_user_id}
              </div>

              <div>
                <span className="font-semibold md:hidden">Cross User: </span>
                {game.cross_user_id}
              </div>

              <div className={resultClass}>
                <span className="font-semibold md:hidden">Winner: </span>
                {result}
              </div>

              <div>
                <span className="font-semibold md:hidden">Status: </span>
                {game.status}
              </div>

              <div>
                <span className="font-semibold md:hidden">Created At: </span>
                {game.created_at}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default GameHistoryComponent;
