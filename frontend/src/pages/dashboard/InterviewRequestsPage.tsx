import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { interviewService } from '@/services/interviewService';
import { Interview, InterviewStatus } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Badge, Spinner, Modal, Avatar, Alert } from '@/components/ui';

const InterviewRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] = useState<Interview | null>(null);
  const [claimModal, setClaimModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    duration: 60,
  });

  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['available-interview-requests'],
    queryFn: () => interviewService.getAvailableRequests(),
  });

  const claimMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { scheduledAt: string; duration?: number } }) =>
      interviewService.claimInterview(id, data),
    onSuccess: () => {
      toast.success('Interview claimed successfully! The job seeker has been notified.');
      setClaimModal(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['available-interview-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to claim interview');
    },
  });

  const handleClaim = () => {
    if (!selectedRequest || !scheduleData.date || !scheduleData.time) {
      toast.error('Please select a date and time');
      return;
    }

    const scheduledAt = new Date(`${scheduleData.date}T${scheduleData.time}`);
    
    // Validate the scheduled time is in the future
    if (scheduledAt <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    claimMutation.mutate({
      id: selectedRequest._id,
      data: {
        scheduledAt: scheduledAt.toISOString(),
        duration: scheduleData.duration,
      },
    });
  };

  const openClaimModal = (request: Interview) => {
    setSelectedRequest(request);
    setScheduleData({
      date: '',
      time: '',
      duration: request.preferredDuration || 60,
    });
    setClaimModal(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getExpiryInfo = (expiresAt?: string | null) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return { text: 'Expires soon', urgent: true };
    }
    return { text: `${diffDays} days left`, urgent: false };
  };

  const requests = requestsData?.data || [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Available Interview Requests</h1>
          <p className="text-gray-600 mt-1">
            View and claim interview requests matching your expertise
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 bg-green-50 border-green-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">How to Claim Interviews</h3>
              <p className="text-green-700 mt-1">
                Browse requests that match your expertise. When you claim a request, you&apos;ll set the interview time
                based on your availability. The job seeker will be automatically notified.
              </p>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="error">
            Failed to load interview requests. Please try again.
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && requests.length === 0 && (
          <Card className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Requests Available</h3>
            <p className="mt-2 text-gray-600">
              There are no interview requests matching your expertise at the moment.
              Check back later!
            </p>
          </Card>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {requests.map((request: Interview, index: number) => {
            const expiryInfo = getExpiryInfo(request.expiresAt);
            
            return (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Job Seeker Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar
                        src={request.jobSeeker?.avatar}
                        name={`${request.jobSeeker?.firstName} ${request.jobSeeker?.lastName}`}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {request.jobSeeker?.firstName} {request.jobSeeker?.lastName}
                          </h3>
                          <Badge variant="info">
                            {InterviewStatus.REQUESTED === request.status ? 'New Request' : request.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-1">
                          <UserIcon className="inline h-4 w-4 mr-1" />
                          Requested {formatTimeAgo(request.createdAt)}
                        </p>

                        {/* Requested Skills */}
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Requested Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.requestedSkills?.map((skill) => (
                              <Badge key={skill} variant="primary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Duration & Notes */}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {request.preferredDuration || 60} min preferred
                          </span>
                          {expiryInfo && (
                            <span className={`flex items-center ${expiryInfo.urgent ? 'text-orange-600' : ''}`}>
                              {expiryInfo.urgent && <ExclamationTriangleIcon className="h-4 w-4 mr-1" />}
                              {expiryInfo.text}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {request.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {request.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div className="flex items-center">
                      <Button onClick={() => openClaimModal(request)}>
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        Claim & Schedule
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Claim Modal */}
        <Modal
          isOpen={claimModal}
          onClose={() => setClaimModal(false)}
          title="Claim Interview Request"
          size="md"
        >
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={selectedRequest.jobSeeker?.avatar}
                    name={`${selectedRequest.jobSeeker?.firstName} ${selectedRequest.jobSeeker?.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.jobSeeker?.firstName} {selectedRequest.jobSeeker?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Skills: {selectedRequest.requestedSkills?.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Form */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Set Interview Time</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={scheduleData.date}
                      onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={scheduleData.time}
                      onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={scheduleData.duration}
                  onChange={(e) => setScheduleData({ ...scheduleData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Candidate preferred: {selectedRequest.preferredDuration || 60} minutes
                </p>
              </div>

              {selectedRequest.notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Candidate&apos;s Notes:</strong> {selectedRequest.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setClaimModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleClaim}
                  isLoading={claimMutation.isPending}
                  disabled={!scheduleData.date || !scheduleData.time}
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Confirm & Claim
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default InterviewRequestsPage;
