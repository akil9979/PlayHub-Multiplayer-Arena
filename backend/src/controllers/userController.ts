import pool from "../config/db";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middleware/auth.middleware";
import { getUserGameHistory, getUserGameStats, getLeaderboard } from "../models/gameModel";
import { config } from "../config/env";
import {
  isValidEmail,
  isValidName,
  isValidPassword,
} from "../utils/validation";

const generateToken = (userId: number) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "24h" });
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
  };
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!isValidName(name) || !isValidEmail(normalizedEmail) || !isValidPassword(password)) {
    return res.status(400).json({
      message: "Please provide a valid name, email, and password of 6 to 128 characters.",
    });
  }
  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail],
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
   VALUES ($1, $2, $3)
   RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, hashedPassword],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ message: "Unable to create account. Please try again." });
  }
};
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: unknown;
    password?: unknown;
  };
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!isValidEmail(normalizedEmail) || !isValidPassword(password)) {
    return res.status(400).json({
      message: "Please provide a valid email and password.",
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1",
      [normalizedEmail],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    const token = generateToken(user.id);
    res.status(200).cookie("token", token, config.cookie).json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Failed to authenticate user:", error);
    res.status(500).json({ message: "Unable to sign in. Please try again." });
  }
};
export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const result = await pool.query(
      "SELECT id,name,email,created_at FROM users WHERE id=$1",
      [userId],
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Failed to load profile:", error);
    res.status(500).json({ message: "Unable to load profile. Please try again." });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res
    .status(200)
    .clearCookie("token", config.cookie)
    .json({ message: "Logged out successfully" });
};
export const getGameHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const result = await getUserGameHistory(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to load game history:", error);
    res.status(500).json({ message: "Unable to load game history. Please try again." });
  }
};

export const getGameStats = async (req: AuthRequest, res: Response) => {
  // get userId
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // call getUserGameStats()
  try {
    const result = await getUserGameStats(userId);
    const stats = {
      games_played: Number(result.games_played),
      wins: Number(result.wins),
      losses: Number(result.losses),
      draws: Number(result.draws),
    };
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Failed to load game stats:", error);
    return res.status(500).json({ message: "Unable to load game statistics. Please try again." });
  }
};

export const getLeaderboardController = async (_req: Request, res: Response) => {
  try {
    const rawLeaderboard = await getLeaderboard();
    const leaderboard = rawLeaderboard.map((entry) => ({
      userId: Number(entry.userId),
      name: String(entry.name),
      gamesPlayed: Number(entry.gamesPlayed),
      wins: Number(entry.wins),
      losses: Number(entry.losses),
      draws: Number(entry.draws),
      winRate: Number(entry.winRate),
    }));
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ message: "Unable to load leaderboard. Please try again." });
  }
};
