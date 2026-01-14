import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { AppError } from '../utils/errors';

// File filter for resumes
const resumeFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF, DOC, and DOCX files are allowed for resumes', 400));
  }
};

// File filter for images
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
};

// File filter for videos
const videoFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only MP4, WebM, and MOV videos are allowed', 400));
  }
};

// Memory storage for S3 uploads
const memoryStorage = multer.memoryStorage();

// Generate unique filename
const generateFilename = (file: Express.Multer.File): string => {
  const ext = path.extname(file.originalname);
  return `${uuidv4()}${ext}`;
};

// Resume upload configuration
export const uploadResume = multer({
  storage: memoryStorage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// Image upload configuration
export const uploadImage = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

// Multiple images upload
export const uploadImages = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB per file
    files: 5,
  },
});

// Video upload configuration
export const uploadVideo = multer({
  storage: memoryStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
    files: 1,
  },
});

// General file upload
export const uploadFile = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,
  },
});

export { generateFilename };
