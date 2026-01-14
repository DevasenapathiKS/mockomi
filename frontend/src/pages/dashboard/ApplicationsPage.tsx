import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { jobService } from '@/services/jobService';
import { ApplicationStatus, JobApplication } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Spinner, EmptyState } from '@/components/ui';

const ApplicationsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', page],
    queryFn: () => jobService.getMyApplications(page, 10),
  });

  const applications = data?.data || [];
  const pagination = data?.pagination;

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter((app: JobApplication) => app.status === statusFilter);

  const getStatusConfig = (status: ApplicationStatus) => {
    const configs: Record<ApplicationStatus, { label: string; color: string; icon: React.ElementType }> = {
      [ApplicationStatus.PENDING]: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
      [ApplicationStatus.REVIEWED]: { label: 'Reviewed', color: 'bg-blue-100 text-blue-700', icon: EyeIcon },
      [ApplicationStatus.SHORTLISTED]: { label: 'Shortlisted', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
      [ApplicationStatus.INTERVIEW]: { label: 'Interview', color: 'bg-purple-100 text-purple-700', icon: CalendarIcon },
      [ApplicationStatus.OFFERED]: { label: 'Offered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon },
      [ApplicationStatus.REJECTED]: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircleIcon },
      [ApplicationStatus.WITHDRAWN]: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: XCircleIcon },
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: ClockIcon };
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a: JobApplication) => a.status === ApplicationStatus.PENDING).length,
    shortlisted: applications.filter((a: JobApplication) => a.status === ApplicationStatus.SHORTLISTED).length,
    rejected: applications.filter((a: JobApplication) => a.status === ApplicationStatus.REJECTED).length,
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', count: stats.total, color: 'bg-blue-500' },
            { label: 'Pending', count: stats.pending, color: 'bg-yellow-500' },
            { label: 'Shortlisted', count: stats.shortlisted, color: 'bg-green-500' },
            { label: 'Rejected', count: stats.rejected, color: 'bg-red-500' },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <div className={`w-3 h-3 ${stat.color} rounded-full mx-auto mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', ...Object.values(ApplicationStatus)].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application: JobApplication, index: number) => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        {application.job?.company?.logo ? (
                          <img
                            src={application.job.company.logo}
                            alt={application.job.company.companyName}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-7 w-7 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <Link
                              to={`/jobs/${application.job?._id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                            >
                              {application.job?.title || 'Job Title'}
                            </Link>
                            <p className="text-gray-600">
                              {application.job?.company?.companyName || 'Company'}
                            </p>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusConfig.label}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          {application.job?.location && (
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {application.job.location.city || application.job.location.country}
                            </div>
                          )}
                          <div className="flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            {application.job?.jobType?.replace('-', ' ') || 'Full Time'}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </div>
                        </div>

                        {application.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Note:</span> {application.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2">
                        <Link to={`/jobs/${application.job?._id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No applications found"
            description={
              statusFilter !== 'all'
                ? `You don't have any ${statusFilter.replace('_', ' ')} applications.`
                : "You haven't applied to any jobs yet."
            }
            action={
              <Link to="/jobs">
                <Button>Browse Jobs</Button>
              </Link>
            }
          />
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage;
