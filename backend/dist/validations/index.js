"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWithdrawalSchema = exports.updateUserStatusSchema = exports.approveInterviewerSchema = exports.candidateSearchSchema = exports.jobSearchSchema = exports.verifyPaymentSchema = exports.createPaymentOrderSchema = exports.interviewFeedbackSchema = exports.scheduleInterviewSchema = exports.updateApplicationStatusSchema = exports.createApplicationSchema = exports.updateJobSchema = exports.createJobSchema = exports.updateInterviewerProfileSchema = exports.interviewerProfileSchema = exports.bankDetailsSchema = exports.companyProfileSchema = exports.jobSeekerProfileSchema = exports.jobPreferencesSchema = exports.socialLinksSchema = exports.certificationSchema = exports.projectSchema = exports.skillSchema = exports.workExperienceSchema = exports.educationSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.paginationSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
// Common schemas
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('10'),
    sort: zod_1.z.string().optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
// Auth schemas
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50).trim(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50).trim(),
    role: zod_1.z.enum([types_1.UserRole.JOB_SEEKER, types_1.UserRole.EMPLOYER, types_1.UserRole.INTERVIEWER]),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});
// Job Seeker Profile schemas
exports.educationSchema = zod_1.z.object({
    institution: zod_1.z.string().min(1, 'Institution is required').trim(),
    degree: zod_1.z.string().min(1, 'Degree is required').trim(),
    field: zod_1.z.string().min(1, 'Field is required').trim(),
    level: zod_1.z.nativeEnum(types_1.EducationLevel),
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    isCurrent: zod_1.z.boolean().default(false),
    grade: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
exports.workExperienceSchema = zod_1.z.object({
    company: zod_1.z.string().min(1, 'Company is required').trim(),
    title: zod_1.z.string().min(1, 'Title is required').trim(),
    employmentType: zod_1.z.nativeEnum(types_1.EmploymentType),
    location: zod_1.z.string().optional(),
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    isCurrent: zod_1.z.boolean().default(false),
    description: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.skillSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Skill name is required').trim(),
    level: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    yearsOfExperience: zod_1.z.number().min(0).optional(),
});
exports.projectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Project title is required').trim(),
    description: zod_1.z.string().min(1, 'Description is required').trim(),
    technologies: zod_1.z.array(zod_1.z.string()),
    url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    githubUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    startDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    endDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    isCurrent: zod_1.z.boolean().default(false),
});
exports.certificationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Certification name is required').trim(),
    issuer: zod_1.z.string().min(1, 'Issuer is required').trim(),
    issueDate: zod_1.z.string().transform((val) => new Date(val)),
    expiryDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    credentialId: zod_1.z.string().optional(),
    credentialUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.socialLinksSchema = zod_1.z.object({
    linkedin: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    github: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    portfolio: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    twitter: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    other: zod_1.z.array(zod_1.z.string().url()).optional(),
});
exports.jobPreferencesSchema = zod_1.z.object({
    expectedSalary: zod_1.z.object({
        min: zod_1.z.number().min(0),
        max: zod_1.z.number().min(0),
        currency: zod_1.z.string().default('INR'),
    }).optional(),
    preferredLocations: zod_1.z.array(zod_1.z.string()).optional(),
    employmentTypes: zod_1.z.array(zod_1.z.nativeEnum(types_1.EmploymentType)).optional(),
    noticePeriod: zod_1.z.number().min(0).optional(),
    isOpenToRemote: zod_1.z.boolean().optional(),
    isActivelyLooking: zod_1.z.boolean().optional(),
});
exports.jobSeekerProfileSchema = zod_1.z.object({
    headline: zod_1.z.string().max(200).optional(),
    summary: zod_1.z.string().max(2000).optional(),
    dateOfBirth: zod_1.z.string().transform((val) => new Date(val)).optional(),
    gender: zod_1.z.string().optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        pincode: zod_1.z.string().optional(),
    }).optional(),
    education: zod_1.z.array(exports.educationSchema).optional(),
    experience: zod_1.z.array(exports.workExperienceSchema).optional(),
    skills: zod_1.z.array(exports.skillSchema).optional(),
    projects: zod_1.z.array(exports.projectSchema).optional(),
    certifications: zod_1.z.array(exports.certificationSchema).optional(),
    socialLinks: exports.socialLinksSchema.optional(),
    preferences: exports.jobPreferencesSchema.optional(),
});
// Company Profile schemas
exports.companyProfileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1, 'Company name is required').max(200).trim(),
    companyEmail: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
    companyPhone: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    description: zod_1.z.string().max(5000).optional(),
    industry: zod_1.z.string().optional(),
    companySize: zod_1.z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']).optional(),
    founded: zod_1.z.number().min(1800).max(new Date().getFullYear()).optional(),
    headquarters: zod_1.z.object({
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        pincode: zod_1.z.string().optional(),
    }).optional(),
    socialLinks: exports.socialLinksSchema.optional(),
});
// Bank Details schema
exports.bankDetailsSchema = zod_1.z.object({
    accountHolderName: zod_1.z.string().min(1, 'Account holder name is required').trim(),
    accountNumber: zod_1.z.string().min(1, 'Account number is required').trim(),
    ifscCode: zod_1.z.string().min(1, 'IFSC code is required').trim().toUpperCase(),
    bankName: zod_1.z.string().min(1, 'Bank name is required').trim(),
    branchName: zod_1.z.string().optional(),
    upiId: zod_1.z.string().optional(),
});
// Interviewer Profile schemas
exports.interviewerProfileSchema = zod_1.z.object({
    expertise: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one expertise area is required'),
    experience: zod_1.z.number().min(0, 'Experience must be a positive number'),
    bio: zod_1.z.string().max(2000).optional(),
    linkedinUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    currentCompany: zod_1.z.string().optional(),
    currentPosition: zod_1.z.string().optional(),
    interviewTypes: zod_1.z.array(zod_1.z.enum(['technical', 'behavioral', 'system_design', 'hr', 'coding', 'general'])).optional(),
    languages: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    hourlyRate: zod_1.z.number().min(0).optional(),
    availability: zod_1.z.array(zod_1.z.object({
        dayOfWeek: zod_1.z.number().min(0).max(6),
        slots: zod_1.z.array(zod_1.z.object({
            startTime: zod_1.z.string(),
            endTime: zod_1.z.string(),
        })),
    })).optional(),
    bankDetails: exports.bankDetailsSchema.optional(),
});
// Update schema - all fields optional for partial updates
exports.updateInterviewerProfileSchema = exports.interviewerProfileSchema.partial();
// Job schemas
exports.createJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Job title is required').max(200).trim(),
    description: zod_1.z.string().min(1, 'Description is required').max(10000).trim(),
    requirements: zod_1.z.array(zod_1.z.string()).optional(),
    responsibilities: zod_1.z.array(zod_1.z.string()).optional(),
    skills: zod_1.z.array(zod_1.z.string()).min(1, 'At least one skill is required'),
    experienceLevel: zod_1.z.nativeEnum(types_1.ExperienceLevel),
    // experienceYears: z.object({
    //   min: z.number().min(0),
    //   max: z.number().min(0),
    // }),
    employmentType: zod_1.z.nativeEnum(types_1.EmploymentType),
    salary: zod_1.z.object({
        min: zod_1.z.number().min(0).optional(),
        max: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().default('INR'),
        isNegotiable: zod_1.z.boolean().default(false),
        showOnListing: zod_1.z.boolean().default(true),
    }).optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().min(1, 'City is required').trim(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().min(1, 'Country is required').trim(),
        isRemote: zod_1.z.boolean().default(false),
        isHybrid: zod_1.z.boolean().default(false),
    }),
    benefits: zod_1.z.array(zod_1.z.string()).optional(),
    applicationDeadline: zod_1.z.string().transform((val) => new Date(val)).optional(),
});
exports.updateJobSchema = exports.createJobSchema.partial();
// Job Application schemas
exports.createApplicationSchema = zod_1.z.object({
    coverLetter: zod_1.z.string().max(5000).optional(),
});
exports.updateApplicationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['reviewing', 'shortlisted', 'interview', 'offered', 'rejected']),
    notes: zod_1.z.string().max(2000).optional(),
});
// Interview schemas
exports.scheduleInterviewSchema = zod_1.z.object({
    interviewerId: exports.objectIdSchema,
    scheduledAt: zod_1.z.string().transform((val) => new Date(val)),
    duration: zod_1.z.number().min(15).max(180).default(60),
    topic: zod_1.z.string().max(200).optional(),
    paymentId: exports.objectIdSchema.optional(),
});
exports.interviewFeedbackSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5),
    technicalSkills: zod_1.z.number().min(1).max(5),
    communication: zod_1.z.number().min(1).max(5),
    problemSolving: zod_1.z.number().min(1).max(5),
    overallPerformance: zod_1.z.number().min(1).max(5),
    strengths: zod_1.z.array(zod_1.z.string()),
    areasOfImprovement: zod_1.z.array(zod_1.z.string()),
    detailedFeedback: zod_1.z.string().min(1).max(5000),
    isPublic: zod_1.z.boolean().default(true),
});
// Payment schemas
exports.createPaymentOrderSchema = zod_1.z.object({
    interviewId: exports.objectIdSchema.optional(),
    amount: zod_1.z.number().min(100), // minimum 100 paise (₹1)
});
exports.verifyPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string().min(1),
    razorpay_payment_id: zod_1.z.string().min(1),
    razorpay_signature: zod_1.z.string().min(1),
});
// Search/Filter schemas
exports.jobSearchSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    skills: zod_1.z.string().transform((val) => val.split(',')).optional(),
    experienceLevel: zod_1.z.string().optional(),
    employmentType: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    isRemote: zod_1.z.string().transform((val) => val === 'true').optional(),
    salaryMin: zod_1.z.string().transform(Number).optional(),
    salaryMax: zod_1.z.string().transform(Number).optional(),
    ...exports.paginationSchema.shape,
});
exports.candidateSearchSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    skills: zod_1.z.string().transform((val) => val.split(',')).optional(),
    experienceMin: zod_1.z.string().transform(Number).optional(),
    experienceMax: zod_1.z.string().transform(Number).optional(),
    location: zod_1.z.string().optional(),
    interviewRating: zod_1.z.string().transform(Number).optional(),
    hasCertifications: zod_1.z.string().transform((val) => val === 'true').optional(),
    isActivelyLooking: zod_1.z.string().transform((val) => val === 'true').optional(),
    ...exports.paginationSchema.shape,
});
// Admin schemas
exports.approveInterviewerSchema = zod_1.z.object({
    isApproved: zod_1.z.boolean(),
    rejectionReason: zod_1.z.string().optional(),
});
exports.updateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['active', 'inactive', 'suspended']),
});
// Withdrawal schemas
exports.createWithdrawalSchema = zod_1.z.object({
    amount: zod_1.z.number().min(100, 'Minimum withdrawal amount is ₹1').max(10000000, 'Maximum withdrawal amount is ₹1,00,000'),
    method: zod_1.z.enum(['bank_transfer', 'upi']),
    bankDetails: zod_1.z.object({
        accountHolderName: zod_1.z.string().min(1, 'Account holder name is required'),
        accountNumber: zod_1.z.string().min(1, 'Account number is required'),
        ifscCode: zod_1.z.string().min(1, 'IFSC code is required'),
        bankName: zod_1.z.string().min(1, 'Bank name is required'),
    }).optional(),
    upiId: zod_1.z.string().optional(),
});
//# sourceMappingURL=index.js.map