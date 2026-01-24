# Critical Fixes Implementation Guide

**Priority:** P0 - Must implement before production launch  
**Timeline:** 2 weeks  
**Owner:** Backend Development Team

---

## 1. Transaction Management for Critical Operations

### Problem
Payment + coupon + interview creation operations are not atomic. If interview creation fails, coupon is already applied, leading to data inconsistency.

### Solution
Implement MongoDB transactions for atomic operations.

### Implementation

**File:** `backend/src/services/interview.service.ts`

```typescript
async createInterviewRequest(data: {
  jobSeekerId: string;
  requestedSkills: string[];
  preferredDuration?: number;
  notes?: string;
  paymentId?: string;
  couponCode?: string;
}): Promise<IInterviewDocument> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { jobSeekerId, requestedSkills, preferredDuration = 60, notes, paymentId, couponCode } = data;

    // Validate job seeker
    const jobSeekerProfile = await JobSeekerProfile.findOne({ userId: jobSeekerId }).session(session);
    if (!jobSeekerProfile) {
      throw new AppError('Job seeker profile not found', 404);
    }

    let payment = null;
    let couponApplied = false;

    // Handle coupon
    if (couponCode) {
      const validation = await couponService.validateCoupon(couponCode, jobSeekerId);
      if (!validation.valid) {
        throw new AppError(validation.message || 'Invalid or expired coupon', 400);
      }

      if (!paymentId) {
        // Free interview - apply coupon
        await couponService.applyCoupon(couponCode, jobSeekerId, { session });
        couponApplied = true;
      } else {
        couponApplied = true; // Will apply after payment validation
      }
    }

    // Handle payment
    if (!couponApplied && !paymentId) {
      throw new AppError('Payment required for this interview. Apply a coupon or complete payment.', 402);
    }

    if (paymentId) {
      payment = await this.validateCompletedPayment(paymentId, jobSeekerId);
      if (couponCode) {
        await couponService.applyCoupon(couponCode, jobSeekerId, { session });
      }
    }

    // Create interview request
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const interview = await Interview.create([{
      jobSeekerId,
      requestedSkills,
      preferredDuration,
      notes,
      payment: payment?._id,
      isPaid: !!payment,
      status: InterviewStatus.REQUESTED,
      expiresAt,
    }], { session });

    // Commit transaction
    await session.commitTransaction();

    // Send notification (outside transaction)
    await notificationService.createNotification({
      userId: jobSeekerId,
      type: 'new_interview_request',
      title: 'Interview Request Created',
      message: 'Your interview request has been created. An interviewer will claim it soon.',
      data: { interviewId: interview[0]._id },
    });

    return interview[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

**Update Coupon Service:**
```typescript
// backend/src/services/coupon.service.ts
async applyCoupon(
  couponCode: string, 
  userId: string, 
  options?: { session?: ClientSession }
): Promise<ApplyCouponResult> {
  const code = couponCode.toUpperCase().trim();
  const session = options?.session;

  // Validation (same as before)
  const validation = await this.validateCoupon(code, userId);
  if (!validation.valid) {
    throw new AppError(validation.message, 400);
  }

  const coupon = await Coupon.findOne({ code, isActive: true }).session(session || null);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  // Atomic operations with session
  const userUsage = await CouponUsage.findOneAndUpdate(
    { userId, couponId: coupon._id },
    {
      $inc: { usageCount: 1 },
      $set: { lastUsedAt: new Date() },
      $setOnInsert: { userId, couponId: coupon._id },
    },
    { upsert: true, new: true, session }
  );

  await Coupon.findByIdAndUpdate(
    coupon._id,
    { $inc: { totalUsed: 1 } },
    { session }
  );

  const remainingUses = Math.max(0, coupon.perUserLimit - userUsage.usageCount);

  logger.info(`Coupon ${code} applied by user ${userId}. Usage: ${userUsage.usageCount}/${coupon.perUserLimit}`);

  return {
    success: true,
    message: 'Coupon applied successfully',
    usageCount: userUsage.usageCount,
    remainingUses,
  };
}
```

**Testing:**
```typescript
// Test rollback scenario
it('should rollback coupon application if interview creation fails', async () => {
  const initialUsage = await CouponUsage.findOne({ userId, couponId });
  const initialTotal = await Coupon.findOne({ code: 'TEST50' });
  
  try {
    await interviewService.createInterviewRequest({
      jobSeekerId: 'invalid-id', // Will fail
      requestedSkills: ['JavaScript'],
      couponCode: 'TEST50',
    });
  } catch (error) {
    // Expected to fail
  }
  
  // Verify coupon not applied
  const finalUsage = await CouponUsage.findOne({ userId, couponId });
  expect(finalUsage.usageCount).toBe(initialUsage.usageCount);
});
```

**Priority:** P0  
**Estimated Time:** 2 days  
**Dependencies:** None

---

## 2. Security: Refresh Token in HttpOnly Cookies

### Problem
Refresh tokens stored in localStorage are vulnerable to XSS attacks.

### Solution
Move refresh tokens to httpOnly cookies.

### Implementation

**Backend: Update Auth Controller**

```typescript
// backend/src/controllers/auth.controller.ts
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  
  const result = await authService.login({ email, password });
  
  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  });
  
  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      // Don't send refreshToken in response body
    },
  });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get refresh token from cookie instead of body
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new AppError('Refresh token not provided', 401);
  }
  
  const tokens = await authService.refreshToken(req.user!.id, refreshToken);
  
  // Set new refresh token in cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
  
  res.status(200).json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logout(req.user!.id);
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    path: '/api/v1/auth',
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
```

**Frontend: Update Auth Service**

```typescript
// frontend/src/services/authService.ts
login: async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', {
      email,
      password,
    });
    
    // Only store accessToken, refreshToken is in httpOnly cookie
    const { accessToken, user } = response.data.data!;
    
    return {
      user,
      accessToken,
      refreshToken: '', // Not needed, handled by cookie
    };
  } catch (error) {
    throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
  }
},

