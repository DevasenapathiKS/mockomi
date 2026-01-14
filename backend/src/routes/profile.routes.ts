import { Router } from 'express';
import { profileController } from '../controllers';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { uploadResume, uploadImage } from '../middlewares/upload';
import { uploadLimiter } from '../middlewares/rateLimiter';
import { UserRole } from '../types';
import {
  jobSeekerProfileSchema,
  companyProfileSchema,
  interviewerProfileSchema,
  updateInterviewerProfileSchema,
} from '../validations';

const router = Router();

// ============ JOB SEEKER PROFILE ============

/**
 * @swagger
 * /profiles/job-seeker:
 *   get:
 *     tags: [Profiles]
 *     summary: Get job seeker profile
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/job-seeker',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  profileController.getJobSeekerProfile
);

/**
 * @swagger
 * /profiles/job-seeker:
 *   put:
 *     tags: [Profiles]
 *     summary: Update job seeker profile
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/job-seeker',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  validateBody(jobSeekerProfileSchema),
  profileController.updateJobSeekerProfile
);

/**
 * @swagger
 * /profiles/job-seeker/resume:
 *   post:
 *     tags: [Profiles]
 *     summary: Upload resume
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/job-seeker/resume',
  authenticate,
  authorize(UserRole.JOB_SEEKER),
  uploadLimiter,
  uploadResume.single('resume'),
  profileController.uploadResume
);

// ============ COMPANY PROFILE ============

/**
 * @swagger
 * /profiles/company:
 *   get:
 *     tags: [Profiles]
 *     summary: Get company profile
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/company',
  authenticate,
  authorize(UserRole.EMPLOYER),
  profileController.getCompanyProfile
);

/**
 * @swagger
 * /profiles/company:
 *   post:
 *     tags: [Profiles]
 *     summary: Create company profile
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/company',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validateBody(companyProfileSchema),
  profileController.createCompanyProfile
);

/**
 * @swagger
 * /profiles/company:
 *   put:
 *     tags: [Profiles]
 *     summary: Update company profile
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/company',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validateBody(companyProfileSchema.partial()),
  profileController.updateCompanyProfile
);

/**
 * @swagger
 * /profiles/company/logo:
 *   post:
 *     tags: [Profiles]
 *     summary: Upload company logo
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/company/logo',
  authenticate,
  authorize(UserRole.EMPLOYER),
  uploadLimiter,
  uploadImage.single('logo'),
  profileController.uploadCompanyLogo
);

// ============ INTERVIEWER PROFILE ============

/**
 * @swagger
 * /profiles/interviewer:
 *   get:
 *     tags: [Profiles]
 *     summary: Get interviewer profile
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/interviewer',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  profileController.getInterviewerProfile
);

/**
 * @swagger
 * /profiles/interviewer:
 *   put:
 *     tags: [Profiles]
 *     summary: Update interviewer profile
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/interviewer',
  authenticate,
  authorize(UserRole.INTERVIEWER),
  validateBody(updateInterviewerProfileSchema),
  profileController.updateInterviewerProfile
);

// ============ CANDIDATE SEARCH (EMPLOYER) ============

/**
 * @swagger
 * /profiles/candidates:
 *   get:
 *     tags: [Profiles]
 *     summary: Search candidates (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/candidates',
  authenticate,
  authorize(UserRole.EMPLOYER),
  profileController.searchCandidates
);

/**
 * @swagger
 * /profiles/candidates/{id}:
 *   get:
 *     tags: [Profiles]
 *     summary: Get candidate details (Employer only)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/candidates/:id',
  authenticate,
  authorize(UserRole.EMPLOYER),
  profileController.getCandidateDetails
);

// ============ COMMON ============

/**
 * @swagger
 * /profiles/avatar:
 *   post:
 *     tags: [Profiles]
 *     summary: Upload avatar
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/avatar',
  authenticate,
  uploadLimiter,
  uploadImage.single('avatar'),
  profileController.uploadAvatar
);

/**
 * @swagger
 * /profiles/basic-info:
 *   put:
 *     tags: [Profiles]
 *     summary: Update basic info
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/basic-info',
  authenticate,
  profileController.updateBasicInfo
);

export default router;
