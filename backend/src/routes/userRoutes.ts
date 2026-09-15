import {Router} from "express";
import { createUser, getGameStats, getProfile, loginUser, logoutUser, getLeaderboardController } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth.middleware";

const route = Router();

route.post("/create", createUser);
route.post("/login", loginUser);
route.get("/profile", authMiddleware, getProfile);
route.get("/logout", authMiddleware, logoutUser);
route.get("/stats", authMiddleware, getGameStats);
route.get("/leaderboard", getLeaderboardController);

export default route;