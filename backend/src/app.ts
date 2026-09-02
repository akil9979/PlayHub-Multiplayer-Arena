import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import gameRoutes from "./routes/gameRoutes";
const app = express();
app.use(express.json());
app.use(cookieParser());



app.use(cors(
    {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
));



app.use("/api/v1/users",userRoutes);
app.use("/api/v1/games",gameRoutes);

export default app;