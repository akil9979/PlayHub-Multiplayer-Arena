import {Router} from "express";
import {authMiddleware} from "../middleware/auth.middleware";
import { getGameHistory } from "../controllers/userController";

const route=Router();

route.get("/history",authMiddleware,getGameHistory);

export default route;