# Mockomi Admin Portal

A modern, production-ready admin dashboard for the Mockomi job portal platform.

## Features

- **Dashboard Overview**: Real-time KPIs, charts, and activity feed
- **User Management**: Manage all platform users with filtering and status updates
- **Interviewer Approval**: Review and approve/reject interviewer applications
- **Payment Management**: Monitor transactions, revenue, and process refunds
- **Coupon System**: Create and manage discount coupons
- **System Health**: Monitor database, Redis, and S3 status
- **Responsive Design**: Fully responsive with dark mode support

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Query** for data fetching
- **Zustand** for state management
- **Recharts** for data visualization
- **React Router** for navigation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:5000`

### Installation

```bash
cd admin-portal
npm install
```

### Development

```bash
npm run dev
```

The admin portal will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

## Design System

### Colors

- **Primary**: Deep Blue (#2563eb)
- **Secondary**: Emerald (#10b981)
- **Neutral**: Slate/Zinc grays
- **Status Colors**: Green (success), Amber (warning), Red (error)

### Typography

- **Font Family**: Inter (body), Plus Jakarta Sans (headings)
- **Scale**: Clear hierarchy from H1 to body text

## Default Login

- **Email**: `admin@gmail.com`
- **Password**: `admin1234`

## Project Structure

```
admin-portal/
├── src/
│   ├── components/
│   │   ├── layout/      # Dashboard layout with sidebar
│   │   └── ui/          # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── package.json
└── vite.config.ts
```

## Features in Detail

### Dashboard
- Real-time statistics
- Revenue charts
- Interview analytics
- User growth tracking
- Recent activity feed

### User Management
- Filter by role and status
- Search functionality
- Bulk actions
- Status updates (activate/suspend)

### Interviewer Approval
- Pending applications queue
- Profile preview with skills and experience
- Approve/reject with reason

### Payment Management
- Revenue statistics
- Transaction history
- Refund processing
- Status filtering

### Coupon Management
- Create/edit coupons
- Percentage or flat discounts
- Usage limits (global & per user)
- Expiry dates
- Active/inactive toggle

## API Integration

The admin portal integrates with the backend API at `/api/v1/admin/*` endpoints. All requests are authenticated using JWT tokens stored in localStorage.

## License

MIT
