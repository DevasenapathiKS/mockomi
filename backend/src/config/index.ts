import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  apiPrefix: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    s3VideoBucket: string;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  frontend: {
    url: string;
  };
  interview: {
    freeInterviews: number;
    pricePaise: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
  };
  upload: {
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  vc: {
    baseUrl: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  apiPrefix: process.env.API_PREFIX || '/api',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mockomi',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'mockomi',
    s3VideoBucket: process.env.AWS_S3_VIDEO_BUCKET || 'mockomi-videos',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@mockomi.com',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  interview: {
    freeInterviews: parseInt(process.env.FREE_INTERVIEWS || '2', 10),
    pricePaise: parseInt(process.env.INTERVIEW_PRICE_PAISE || '10000', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(','),
  },

  vc: {
    baseUrl: process.env.VC_BASE_URL || 'https://vc.mockomi.com/api',
  },
};

// Validate required environment variables in production
if (config.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export default config;
