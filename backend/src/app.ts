import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import gameRoutes from "./routes/gameRoutes";
import { config } from "./config/env";
const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());



app.use(cors(
    {
        origin: config.frontendOrigin,
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true
    }
));

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});


app.use("/api/v1/users",userRoutes);
app.use("/api/v1/games",gameRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const isMalformedJson =
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.parse.failed";

    console.error("Request processing error:", error);
    res.status(isMalformedJson ? 400 : 500).json({
        message: isMalformedJson
            ? "Invalid request body."
            : "An unexpected server error occurred.",
    });
});

export default app;