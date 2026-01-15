import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { UserRole } from '@/types';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderJobSeekerDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <DocumentTextIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Applications</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <CalendarIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Interviews</p>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-secondary-100 rounded-xl">
            <ChartBarIcon className="h-8 w-8 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Profile Views</p>
            <p className="text-2xl font-bold text-gray-900">45</p>
          </div>
        </CardContent>
      </Card> */}

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BriefcaseIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Applied to Senior React Developer</p>
                <p className="text-sm text-gray-500">at TechCorp Inc. • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Mock interview scheduled</p>
                <p className="text-sm text-gray-500">Technical Interview • Tomorrow at 2:00 PM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmployerDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <BriefcaseIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Jobs</p>
            <p className="text-2xl font-bold text-gray-900">8</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Applications</p>
            <p className="text-2xl font-bold text-gray-900">156</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-secondary-100 rounded-xl">
            <UsersIcon className="h-8 w-8 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Shortlisted</p>
            <p className="text-2xl font-bold text-gray-900">24</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <ChartBarIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Views</p>
            <p className="text-2xl font-bold text-gray-900">1.2k</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInterviewerDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <CalendarIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Interviews</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-gray-900">42</p>
          </div>
        </CardContent>
      </Card>

      <Card hover>
        <CardContent className="flex items-center gap-4">
          <div className="p-3 bg-secondary-100 rounded-xl">
            <CurrencyRupeeIcon className="h-8 w-8 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Earnings</p>
            <p className="text-2xl font-bold text-gray-900">₹4,200</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDashboardContent = () => {
    switch (user?.role) {
      case UserRole.JOB_SEEKER:
        return renderJobSeekerDashboard();
      case UserRole.EMPLOYER:
        return renderEmployerDashboard();
      case UserRole.INTERVIEWER:
        return renderInterviewerDashboard();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getWelcomeMessage()}, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your account.</p>
        </div>

        {renderDashboardContent()}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
