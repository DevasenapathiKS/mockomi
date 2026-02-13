import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../core/logger';

mongoose.set('strictQuery', true);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
  } catch (error: unknown) {
    logger.fatal({ error }, 'Database connection failed');
    process.exit(1);
  }
}
