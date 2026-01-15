import { z } from 'zod';
import { UserRole, EducationLevel, EmploymentType, ExperienceLevel } from '../types';

// Common schemas
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  role: z.enum([UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.INTERVIEWER]),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// Job Seeker Profile schemas
export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required').trim(),
  degree: z.string().min(1, 'Degree is required').trim(),
  field: z.string().min(1, 'Field is required').trim(),
  level: z.nativeEnum(EducationLevel),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  isCurrent: z.boolean().default(false),
  grade: z.string().optional(),
  description: z.string().optional(),
});

export const workExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required').trim(),
  title: z.string().min(1, 'Title is required').trim(),
  employmentType: z.nativeEnum(EmploymentType),
  location: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').trim(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().min(0).optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  technologies: z.array(z.string()),
  url: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  isCurrent: z.boolean().default(false),
});

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').trim(),
  issuer: z.string().min(1, 'Issuer is required').trim(),
  issueDate: z.string().transform((val) => new Date(val)),
  expiryDate: z.string().transform((val) => new Date(val)).optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal('')),
});

export const socialLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  other: z.array(z.string().url()).optional(),
});

export const jobPreferencesSchema = z.object({
  expectedSalary: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('INR'),
  }).optional(),
  preferredLocations: z.array(z.string()).optional(),
  employmentTypes: z.array(z.nativeEnum(EmploymentType)).optional(),
  noticePeriod: z.number().min(0).optional(),
  isOpenToRemote: z.boolean().optional(),
  isActivelyLooking: z.boolean().optional(),
});

export const jobSeekerProfileSchema = z.object({
  headline: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  dateOfBirth: z.string().transform((val) => new Date(val)).optional(),
  gender: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  education: z.array(educationSchema).optional(),
  experience: z.array(workExperienceSchema).optional(),
  // Accept either full skill objects or simple strings (fallback)
  skills: z
    .array(
      z.union([
        skillSchema,
        z.string().transform((val) => ({
          name: val,
          level: 'intermediate' as const,
          yearsOfExperience: 0,
        })),
      ])
    )
    .optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  socialLinks: socialLinksSchema.optional(),
  preferences: jobPreferencesSchema.optional(),
});

// Company Profile schemas
export const companyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200).trim(),
  companyEmail: z.string().email('Invalid email format').toLowerCase().trim(),
  companyPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']).optional(),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional(),
  headquarters: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  socialLinks: socialLinksSchema.optional(),
});

// Bank Details schema
export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required').trim(),
  accountNumber: z.string().min(1, 'Account number is required').trim(),
  ifscCode: z.string().min(1, 'IFSC code is required').trim().toUpperCase(),
  bankName: z.string().min(1, 'Bank name is required').trim(),
  branchName: z.string().optional(),
  upiId: z.string().optional(),
});

// Interviewer Profile schemas
export const interviewerProfileSchema = z.object({
  expertise: z.array(z.string().min(1)).min(1, 'At least one expertise area is required'),
  experience: z.number().min(0, 'Experience must be a positive number'),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  currentCompany: z.string().optional(),
  currentPosition: z.string().optional(),
  interviewTypes: z.array(z.enum(['technical', 'behavioral', 'system_design', 'hr', 'coding', 'general'])).optional(),
  languages: z.array(z.string().min(1)).optional(),
  hourlyRate: z.number().min(0).optional(),
  availability: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    slots: z.array(z.object({
      startTime: z.string(),
      endTime: z.string(),
    })),
  })).optional(),
  bankDetails: bankDetailsSchema.optional(),
});

// Update schema - all fields optional for partial updates
export const updateInterviewerProfileSchema = interviewerProfileSchema.partial();

// Job schemas
export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200).trim(),
  description: z.string().min(1, 'Description is required').max(10000).trim(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  // experienceYears: z.object({
  //   min: z.number().min(0),
  //   max: z.number().min(0),
  // }),
  employmentType: z.nativeEnum(EmploymentType),
  salary: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
    currency: z.string().default('INR'),
    isNegotiable: z.boolean().default(false),
    showOnListing: z.boolean().default(true),
  }).optional(),
  location: z.object({
    city: z.string().min(1, 'City is required').trim(),
    state: z.string().optional(),
    country: z.string().min(1, 'Country is required').trim(),
    isRemote: z.boolean().default(false),
    isHybrid: z.boolean().default(false),
  }),
  benefits: z.array(z.string()).optional(),
  applicationDeadline: z.string().transform((val) => new Date(val)).optional(),
});

export const updateJobSchema = createJobSchema.partial();

// Job Application schemas
export const createApplicationSchema = z.object({
  coverLetter: z.string().max(5000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['reviewing', 'shortlisted', 'interview', 'offered', 'rejected']),
  notes: z.string().max(2000).optional(),
});

// Interview schemas
export const scheduleInterviewSchema = z.object({
  interviewerId: objectIdSchema,
  scheduledAt: z.string().transform((val) => new Date(val)),
  duration: z.number().min(15).max(180).default(60),
  topic: z.string().max(200).optional(),
  paymentId: objectIdSchema.optional(),
});

export const interviewFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  technicalSkills: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
  problemSolving: z.number().min(1).max(5),
  overallPerformance: z.number().min(1).max(5),
  strengths: z.array(z.string()),
  areasOfImprovement: z.array(z.string()),
  detailedFeedback: z.string().min(1).max(5000),
  isPublic: z.boolean().default(true),
});

// Payment schemas
export const createPaymentOrderSchema = z.object({
  interviewId: objectIdSchema.optional(),
  amount: z.number().min(100), // minimum 100 paise (₹1)
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Search/Filter schemas
export const jobSearchSchema = z.object({
  search: z.string().optional(),
  skills: z.string().transform((val) => val.split(',')).optional(),
  experienceLevel: z.string().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.string().transform((val) => val === 'true').optional(),
  salaryMin: z.string().transform(Number).optional(),
  salaryMax: z.string().transform(Number).optional(),
  ...paginationSchema.shape,
});

export const candidateSearchSchema = z.object({
  search: z.string().optional(),
  skills: z.string().transform((val) => val.split(',')).optional(),
  experienceMin: z.string().transform(Number).optional(),
  experienceMax: z.string().transform(Number).optional(),
  location: z.string().optional(),
  interviewRating: z.string().transform(Number).optional(),
  hasCertifications: z.string().transform((val) => val === 'true').optional(),
  isActivelyLooking: z.string().transform((val) => val === 'true').optional(),
  ...paginationSchema.shape,
});

// Admin schemas
export const approveInterviewerSchema = z.object({
  isApproved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

// Withdrawal schemas
export const createWithdrawalSchema = z.object({
  amount: z.number().min(100, 'Minimum withdrawal amount is ₹1').max(10000000, 'Maximum withdrawal amount is ₹1,00,000'),
  method: z.enum(['bank_transfer', 'upi']),
  bankDetails: z.object({
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    ifscCode: z.string().min(1, 'IFSC code is required'),
    bankName: z.string().min(1, 'Bank name is required'),
  }).optional(),
  upiId: z.string().optional(),
});