refreshToken: async (): Promise<{ accessToken: string }> => {
  try {
    // Cookie is sent automatically
    const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token');
    return response.data.data!;
  } catch (error) {
    throw new Error(handleApiError(error as Parameters<typeof handleApiError>[0]));
  }
},
```

**Update API Client:**
```typescript
// frontend/src/services/api.ts
// Ensure cookies are sent with requests
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies
  timeout: 30000,
});
```

**Priority:** P0  
**Estimated Time:** 1 day  
**Dependencies:** None

---

## 3. Input Sanitization

### Problem
User inputs not sanitized, vulnerable to XSS attacks.

### Solution
Add input sanitization layer.

### Implementation

**Install Dependency:**
```bash
npm install isomorphic-dompurify
npm install --save-dev @types/dompurify
```

**Create Sanitization Utility:**
```typescript
// backend/src/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return input;
  // Remove all HTML tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
};
```

**Update Validation Middleware:**
```typescript
// backend/src/middlewares/validate.ts
import { sanitizeObject } from '../utils/sanitize';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Sanitize input before validation
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }
      
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Validation error', 400));
      } else {
        next(error);
      }
    }
  };
};
```

**Priority:** P0  
**Estimated Time:** 1 day  
**Dependencies:** None

---

## 4. Payment Idempotency

### Problem
Duplicate webhook processing can create duplicate payments/interviews.

### Solution
Implement idempotency keys for payment processing.

### Implementation

**Update Payment Model:**
```typescript
// backend/src/models/Payment.ts
const paymentSchema = new Schema<IPaymentDocument>({
  // ... existing fields
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true, // Allow null values
  },
  // ... rest of schema
});

