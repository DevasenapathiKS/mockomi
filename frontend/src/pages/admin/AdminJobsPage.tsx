import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Spinner, Badge, Modal } from '@/components/ui';
import api from '@/services/api';

interface Job {
  _id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: string;
  type: string;
  status: 'active' | 'paused' | 'closed' | 'pending';
  applications: number;
  createdAt: string;
  salary?: {
    min: number;
    max: number;
  };
}

const AdminJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [actionModal, setActionModal] = useState<'view' | 'approve' | 'reject' | 'delete' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', { search, statusFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/admin/jobs?${params.toString()}`);
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      const response = await api.patch(`/admin/jobs/${jobId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success('Job status updated');
      setActionModal(null);
    },
    onError: () => {
      toast.error('Failed to update job status');
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.delete(`/admin/jobs/${jobId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success('Job deleted');
      setActionModal(null);
    },
    onError: () => {
      toast.error('Failed to delete job');
    },
  });

  const jobs = data?.jobs || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'closed':
        return <Badge variant="gray">Closed</Badge>;
      case 'pending':
        return <Badge variant="info">Pending Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} total job postings
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search jobs or companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="pending">Pending Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </Card>

        {/* Jobs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No jobs found</p>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job: Job, index: number) => (
                    <motion.tr
                      key={job._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-500 capitalize">{job.type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {job.company.logo ? (
                            <img
                              src={job.company.logo}
                              alt={job.company.name}
                              className="h-8 w-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <span className="text-gray-900">{job.company.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-gray-600">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {job.applications}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job);
                              setActionModal('view');
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {job.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setActionModal('approve');
                                }}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setActionModal('reject');
                                }}
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setSelectedJob(job);
                              setActionModal('delete');
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Approve Modal */}
        <Modal
          isOpen={actionModal === 'approve' && !!selectedJob}
          onClose={() => setActionModal(null)}
          title="Approve Job"
          size="sm"
        >
          {selectedJob && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to approve "{selectedJob.title}" posted by {selectedJob.company.name}?
                It will be visible to all job seekers.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate({
                    jobId: selectedJob._id,
                    status: 'active',
                  })}
                  isLoading={updateStatusMutation.isPending}
                >
                  Approve Job
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={actionModal === 'reject' && !!selectedJob}
          onClose={() => setActionModal(null)}
          title="Reject Job"
          size="sm"
        >
          {selectedJob && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to reject "{selectedJob.title}"? The employer will be notified.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => updateStatusMutation.mutate({
                    jobId: selectedJob._id,
                    status: 'closed',
                  })}
                  isLoading={updateStatusMutation.isPending}
                >
                  Reject Job
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={actionModal === 'delete' && !!selectedJob}
          onClose={() => setActionModal(null)}
          title="Delete Job"
          size="sm"
        >
          {selectedJob && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to permanently delete "{selectedJob.title}"?
                This will also delete all associated applications.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteJobMutation.mutate(selectedJob._id)}
                  isLoading={deleteJobMutation.isPending}
                >
                  Delete Job
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminJobsPage;
