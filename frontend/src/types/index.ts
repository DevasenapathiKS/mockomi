// User types
export enum UserRole {
  JOB_SEEKER = 'job_seeker',
  EMPLOYER = 'employer',
  INTERVIEWER = 'interviewer',
  ADMIN = 'admin',
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Profile types
export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
  description?: string;
}

export interface Experience {
  _id?: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Project {
  _id?: string;
  title: string;
  description?: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Resume {
  url: string;
  filename: string;
  uploadedAt: string;
}

export interface JobPreferences {
  jobTypes: JobType[];
  locations: string[];
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  noticePeriod?: number;
}

export interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageRating: number;
  freeInterviewsUsed: number;
}

export interface JobSeekerProfile {
  _id: string;
  userId: string;
  headline?: string;
  summary?: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  resume?: Resume;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
  };
  preferences?: JobPreferences;
  interviewStats: InterviewStats;
  isProfileComplete: boolean;
  profileCompleteness: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  _id: string;
  userId: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  founded?: number;
  headquarters?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  logo?: string;
  description?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    other?: string[];
  };
  isVerified: boolean;
  verificationDocuments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  upiId?: string;
}

export interface InterviewerProfile {
  _id: string;
  userId: string;
  expertise: string[];
  experience: number;
  currentCompany?: string;
  currentPosition?: string;
  bio?: string;
  linkedinUrl?: string;
  availability: AvailabilitySlot[];
  hourlyRate: number;
  interviewTypes: InterviewType[];
  languages: string[];
  rating: {
    average: number;
    count: number;
  };
  totalInterviews: number;
  totalEarnings: number;
  isApproved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNote?: string;
  documents: string[];
  bankDetails?: BankDetails;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  slots: TimeSlot[];
}

// Job types
export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  REMOTE = 'remote',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive',
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

export interface JobLocation {
  city?: string;
  state?: string;
  country: string;
  remote: boolean;
}

export interface Salary {
  min?: number;
  max?: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
}

export interface Job {
  jobType: any;
  _id: string;
  title: string;
  company: CompanyProfile;
  employer: User;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  employmentType: JobType;
  experienceLevel: ExperienceLevel;
  location: JobLocation;
  salary?: Salary;
  benefits: string[];
  applicationDeadline?: string;
  status: JobStatus;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Application types
export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  SHORTLISTED = 'shortlisted',
  INTERVIEW = 'interview',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface JobApplication {
  _id: string;
  job: Job;
  applicant: User;
  applicantProfile?: JobSeekerProfile;
  status: ApplicationStatus;
  coverLetter?: string;
  resume: string;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

// Interview types
export enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  SYSTEM_DESIGN = 'system_design',
  HR = 'hr',
  CODING = 'coding',
  GENERAL = 'general',
}

export enum InterviewStatus {
  REQUESTED = 'requested',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  EXPIRED = 'expired',
}

export interface InterviewFeedback {
  overallRating: number;
  technicalSkills?: number;
  communicationSkills?: number;
  problemSolving?: number;
  strengths?: string;
  areasOfImprovement?: string;
  recommendation?: string;
  submittedAt: string;
}

export interface InterviewRecording {
  url: string;
  duration?: number;
  uploadedAt: string;
}

export interface Interview {
  _id: string;
  jobSeeker: User;
  interviewer?: User | null;
  interviewerProfile?: InterviewerProfile;
  scheduledAt?: string | null;
  duration: number;
  type: InterviewType;
  topics: string[];
  requestedSkills?: string[];
  preferredDuration?: number;
  notes?: string;
  status: InterviewStatus;
  meetingUrl?: string;
  feedback?: InterviewFeedback;
  recording?: InterviewRecording;
  isPaid: boolean;
  amount: number;
  payment?: Payment;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  claimedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Withdrawal types
export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum WithdrawalMethod {
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
}

export interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  upiId?: string;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalStats {
  totalWithdrawn: number;
  pendingAmount: number;
  availableBalance: number;
  totalEarnings: number;
}

// Payment types
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface Payment {
  _id: string;
  user?: User;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  interviewId?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEligibility {
  required: boolean;
  pricePerInterview: number;
}

// Notification types
export enum NotificationType {
  APPLICATION_RECEIVED = 'application_received',
  APPLICATION_STATUS = 'application_status',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_REMINDER = 'interview_reminder',
  INTERVIEW_COMPLETED = 'interview_completed',
  INTERVIEW_FEEDBACK = 'interview_feedback',
  NEW_INTERVIEW_REQUEST = 'new_interview_request',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PROFILE_UPDATE = 'profile_update',
  JOB_MATCH = 'job_match',
  SYSTEM = 'system',
}

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Filter and search types
export interface JobFilters {
  search?: string;
  jobType?: JobType[];
  experienceLevel?: ExperienceLevel[];
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  postedAfter?: string;
}

export interface CandidateFilters {
  search?: string;
  skills?: string[];
  experienceMin?: number;
  experienceMax?: number;
  location?: string;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalInterviews: number;
  totalRevenue: number;
  pendingInterviewers: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface InterviewAnalytics {
  totalInterviews: number;
  completedInterviews: number;
  averageRating: number;
  interviewsByType: Array<{
    type: string;
    count: number;
  }>;
  interviewsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByMonth: Array<{
    month: string;
    amount: number;
  }>;
  averagePaymentAmount: number;
  totalPayments: number;
}