// Index for idempotency
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
```

**Update Payment Service:**
```typescript
// backend/src/services/payment.service.ts
async verifyPayment(data: VerifyPaymentData): Promise<IPaymentDocument> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new AppError('Invalid payment signature', 400);
  }

  // Check idempotency - prevent duplicate processing
  const idempotencyKey = `${razorpay_order_id}-${razorpay_payment_id}`;
  const existingPayment = await Payment.findOne({ 
    $or: [
      { razorpayPaymentId: razorpay_payment_id },
      { idempotencyKey }
    ]
  });

  if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
    logger.warn(`Duplicate payment webhook ignored: ${razorpay_payment_id}`);
    return existingPayment; // Return existing, don't process again
  }

  // Find payment by order ID
  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Update payment
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.idempotencyKey = idempotencyKey;
  payment.status = PaymentStatus.COMPLETED;
  await payment.save();

  // Rest of the logic...
  return payment;
}
```

**Priority:** P0  
**Estimated Time:** 1 day  
**Dependencies:** None

---

## 5. Health Check Endpoints

### Problem
No health checks for dependencies (database, Redis, external services).

### Solution
Implement comprehensive health check endpoint.

### Implementation

**Create Health Check Service:**
```typescript
// backend/src/services/health.service.ts
import mongoose from 'mongoose';
import redis from '../config/redis';
import config from '../config';
import logger from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  message?: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: HealthStatus;
  cache: HealthStatus;
  services: {
    razorpay: HealthStatus;
    s3: HealthStatus;
    email: HealthStatus;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

class HealthService {
  async checkDatabase(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - start;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Database connection failed',
      };
    }
  }

  async checkCache(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const client = redis.getClient();
      if (!client) {
        return {
          status: 'unhealthy',
          responseTime: 0,
          message: 'Redis client not available',
        };
      }
      await client.ping();
      const responseTime = Date.now() - start;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Redis connection failed',
      };
    }
  }

  async checkRazorpay(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Simple API call to check Razorpay
      // In production, use a lightweight endpoint
      const responseTime = Date.now() - start;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Razorpay service unavailable',
      };
    }
  }

  async checkS3(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Check S3 bucket access
      // In production, use headBucket or similar lightweight operation
      const responseTime = Date.now() - start;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'S3 service unavailable',
      };
    }
  }

  async checkEmail(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Check email service configuration
      const responseTime = Date.now() - start;
      return {
        status: config.email.user ? 'healthy' : 'unhealthy',
        responseTime,
        message: config.email.user ? undefined : 'Email service not configured',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: 'Email service check failed',
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [database, cache, razorpay, s3, email] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkRazorpay(),
      this.checkS3(),
      this.checkEmail(),
    ]);

    const memory = process.memoryUsage();
    const uptime = process.uptime();

    // Determine overall status
    const criticalServices = [database, cache];
    const optionalServices = [razorpay, s3, email];
    
    const criticalHealthy = criticalServices.every(s => s.status === 'healthy');
    const optionalHealthy = optionalServices.every(s => s.status === 'healthy');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (!criticalHealthy) {
      overallStatus = 'unhealthy';
    } else if (!optionalHealthy) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      database,
      cache,
      services: {
        razorpay,
        s3,
        email,
      },
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
    };
  }
}

export default new HealthService();
```

**Create Health Check Controller:**
```typescript
// backend/src/controllers/health.controller.ts
import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import healthService from '../services/health.service';

export const getHealth = asyncHandler(async (req: any, res: Response) => {
  const health = await healthService.getSystemHealth();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    success: health.status !== 'unhealthy',
    data: health,
  });
});

export const getHealthLiveness = asyncHandler(async (req: any, res: Response) => {
  // Simple liveness check - just check if app is running
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export const getHealthReadiness = asyncHandler(async (req: any, res: Response) => {
  // Readiness check - verify critical dependencies
  const database = await healthService.checkDatabase();
  const cache = await healthService.checkCache();
  
  const ready = database.status === 'healthy' && cache.status === 'healthy';
  
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    database: database.status,
    cache: cache.status,
  });
});
```

**Add Routes:**
```typescript
// backend/src/routes/health.routes.ts
import { Router } from 'express';
import { getHealth, getHealthLiveness, getHealthReadiness } from '../controllers/health.controller';

const router = Router();

