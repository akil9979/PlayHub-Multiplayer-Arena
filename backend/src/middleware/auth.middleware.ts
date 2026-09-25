import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { isPositiveInteger } from "../utils/validation";
interface JwtPayload {
  userId?: unknown;
}
export interface AuthRequest extends Request {
  user?: {
    userId: number;
  };
}
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    if (!isPositiveInteger(decoded.userId)) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};
