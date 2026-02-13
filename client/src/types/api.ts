export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  errorCode?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserRole = 'candidate' | 'interviewer' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type SessionSummary = {
  id: string;
  status: SessionStatus;
  scheduledAt: string | null;
  overallScore: number;
  readinessScore: number;
  readinessStatus: 'ready' | 'not_ready' | null;
  readinessGap: number;
  performanceTier:
    | 'developing'
    | 'approaching_readiness'
    | 'interview_ready'
    | 'strong_candidate'
    | 'elite';
  level: string;
  createdAt: string;
};

export type SessionListResponse = {
  items: SessionSummary[];
  pagination: Pagination;
};

export type InterviewDetail = {
  _id: string;
  candidateId: string;
  roleProfileId: string;
  scheduledAt?: string;
  status: SessionStatus;
};

export type ProgressSnapshot = {
  candidateId: string;
  roleProfileId: string;
  totalSessions: number;
  averageScore: number;
  latestScore: number;
  previousScore: number;
  improvementDelta: number;
  lastUpdated?: string;
  growthSignal: {
    trend: 'baseline' | 'improving' | 'declining' | 'stable';
    delta: number;
    message: string;
  };
};

export type InterviewerSummary = {
  id: string;
  bio: string;
  yearsOfExperience: number;
  primaryTechStack: string[];
  ratingAverage: number;
  totalRatings: number;
  totalInterviews: number;
};

export type InterviewerListResponse = {
  items: InterviewerSummary[];
  pagination: Pagination;
};

export type AvailabilitySlotSummary = {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
};

export type SlotListResponse = {
  items: AvailabilitySlotSummary[];
  pagination: Pagination;
};

export type RazorpayOrderPayload = {
  keyId: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
};

export type JoinTokenResponse = {
  token: string;
  signalingUrl: string;
};

export type SessionRatingPayload = {
  rating: number;
  comment?: string;
};
