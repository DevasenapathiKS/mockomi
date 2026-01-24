# Mockomi Admin Dashboard - Design Specification

## 🎨 Design System

### Color Palette
- **Primary**: `#2563eb` (Deep Blue) / `#4f46e5` (Indigo)
- **Secondary**: `#10b981` (Emerald) / `#14b8a6` (Teal)
- **Neutral**: `#64748b` (Slate) / `#71717a` (Zinc)
- **Success**: `#22c55e` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Background**: `#f8fafc` (Light) / `#0f172a` (Dark)
- **Surface**: `#ffffff` (Light) / `#1e293b` (Dark)

### Typography
- **Font Family**: Inter (Primary), Plus Jakarta Sans (Headings)
- **Scale**:
  - H1: 2.25rem (36px) - Bold
  - H2: 1.875rem (30px) - Bold
  - H3: 1.5rem (24px) - Semibold
  - Body: 1rem (16px) - Regular
  - Small: 0.875rem (14px) - Regular
  - Caption: 0.75rem (12px) - Regular

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Components
- Cards: Rounded-lg (8px), Shadow-sm, Border
- Buttons: Rounded-md (6px), Padding 10px 20px
- Inputs: Rounded-md, Border, Focus ring
- Tables: Striped rows, Hover states
- Badges: Rounded-full, Small padding

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Header: Search | Notifications | Profile       │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │  Main Content Area                   │
│ (240px)  │  - Cards                             │
│          │  - Tables                            │
│          │  - Charts                            │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

## 🎯 Module Specifications

### 1. Dashboard Overview
- **KPIs**: 4 large cards (Users, Jobs, Interviews, Revenue)
- **Charts**: 3 charts (Revenue, Interviews, User Growth)
- **Activity Feed**: Recent 10 activities
- **Quick Stats**: Mini cards for breakdowns

### 2. User Management
- **Tabs**: Job Seekers | Employers | Interviewers | Admins
- **Table**: Sortable, Filterable, Searchable
- **Actions**: View | Edit | Suspend | Delete (dropdown menu)

### 3. Interviewer Approval
- **Queue View**: List of pending applications
- **Detail View**: Full profile with skills, experience
- **Actions**: Approve | Reject (with reason modal)

### 4. Job Management
- **Table**: Company | Role | Applications | Status
- **Filters**: Status, Date range, Company
- **Actions**: View | Disable | Flag

### 5. Interview Management
- **Table**: Candidate | Interviewer | Date | Payment | Status
- **Detail Modal**: Full interview info, recording, feedback
- **Actions**: Cancel | Reschedule | Refund

### 6. Payment & Coupons
- **Revenue Dashboard**: Total, This Month, Growth %
- **Transactions Table**: Date | Amount | Status | Actions
- **Coupon Management**: Create | Edit | View Usage | Toggle Active

### 7. Content Moderation
- **Tabs**: Resumes | Recordings | Reports
- **Review Interface**: Preview + Approve/Remove actions

### 8. Analytics & Reports
- **Date Range Picker**: Last 7/30/90 days, Custom
- **Export Options**: CSV, PDF
- **Charts**: Interactive with tooltips

### 9. System Settings
- **Sections**: General | Payments | Features | Security
- **Form Layout**: Grouped fields, Save buttons per section
