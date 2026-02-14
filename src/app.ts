import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from "swagger-ui-express";

import { errorMiddleware } from './core/errorMiddleware';
import { sendSuccess } from './core/response';
import { apiLimiter } from "./core/rateLimiters";
import { logger } from './core/logger';

import { swaggerSpec } from "./config/swagger";

import { router as interviewRoutes } from "./api/routes/interviewRoutes";
import { router as progressRoutes } from "./api/routes/progressRoutes";
import { router as authRoutes } from "./api/routes/authRoutes";
import { router as interviewerRoutes } from "./api/routes/interviewerRoutes";
import { router as availabilityRoutes } from "./api/routes/availabilityRoutes";
import { router as bookingRoutes } from "./api/routes/bookingRoutes";
import { router as sessionRoutes } from "./api/routes/sessionRoutes";
import { router as adminRoutes } from "./api/routes/adminRoutes";
import { router as paymentRoutes } from "./api/routes/paymentRoutes";
import { router as candidateRoutes } from "./api/routes/candidateRoutes";



const app = express();

app.use(apiLimiter);

// Razorpay webhook needs raw body for signature verification
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
);

app.use(express.json())
app.use(cors());
app.use(helmet());

app.use(
  pinoHttp({
    logger,
  }),
);

app.get('/health', (_req, res) => {
  return sendSuccess(res, { status: 'ok' });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/interviews',apiLimiter, interviewRoutes);
app.use('/api/progress',apiLimiter, progressRoutes);
app.use('/api/auth',apiLimiter, authRoutes);
app.use('/api', apiLimiter, interviewerRoutes);
app.use('/api', apiLimiter, availabilityRoutes);
app.use('/api', apiLimiter, bookingRoutes);
app.use('/api', apiLimiter, sessionRoutes);
app.use('/api', apiLimiter, adminRoutes);
app.use('/api', apiLimiter, paymentRoutes);
app.use('/api', apiLimiter, candidateRoutes);

// Error handler must be registered last.
app.use(errorMiddleware);

export { app };

