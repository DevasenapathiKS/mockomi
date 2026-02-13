import pino from "pino";
import { config } from "../config/env";

export const logger = pino({
  level: config.nodeEnv === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']"
    ],
    remove: true,
  },
  transport:
    config.nodeEnv !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});
