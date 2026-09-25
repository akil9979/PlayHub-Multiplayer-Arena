import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET?.trim();
const sameSite: "lax" | "none" = isProduction ? "none" : "lax";
const frontendOrigin = process.env.FRONTEND_URL?.trim();

if (!jwtSecret) {
  throw new Error("JWT_SECRET must be configured before starting the server.");
}

if (isProduction && !frontendOrigin) {
  throw new Error("FRONTEND_URL must be configured in production.");
}

export const config = {
  isProduction,
  jwtSecret,
  frontendOrigin: frontendOrigin || "http://localhost:5173",
  port: Number(process.env.PORT || "5000"),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000,
  },
};
