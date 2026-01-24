import { Request } from 'express';
import { Document, Types } from 'mongoose';
export declare enum UserRole {
    JOB_SEEKER = "job_seeker",
    EMPLOYER = "employer",
    INTERVIEWER = "interviewer",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    SUSPENDED = "suspended"
}
export declare enum InterviewStatus {
    REQUESTED = "requested",// Job seeker submitted request, waiting for interviewer
    SCHEDULED = "scheduled",// Interviewer claimed and scheduled
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show",
    EXPIRED = "expired"
}
export declare enum InterviewType {
    TECHNICAL = "technical",
    BEHAVIORAL = "behavioral",
    SYSTEM_DESIGN = "system_design",
    HR = "hr",
    CODING = "coding",
    GENERAL = "general"
}
export declare enum JobStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    CLOSED = "closed",
    EXPIRED = "expired"
}
export declare enum ApplicationStatus {
    APPLIED = "applied",
    REVIEWING = "reviewing",
    SHORTLISTED = "shortlisted",
    INTERVIEW = "interview",
    OFFERED = "offered",
    REJECTED = "rejected",
    WITHDRAWN = "withdrawn"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum WithdrawalStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REVERSED = "reversed"
}
export declare enum WithdrawalMethod {
    BANK_TRANSFER = "bank_transfer",
    UPI = "upi"
}
export interface IWithdrawal {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
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
    razorpayPayoutId?: string;
    razorpayFundAccountId?: string;
    razorpayContactId?: string;
    failureReason?: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum EducationLevel {
    HIGH_SCHOOL = "high_school",
    DIPLOMA = "diploma",
    BACHELORS = "bachelors",
    MASTERS = "masters",
    PHD = "phd",
    OTHER = "other"
}
export declare enum EmploymentType {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    CONTRACT = "contract",
    FREELANCE = "freelance",
    INTERNSHIP = "internship"
}
export declare enum ExperienceLevel {
    FRESHER = "fresher",
    JUNIOR = "junior",
    MID = "mid",
    SENIOR = "senior",
    LEAD = "lead",
    MANAGER = "manager",
    DIRECTOR = "director",
    EXECUTIVE = "executive"
}
export interface IBaseUser {
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    isEmailVerified: boolean;
    lastLogin?: Date;
    refreshTokens: string[];
    failedLoginAttempts?: number;
    accountLockedUntil?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IJobSeekerProfile {
    userId: Types.ObjectId;
    headline?: string;
    summary?: string;
    dateOfBirth?: Date;
    gender?: string;
    location: {
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
    };
    education: IEducation[];
    experience: IWorkExperience[];
    skills: ISkill[];
    projects: IProject[];
    certifications: ICertification[];
    socialLinks: ISocialLinks;
    resume?: IResume;
    preferences: IJobPreferences;
    interviewStats: {
        totalInterviews: number;
        freeInterviewsUsed: number;
        averageRating: number;
    };
}
export interface IEducation {
    _id?: Types.ObjectId;
    institution: string;
    degree: string;
    field: string;
    level: EducationLevel;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    grade?: string;
    description?: string;
}
export interface IWorkExperience {
    _id?: Types.ObjectId;
    company: string;
    title: string;
    employmentType: EmploymentType;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
    skills?: string[];
}
export interface ISkill {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience?: number;
}
export interface IProject {
    _id?: Types.ObjectId;
    title: string;
    description: string;
    technologies: string[];
    url?: string;
    githubUrl?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent: boolean;
}
export interface ICertification {
    _id?: Types.ObjectId;
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
}
export interface ISocialLinks {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    other?: string[];
}
export interface IResume {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    parsedData?: object;
}
export interface IJobPreferences {
    expectedSalary?: {
        min: number;
        max: number;
        currency: string;
    };
    preferredLocations?: string[];
    employmentTypes?: EmploymentType[];
    noticePeriod?: number;
    isOpenToRemote?: boolean;
    isActivelyLooking?: boolean;
}
export interface ICompanyProfile {
    userId: Types.ObjectId;
    companyName: string;
    companyEmail: string;
    companyPhone?: string;
    website?: string;
    logo?: string;
    description?: string;
    industry?: string;
    companySize?: string;
    founded?: number;
    headquarters: {
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
    };
    socialLinks?: ISocialLinks;
    isVerified: boolean;
    verificationDocuments?: string[];
}
export interface IBankDetails {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
    upiId?: string;
}
export interface IInterviewerProfile {
    userId: Types.ObjectId;
    expertise: string[];
    experience: number;
    bio?: string;
    linkedinUrl?: string;
    currentCompany?: string;
    currentPosition?: string;
    availability: IAvailability[];
    interviewTypes: InterviewType[];
    languages: string[];
    hourlyRate: number;
    isApproved: boolean;
    approvedAt?: Date;
    approvedBy?: Types.ObjectId;
    rejectionReason?: string;
    rating: {
        average: number;
        count: number;
    };
    interviewsCompleted: number;
    earnings: number;
    bankDetails?: IBankDetails;
}
export interface IAvailability {
    dayOfWeek: number;
    slots: {
        startTime: string;
        endTime: string;
    }[];
}
export interface IJob {
    _id: Types.ObjectId;
    employerId: Types.ObjectId;
    companyId: Types.ObjectId;
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
    experienceLevel: ExperienceLevel;
    experienceYears: {
        min: number;
        max: number;
    };
    employmentType: EmploymentType;
    salary?: {
        min: number;
        max: number;
        currency: string;
        isNegotiable: boolean;
        showOnListing: boolean;
    };
    location: {
        city: string;
        state?: string;
        country: string;
        isRemote: boolean;
        isHybrid: boolean;
    };
    benefits?: string[];
    status: JobStatus;
    applicationDeadline?: Date;
    applicationsCount: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IJobApplication {
    _id: Types.ObjectId;
    jobId: Types.ObjectId;
    jobSeekerId: Types.ObjectId;
    coverLetter?: string;
    resumeUrl: string;
    status: ApplicationStatus;
    appliedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
    notes?: string;
    interviewScheduled?: boolean;
}
export interface IInterview {
    _id: Types.ObjectId;
    jobSeekerId: Types.ObjectId;
    interviewerId?: Types.ObjectId | null;
    requestedSkills: string[];
    preferredDuration: number;
    notes?: string;
    scheduledAt?: Date | null;
    claimedAt?: Date | null;
    expiresAt?: Date | null;
    duration: number;
    status: InterviewStatus;
    type: 'mock' | 'real';
    topic?: string;
    meetingUrl?: string;
    videoRecording?: {
        url: string;
        s3Key: string;
        duration: number;
        size: number;
        uploadedAt: Date;
    };
    feedback?: IInterviewFeedback;
    payment?: Types.ObjectId;
    isPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IInterviewFeedback {
    rating: number;
    technicalSkills: number;
    communication: number;
    problemSolving: number;
    overallPerformance: number;
    strengths: string[];
    areasOfImprovement: string[];
    detailedFeedback: string;
    isPublic: boolean;
    submittedAt: Date;
}
export interface IPayment {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    interviewId?: Types.ObjectId;
    orderId: string;
    paymentId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    receipt: string;
    notes?: object;
    idempotencyKey?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface INotification {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    data?: object;
    isRead: boolean;
    createdAt: Date;
}
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    pagination?: PaginationInfo;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
export interface JobFilters {
    search?: string;
    skills?: string[];
    experienceLevel?: ExperienceLevel[];
    employmentType?: EmploymentType[];
    location?: string;
    isRemote?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    postedAfter?: Date;
}
export interface CandidateFilters {
    search?: string;
    skills?: string[];
    experienceYears?: {
        min?: number;
        max?: number;
    };
    location?: string;
    interviewRating?: number;
    hasCertifications?: boolean;
    isActivelyLooking?: boolean;
}
export interface IUserDocument extends IBaseUser, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
    generateRefreshToken(): string;
    createPasswordResetToken(): string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
}
export interface IJobDocument extends IJob, Document {
}
export interface IJobApplicationDocument extends IJobApplication, Document {
}
export interface IInterviewDocument extends IInterview, Document {
}
export interface IPaymentDocument extends IPayment, Document {
}
export interface INotificationDocument extends INotification, Document {
}
//# sourceMappingURL=index.d.ts.map