import pool from "../config/db";

export const createGameRecord = async (
  roomId: string,
  circleUserId: number,
) => {
  const result = await pool.query(
    `INSERT INTO games (room_id, circle_user_id)
     VALUES ($1, $2)
     RETURNING id, room_id, circle_user_id, cross_user_id, winner, status, created_at`,
    [roomId, circleUserId],
  );

  return result.rows[0];
};
export const joinGameRecord = async (roomId: string, crossUserId: number) => {
  const result = await pool.query(
    `UPDATE games
     SET cross_user_id = $1,
         status = 'playing'
     WHERE room_id = $2
       AND cross_user_id IS NULL
       AND circle_user_id <> $1
     RETURNING id, room_id, circle_user_id, cross_user_id, winner, status, created_at`,
    [crossUserId, roomId],
  );

  return result.rows[0];
};
export const updateGameResult = async (
  roomId: string,
  winner: "circle" | "cross" | "draw",
) => {
  const result = await pool.query(
    `UPDATE games
     SET winner = $1,
         status = 'completed'
     WHERE room_id = $2
     RETURNING id, room_id, circle_user_id, cross_user_id, winner, status, created_at`,
    [winner, roomId],
  );

  return result.rows[0];
};
export const deleteGameRecord = async (roomId: string) => {
  const result = await pool.query(
    `DELETE FROM games
     WHERE room_id = $1
       AND status = 'waiting'
     RETURNING id, room_id`,
    [roomId],
  );

  return result.rows[0];
};
export const getUserGameHistory = async (userId: number) => {
  const result = await pool.query(
    `SELECT
       games.id,
       games.room_id,
       games.circle_user_id,
       circle_user.name AS circle_user_name,
       games.cross_user_id,
       cross_user.name AS cross_user_name,
       games.winner,
       games.status,
       games.created_at
     FROM games
     JOIN users AS circle_user
       ON games.circle_user_id = circle_user.id
     JOIN users AS cross_user
       ON games.cross_user_id = cross_user.id
     WHERE (games.circle_user_id = $1 OR games.cross_user_id = $1)
       AND games.status = 'completed'
     ORDER BY games.created_at DESC`,
    [userId],
  );

  return result.rows;
};

export const getUserGameStats = async (userId: number) => {
  const result = await pool.query(
    `SELECT
  COUNT(*) AS games_played,

  COUNT(
    CASE
      WHEN (circle_user_id = $1 AND winner = 'circle')
        OR (cross_user_id = $1 AND winner = 'cross')
      THEN 1
    END
  ) AS wins,

  COUNT(
    CASE
      WHEN (circle_user_id = $1 AND winner = 'cross')
        OR (cross_user_id = $1 AND winner = 'circle')
      THEN 1
    END
  ) AS losses,

  COUNT(
    CASE
      WHEN winner = 'draw'
      THEN 1
    END
  ) AS draws

FROM games
WHERE (circle_user_id = $1 OR cross_user_id = $1)
  AND status = 'completed'
    `,
    [userId],
  );

  return result.rows[0];
};

export const getLeaderboard = async () => {
  const result = await pool.query(
    `WITH player_matches AS (
       -- Circle player perspective
       SELECT
         circle_user_id AS user_id,
         CASE WHEN winner = 'circle' THEN 1 ELSE 0 END AS is_win,
         CASE WHEN winner = 'cross' THEN 1 ELSE 0 END AS is_loss,
         CASE WHEN winner = 'draw' THEN 1 ELSE 0 END AS is_draw
       FROM games
       WHERE status = 'completed'
         AND circle_user_id IS NOT NULL
         AND cross_user_id IS NOT NULL

       UNION ALL

       -- Cross player perspective
       SELECT
         cross_user_id AS user_id,
         CASE WHEN winner = 'cross' THEN 1 ELSE 0 END AS is_win,
         CASE WHEN winner = 'circle' THEN 1 ELSE 0 END AS is_loss,
         CASE WHEN winner = 'draw' THEN 1 ELSE 0 END AS is_draw
       FROM games
       WHERE status = 'completed'
         AND circle_user_id IS NOT NULL
         AND cross_user_id IS NOT NULL
     )
     SELECT
       u.id AS "userId",
       u.name AS "name",
       COUNT(*)::int AS "gamesPlayed",
       SUM(pm.is_win)::int AS "wins",
       SUM(pm.is_loss)::int AS "losses",
       SUM(pm.is_draw)::int AS "draws",
       ROUND((SUM(pm.is_win)::numeric / COUNT(*)) * 100, 1)::float AS "winRate"
     FROM player_matches pm
     JOIN users u ON u.id = pm.user_id
     GROUP BY u.id, u.name
     HAVING COUNT(*) > 0
     ORDER BY "wins" DESC, "winRate" DESC, "gamesPlayed" DESC, u.id ASC`
  );

  return result.rows;
};