router.get('/health', getHealth);
router.get('/health/live', getHealthLiveness);
router.get('/health/ready', getHealthReadiness);

export default router;
```

**Priority:** P0  
**Estimated Time:** 1 day  
**Dependencies:** None

---

## 6. Account Lockout Mechanism

### Problem
No brute force protection for login attempts.

### Solution
Implement account lockout after failed attempts.

### Implementation

**Update User Model:**
```typescript
// backend/src/models/User.ts
const userSchema = new Schema({
  // ... existing fields
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  accountLockedUntil: {
    type: Date,
    default: null,
  },
});
```

**Update Auth Service:**
```typescript
// backend/src/services/auth.service.ts
async login(data: LoginData): Promise<AuthResponse> {
  const { email, password } = data;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if account is locked
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
      423
    );
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    // Increment failed attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();
      throw new AppError(
        'Account locked due to too many failed attempts. Try again in 30 minutes.',
        423
      );
    }
    
    await user.save();
    throw new AppError('Invalid email or password', 401);
  }

  // Reset failed attempts on successful login
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();
  }

  // Generate tokens
  const accessToken = this.generateAccessToken(user);
  const refreshToken = this.generateRefreshToken(user);

  // Save refresh token (if storing in DB)
  // user.refreshToken = refreshToken;
  // await user.save();

  return {
    user: this.sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}
```

**Priority:** P1  
**Estimated Time:** 1 day  
**Dependencies:** None

---

## 7. Enhanced Database Indexes

### Problem
Missing indexes for common query patterns, leading to slow queries.

### Solution
Add strategic indexes based on query patterns.

### Implementation

**Update Payment Model:**
```typescript
// backend/src/models/Payment.ts
// Add indexes
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
```

**Update Interview Model:**
```typescript
// backend/src/models/Interview.ts
interviewSchema.index({ jobSeekerId: 1, status: 1 });
interviewSchema.index({ interviewerId: 1, status: 1 });
interviewSchema.index({ scheduledAt: 1, status: 1 }); // For reminders
interviewSchema.index({ status: 1, requestedSkills: 1, expiresAt: 1 });
interviewSchema.index({ createdAt: -1 });
```

**Update Job Model:**
```typescript
// backend/src/models/Job.ts
jobSchema.index({ employerId: 1, status: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1, status: 1 });
```

**Update User Model:**
```typescript
// backend/src/models/User.ts
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
```

**Create Migration Script:**
```typescript
// backend/src/scripts/add-indexes.ts
import mongoose from 'mongoose';
import config from '../config';

async function addIndexes() {
  await mongoose.connect(config.mongodb.uri);
  
  // Indexes will be created automatically on next model access
  // Or create them explicitly:
  const db = mongoose.connection.db;
  await db.collection('payments').createIndex({ userId: 1, status: 1, createdAt: -1 });
  await db.collection('interviews').createIndex({ jobSeekerId: 1, status: 1 });
  // ... etc
  
  console.log('Indexes created successfully');
  await mongoose.disconnect();
}

addIndexes();
```

**Priority:** P1  
**Estimated Time:** 0.5 days  
**Dependencies:** None

---

## Implementation Timeline

| Task | Priority | Estimated Time | Owner |
|------|----------|----------------|-------|
| Transaction Management | P0 | 2 days | Backend Team |
| Refresh Token in Cookies | P0 | 1 day | Backend Team |
| Input Sanitization | P0 | 1 day | Backend Team |
| Payment Idempotency | P0 | 1 day | Backend Team |
| Health Checks | P0 | 1 day | Backend Team |
| Account Lockout | P1 | 1 day | Backend Team |
| Database Indexes | P1 | 0.5 days | Backend Team |
| **Total** | | **7.5 days** | |

---

## Testing Checklist

After implementing each fix:

- [ ] Unit tests written
- [ ] Integration tests updated
- [ ] Manual testing completed
- [ ] Code review done
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Staging testing passed

---

**Document Status:** Implementation Guide  
**Last Updated:** [Current Date]  
**Next Steps:** Begin implementation in priority order
