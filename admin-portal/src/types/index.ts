export enum UserRole {
  JOB_SEEKER = 'job_seeker',
  EMPLOYER = 'employer',
  INTERVIEWER = 'interviewer',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser extends User {
  profile?: {
    avatar?: string;
    phone?: string;
  };
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeJobSeekers: number;
  activeEmployers: number;
  activeInterviewers: number;
  pendingInterviewers: number;
  totalInterviews: number;
  completedInterviews: number;
  totalJobs: number;
  activeJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface AdminInterviewer {
  _id: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  skills: string[];
  experience: number;
  bio?: string;
  isApproved: boolean;
  rejectionReason?: string;
  createdAt: string;
}

export interface AdminPayment {
  _id: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  perUserLimit: number;
  globalLimit?: number;
  totalUsed: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface SystemHealth {
  database: {
    status: string;
    responseTime: number;
  };
  cache: {
    status: string;
    responseTime: number;
  };
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}
