import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET?.trim();
const sameSite: "lax" | "none" = isProduction ? "none" : "lax";
const envFrontendUrl = process.env.FRONTEND_URL?.trim();

if (!jwtSecret) {
  throw new Error("JWT_SECRET must be configured before starting the server.");
}

if (isProduction && !envFrontendUrl) {
  throw new Error("FRONTEND_URL must be configured in production.");
}

const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const configuredOrigins = envFrontendUrl
  ? envFrontendUrl.split(",").map((url) => url.trim()).filter(Boolean)
  : ["https://playhub-multiplayer-arena-1.onrender.com"];

const allowedOrigins: string[] = Array.from(
  new Set([
    ...defaultLocalOrigins,
    ...configuredOrigins,
  ]),
);

export const config = {
  isProduction,
  jwtSecret,
  frontendOrigin: allowedOrigins,
  port: Number(process.env.PORT || "5000"),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000,
  },
};
