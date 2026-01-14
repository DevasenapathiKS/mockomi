import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { jobService } from '@/services/jobService';
import { JobStatus, Job } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button, Spinner, EmptyState, Modal } from '@/components/ui';

const MyJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => jobService.getEmployerJobs(),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => jobService.deleteJob(jobId),
    onSuccess: () => {
      toast.success('Job deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      setDeleteModal(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete job');
    },
  });

  const publishJobMutation = useMutation({
    mutationFn: (jobId: string) => jobService.publishJob(jobId),
    onSuccess: () => {
      toast.success('Job published successfully');
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish job');
    },
  });

  const closeJobMutation = useMutation({
    mutationFn: (jobId: string) => jobService.closeJob(jobId),
    onSuccess: () => {
      toast.success('Job closed successfully');
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close job');
    },
  });

  const getStatusBadge = (status: JobStatus) => {
    const config: Record<JobStatus, { variant: 'primary' | 'success' | 'warning' | 'danger' | 'gray'; label: string }> = {
      [JobStatus.DRAFT]: { variant: 'gray', label: 'Draft' },
      [JobStatus.PUBLISHED]: { variant: 'success', label: 'Published' },
      [JobStatus.CLOSED]: { variant: 'danger', label: 'Closed' },
      [JobStatus.EXPIRED]: { variant: 'warning', label: 'Expired' },
    };
    return config[status] || { variant: 'gray', label: status };
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not disclosed';
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
    if (min) return `₹${(min / 100000).toFixed(1)}L+`;
    return `Up to ₹${(max! / 100000).toFixed(1)}L`;
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

  const jobs = data?.data || [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
            <p className="text-gray-600 mt-1">
              Manage your job listings and track applications
            </p>
          </div>
          <Link to="/dashboard/my-jobs/create">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Jobs', count: jobs.length, color: 'bg-blue-500' },
            { label: 'Published', count: jobs.filter((j: Job) => j.status === JobStatus.PUBLISHED).length, color: 'bg-green-500' },
            { label: 'Drafts', count: jobs.filter((j: Job) => j.status === JobStatus.DRAFT).length, color: 'bg-gray-500' },
            { label: 'Total Applications', count: jobs.reduce((sum: number, j: Job) => sum + (j.applicationsCount || 0), 0), color: 'bg-purple-500' },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white font-bold text-sm">{stat.count}</span>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Jobs List */}
        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job: Job, index: number) => {
              const statusConfig = getStatusBadge(job.status);

              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/jobs/${job._id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {job.title}
                          </Link>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {job.location?.city || 'Location not specified'}
                          </span>
                          <span className="flex items-center">
                            <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                            {formatSalary(job.salary?.min, job.salary?.max)}
                          </span>
                          <span className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {job.applicationsCount || 0} applications
                          </span>
                          <span className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {job.views || 0} views
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/dashboard/my-jobs/${job._id}/applications`}>
                          <Button variant="outline" size="sm">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            Applications
                          </Button>
                        </Link>

                        {job.status === JobStatus.DRAFT && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishJobMutation.mutate(job._id)}
                            isLoading={publishJobMutation.isPending}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                        )}

                        {job.status === JobStatus.PUBLISHED && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => closeJobMutation.mutate(job._id)}
                            isLoading={closeJobMutation.isPending}
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Close
                          </Button>
                        )}

                        <Link to={`/dashboard/my-jobs/${job._id}/edit`}>
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteModal(job._id)}
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<UserGroupIcon className="h-12 w-12" />}
            title="No job postings yet"
            description="Create your first job posting to start receiving applications from qualified candidates."
            action={
              <Link to="/dashboard/my-jobs/create">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
            }
          />
        )}

        {/* Delete Modal */}
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Delete Job"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this job posting? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteModal && deleteJobMutation.mutate(deleteModal)}
                isLoading={deleteJobMutation.isPending}
              >
                Delete Job
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default MyJobsPage;
