import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  VideoCameraIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout';
import { Card, Spinner } from '@/components/ui';
import api from '@/services/api';

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalJobs: number;
  activeJobs: number;
  totalInterviews: number;
  completedInterviews: number;
  totalRevenue: number;
  revenueThisMonth: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'job_posted' | 'interview_completed' | 'payment_received';
  message: string;
  timestamp: string;
}

const AdminDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data;
    },
  });

  const stats: DashboardStats = data?.stats || {
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalInterviews: 0,
    completedInterviews: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    userGrowth: 0,
    revenueGrowth: 0,
  };

  const recentActivity: RecentActivity[] = data?.recentActivity || [];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      subValue: `+${stats.newUsersThisMonth} this month`,
      icon: UsersIcon,
      color: 'bg-blue-500',
      growth: stats.userGrowth,
      link: '/admin/users',
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs.toLocaleString(),
      subValue: `${stats.totalJobs} total`,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      link: '/admin/jobs',
    },
    {
      title: 'Interviews',
      value: stats.completedInterviews.toLocaleString(),
      subValue: `${stats.totalInterviews} scheduled`,
      icon: VideoCameraIcon,
      color: 'bg-purple-500',
      link: '/admin/interviews',
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      subValue: `₹${stats.revenueThisMonth.toLocaleString()} this month`,
      icon: CurrencyRupeeIcon,
      color: 'bg-yellow-500',
      growth: stats.revenueGrowth,
      link: '/admin/payments',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'job_posted':
        return <BriefcaseIcon className="h-5 w-5 text-green-500" />;
      case 'interview_completed':
        return <VideoCameraIcon className="h-5 w-5 text-purple-500" />;
      case 'payment_received':
        return <CurrencyRupeeIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your platform's performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div
                      className={`${stat.color} p-3 rounded-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    {stat.growth !== undefined && (
                      <div className={`flex items-center text-sm ${
                        stat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.growth >= 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(stat.growth)}%
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.subValue}
                    </p>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/admin/users"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-600">View all users</p>
                </div>
              </Link>
              <Link
                to="/admin/jobs"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BriefcaseIcon className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Jobs</p>
                  <p className="text-sm text-gray-600">Review job posts</p>
                </div>
              </Link>
              <Link
                to="/admin/interviewers"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <VideoCameraIcon className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Interviewers</p>
                  <p className="text-sm text-gray-600">Manage interviewers</p>
                </div>
              </Link>
              <Link
                to="/admin/companies"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BuildingOfficeIcon className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Companies</p>
                  <p className="text-sm text-gray-600">View companies</p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No recent activity
                </p>
              ) : (
                recentActivity.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Platform Stats */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalUsers}
              </p>
              <p className="text-sm text-gray-600">Registered Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {stats.totalJobs}
              </p>
              <p className="text-sm text-gray-600">Jobs Posted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalInterviews}
              </p>
              <p className="text-sm text-gray-600">Interviews Conducted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                ₹{stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
