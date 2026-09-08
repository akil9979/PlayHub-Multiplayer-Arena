import {Router} from "express";
import {authMiddleware} from "../middleware/auth.middleware";
import { getGameHistory, getGameStats } from "../controllers/userController";

const route=Router();

route.get("/history",authMiddleware,getGameHistory);
route.get("/stats",authMiddleware,getGameStats);

export default route;