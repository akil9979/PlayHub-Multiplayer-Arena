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
export const joinGameRecord = async (
  roomId: string,
  crossUserId: number,
) => {
  const result = await pool.query(
    `UPDATE games
     SET cross_user_id = $1,
         status = 'playing'
     WHERE room_id = $2
       AND cross_user_id IS NULL
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
       id,
       room_id,
       circle_user_id,
       cross_user_id,
       winner,
       status,
       created_at
     FROM games
     WHERE (circle_user_id = $1 OR cross_user_id = $1)
       AND status = 'completed'
     ORDER BY created_at DESC`,
    [userId],
  );

  return result.rows;
};