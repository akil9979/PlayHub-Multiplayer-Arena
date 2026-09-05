import type { GameHistory } from "../types/game";

type GameHistoryProps = {
  games: GameHistory[];
  userId: number | undefined;
};

function GameHistoryComponent({ games, userId }: GameHistoryProps) {
  return (
    <>
      <h2>Game History</h2>
      <table>
        <thead>
          <tr>
            <th>Room ID</th>
            <th>Circle User</th>
            <th>Cross User</th>
            <th>Winner</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
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

            return (
              <tr key={game.id}>
                <td>{game.room_id}</td>
                <td>{game.circle_user_id}</td>
                <td>{game.cross_user_id}</td>
                <td>{result}</td>
                <td>{game.status}</td>
                <td>{game.created_at}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default GameHistoryComponent;
