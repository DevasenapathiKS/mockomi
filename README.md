# Mockomi - Job Portal Platform with Mock Interview System

A comprehensive, production-ready job portal platform built with React.js, Node.js, MongoDB, and AWS services. The platform connects job seekers, employers, and interviewers, featuring a unique mock interview system with video recording and payment integration.

## 🚀 Features

### For Job Seekers
- Create and manage professional profiles
- Upload and manage resumes (AWS S3)
- Search and apply for jobs with advanced filters
- Schedule mock interviews with experienced interviewers
- Apply coupon codes for free or discounted interviews
- ₹100 per interview session (or use coupons)
- View interview recordings and detailed feedback
- Track application status in real-time

### For Employers
- Company profile with verification
- Post and manage job listings
- Search candidates with advanced filters
- Review applications and manage hiring pipeline
- Access candidate profiles and resumes

### For Interviewers
- Professional profile with expertise areas
- Set availability for mock interviews
- Conduct interviews and provide detailed feedback
- Upload interview recordings
- Track earnings and payment history
- Admin approval process for quality control

### For Admins
- Dashboard with platform analytics
- User management and moderation
- Interviewer approval/rejection workflow
- Payment monitoring and refunds
- System health monitoring

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Query** for server state management
- **Zustand** for client state management
- **React Router v6** for routing
- **React Hook Form** with Zod validation
- **Framer Motion** for animations
- **Recharts** for analytics charts

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Redis** for caching
- **JWT** for authentication (access + refresh tokens)
- **AWS S3** for file storage
- **Razorpay** for payments (INR)
- **Zod** for request validation
- **Winston** for logging
- **Swagger** for API documentation

### DevOps
- **Docker** & Docker Compose
- **Nginx** for production serving
- AWS deployment ready

## 📁 Project Structure

```
mockomi/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utilities
│   │   ├── validations/    # Zod schemas
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Server entry point
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- Redis 7+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mockomi.git
   cd mockomi
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

### Docker Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB Admin: http://localhost:8081
```

### Production Deployment

```bash
# Build and start production containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## 📚 API Documentation

The API is documented using Swagger/OpenAPI. Access the documentation at:
- Development: http://localhost:5000/api-docs
- Production: https://api.mockomi.com/api-docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | User login |
| GET | /api/v1/jobs | List jobs with filters |
| POST | /api/v1/jobs | Create job (employer) |
| POST | /api/v1/applications/job/:id | Apply to job |
| POST | /api/v1/interviews | Schedule interview |
| GET | /api/v1/admin/dashboard | Admin dashboard |

## 💳 Payment Integration

The platform uses Razorpay for payment processing:
- Each mock interview costs ₹100
- **Coupon-based system**: Apply coupon codes for free or discounted interviews
- Coupons have per-user and global usage limits
- Payments are processed before scheduling (unless using a valid coupon)
- Refunds available through admin panel

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting on all endpoints
- Input validation with Zod
- Password hashing with bcrypt
- CORS configuration
- Helmet security headers
- XSS protection

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## 📦 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mockomi
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=mockomi-uploads
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Frontend (.env)
```env
VITE_API_URL=/api/v1
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Razorpay](https://razorpay.com/)
- [AWS](https://aws.amazon.com/)