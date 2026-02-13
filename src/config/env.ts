import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

type NodeEnv = 'development' | 'production';

const NODE_ENV: NodeEnv =
  (process.env.NODE_ENV as NodeEnv | undefined) ?? 'development';

const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  dailyInterviewLimit: number;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  mediaBaseUrl: string;
  mediaInternalSecret: string;
  chamcallSharedSecret: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(portValue: string): number {
  const port = Number(portValue);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portValue}`);
  }
  return port;
}

function parsePositiveInt(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }
  return parsed;
}

function buildConfig(): EnvConfig {
  const port = parsePort(getRequiredEnv('PORT'));
  const mongoUri = getRequiredEnv('MONGO_URI');
  const jwtSecret = getRequiredEnv('JWT_SECRET');
  const dailyInterviewLimit = parsePositiveInt(
    getRequiredEnv('DAILY_INTERVIEW_LIMIT'),
    'DAILY_INTERVIEW_LIMIT',
  );
  const razorpayKeyId = getRequiredEnv('RAZORPAY_KEY_ID');
  const razorpayKeySecret = getRequiredEnv('RAZORPAY_KEY_SECRET');
  const mediaBaseUrl = getRequiredEnv('MEDIA_BASE_URL');
  const mediaInternalSecret = getRequiredEnv('MEDIA_INTERNAL_SECRET');
  const chamcallSharedSecret = getRequiredEnv('CHAMCALL_SHARED_SECRET');

  return {
    nodeEnv: NODE_ENV,
    port,
    mongoUri,
    jwtSecret,
    dailyInterviewLimit,
    razorpayKeyId,
    razorpayKeySecret,
    mediaBaseUrl,
    mediaInternalSecret,
    chamcallSharedSecret,
  };
}

// Module initialization: if required env vars are missing, an error is thrown
// and the process exits with a non‑zero status.
export const config: EnvConfig = buildConfig();

// Backwards-compatible alias (prefer `config`).
export const env = config;

