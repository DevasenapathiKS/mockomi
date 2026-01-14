import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { jobService } from '@/services/jobService';
import { ApplicationStatus } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Spinner, EmptyState, Badge, Modal, Textarea, Avatar } from '@/components/ui';

const JobApplicationsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJob(jobId!),
    enabled: !!jobId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => jobService.getJobApplications(jobId!),
    enabled: !!jobId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ applicationId, status, reason }: { applicationId: string; status: ApplicationStatus; reason?: string }) =>
      jobService.updateApplicationStatus(applicationId, status, reason),
    onSuccess: () => {
      toast.success('Application status updated');
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
      setRejectModal(false);
      setRejectionReason('');
      setSelectedApplication(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleReject = () => {
    if (!selectedApplication) return;
    updateStatusMutation.mutate({
      applicationId: selectedApplication._id,
      status: ApplicationStatus.REJECTED,
      reason: rejectionReason,
    });
  };

  const openRejectModal = (applicationId: string) => {
    const app = applications.find((a: any) => a._id === applicationId);
    setSelectedApplication(app);
    setRejectModal(true);
  };

  const applications = data?.data || [];
  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter((app: any) => app.status === statusFilter);

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case ApplicationStatus.REVIEWED:
        return <Badge variant="info">Reviewed</Badge>;
      case ApplicationStatus.SHORTLISTED:
        return <Badge variant="success">Shortlisted</Badge>;
      case ApplicationStatus.INTERVIEW:
        return <Badge variant="primary">Interview</Badge>;
      case ApplicationStatus.OFFERED:
        return <Badge variant="success">Offered</Badge>;
      case ApplicationStatus.REJECTED:
        return <Badge variant="danger">Rejected</Badge>;
      case ApplicationStatus.WITHDRAWN:
        return <Badge variant="gray">Withdrawn</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const applicationCounts = {
    all: applications.length,
    pending: applications.filter((a: any) => a.status === ApplicationStatus.PENDING).length,
    shortlisted: applications.filter((a: any) => a.status === ApplicationStatus.SHORTLISTED).length,
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

  console.log('applications', applications);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            to="/dashboard/my-jobs"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to My Jobs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Applications for {job?.title}
          </h1>
          <p className="text-gray-600 mt-1">
            {applicationCounts.all} total applications
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All', count: applicationCounts.all },
            { key: 'pending', label: 'Pending', count: applicationCounts.pending },
            { key: 'shortlisted', label: 'Shortlisted', count: applicationCounts.shortlisted },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application: any, index: number) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar
                      src={application.applicant?.avatar}
                      name={`${application.applicant?.firstName} ${application.applicant?.lastName}`}
                      size="lg"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {application.jobSeekerId?.firstName} {application.jobSeekerId?.lastName}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {application.applicant?.email}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {application.resume && (
                        <a
                          href={application.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        </a>
                      )}

                      {application.status === ApplicationStatus.PENDING && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                applicationId: application._id,
                                status: ApplicationStatus.SHORTLISTED,
                              })
                            }
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Shortlist
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRejectModal(application._id)}
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {application.status === ApplicationStatus.SHORTLISTED && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              applicationId: application._id,
                              status: ApplicationStatus.INTERVIEW,
                            })
                          }
                        >
                          Schedule Interview
                        </Button>
                      )}
                    </div>
                  </div>

                  {application.coverLetter && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Cover Letter</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BriefcaseIcon className="h-12 w-12" />}
            title="No applications yet"
            description="Applications will appear here once candidates apply to this job."
          />
        )}

        {/* Reject Modal */}
        <Modal
          isOpen={rejectModal}
          onClose={() => setRejectModal(false)}
          title="Reject Application"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to reject this application? You can optionally provide a reason.
            </p>
            <Textarea
              label="Rejection Reason (optional)"
              placeholder="Provide feedback for the candidate..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={updateStatusMutation.isPending}
              >
                Reject Application
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default JobApplicationsPage;
