import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { interviewService } from '@/services/interviewService';
import { useAuthStore } from '@/store/authStore';
import { InterviewStatus, UserRole } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Card, Badge, Button, Spinner, EmptyState, Modal, Textarea } from '@/components/ui';

const InterviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isInterviewer = user?.role === UserRole.INTERVIEWER;

  const [page, setPage] = useState(1);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<any | null>(null);
  const [feedback, setFeedback] = useState({
    rating: 0,
    technicalSkills: 0,
    communication: 0,
    problemSolving: 0,
    strengths: '',
    improvements: '',
    overallComments: '',
    recommendation: 'maybe',
  });

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['my-interviews', page],
    queryFn: () => interviewService.getMyInterviews(undefined, page, 100),
  });

  const pagination = interviews?.pagination;

  const getMeetingUrl = (interview: any) => interview?.meetingUrl;

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: { interviewId: string; feedback: any }) =>
      interviewService.submitFeedback(data.interviewId, data.feedback),
    onSuccess: () => {
      toast.success('Feedback submitted successfully!');
      setFeedbackModal(false);
      setSelectedInterview(null);
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });

  const startInterviewMutation = useMutation({
    mutationFn: (interviewId: string) => interviewService.startInterview(interviewId),
    onSuccess: (data) => {
      toast.success('Interview started!');
      // Open video call link if available
      if (getMeetingUrl(data)) {
        const baseUrl = getMeetingUrl(data);
        const url = new URL(baseUrl);
        if (user?.firstName || user?.lastName) {
          url.searchParams.set('name', `${user?.firstName || ''} ${user?.lastName || ''}`.trim());
        }
        if (isInterviewer) {
          url.searchParams.set('recording', 'true');
        }
        window.open(url.toString(), '_blank');
        // window.open(getMeetingUrl(data)!, '_blank');
      }
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start interview');
    },
  });

  const getStatusBadge = (status: InterviewStatus) => {
    const config: Record<InterviewStatus, { variant: 'primary' | 'gray' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
      [InterviewStatus.REQUESTED]: { variant: 'info', label: 'Pending' },
      [InterviewStatus.SCHEDULED]: { variant: 'primary', label: 'Scheduled' },
      [InterviewStatus.IN_PROGRESS]: { variant: 'warning', label: 'In Progress' },
      [InterviewStatus.COMPLETED]: { variant: 'success', label: 'Completed' },
      [InterviewStatus.CANCELLED]: { variant: 'danger', label: 'Cancelled' },
      [InterviewStatus.NO_SHOW]: { variant: 'gray', label: 'No Show' },
      [InterviewStatus.EXPIRED]: { variant: 'gray', label: 'Expired' },
    };
    return config[status] || { variant: 'gray', label: status };
  };

  const handleOpenFeedback = (interview: any) => {
    setSelectedInterview(interview);
    setFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    if (!selectedInterview) return;

    // Backend expects arrays and specific field names; map our UI state accordingly
    const strengthsArr = feedback.strengths
      ? feedback.strengths
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      : [];

    const improvementsArr = feedback.improvements
      ? feedback.improvements
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      : [];

    const payload = {
      rating: feedback.rating,
      technicalSkills: feedback.technicalSkills,
      communication: feedback.communication,
      problemSolving: feedback.problemSolving,
      overallPerformance: feedback.rating, // reuse overall rating
      strengths: strengthsArr,
      areasOfImprovement: improvementsArr,
      detailedFeedback: feedback.overallComments || '',
      isPublic: true,
    };

    submitFeedbackMutation.mutate({
      interviewId: selectedInterview._id,
      feedback: payload as any,
    });
  };

  const RatingStars: React.FC<{ value: number; onChange: (val: number) => void }> = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          {star <= value ? (
            <StarSolidIcon className="h-6 w-6 text-yellow-400" />
          ) : (
            <StarIcon className="h-6 w-6 text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );

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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isInterviewer ? 'My Interview Sessions' : 'My Mock Interviews'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isInterviewer
                ? 'Manage your scheduled interview sessions'
                : 'Track your mock interview practice sessions'}
            </p>
          </div>
          {!isInterviewer && (
            <Link to="/dashboard/interviews/schedule">
              <Button>
                <VideoCameraIcon className="h-5 w-5 mr-2" />
                Schedule Interview
              </Button>
            </Link>
          )}
        </div>

        {/* Interview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', count: interviews?.data?.length || 0, icon: VideoCameraIcon, color: 'bg-blue-500' },
            { label: 'Scheduled', count: interviews?.data?.filter((i: any) => i.status === InterviewStatus.SCHEDULED).length || 0, icon: CalendarIcon, color: 'bg-yellow-500' },
            { label: 'Completed', count: interviews?.data?.filter((i: any) => i.status === InterviewStatus.COMPLETED).length || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
            { label: 'Cancelled', count: interviews?.data?.filter((i: any) => i.status === InterviewStatus.CANCELLED).length || 0, icon: XCircleIcon, color: 'bg-red-500' },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Interviews List */}
        {interviews?.data && interviews.data.length > 0 ? (
          <div className="space-y-4">
            {interviews.data.map((interview: any, index: number) => {
              const statusConfig = getStatusBadge(interview.status);

              return (
                <motion.div
                  key={interview._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <VideoCameraIcon className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {interview.type.replace('_', ' ')} Interview
                            </h3>
                            <p className="text-sm text-gray-600">
                              {isInterviewer
                                ? `With ${interview.jobSeeker?.firstName} ${interview.jobSeeker?.lastName}`
                                : `With ${interview.interviewer?.firstName} ${interview.interviewer?.lastName}`}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(interview.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {interview.duration} mins
                          </span>
                          {interview.isPaid && (
                            <span className="flex items-center text-green-600">
                              <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                              Paid
                            </span>
                          )}
                        </div>

                        {interview.feedback && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarSolidIcon
                                  key={star}
                                  className={`h-4 w-4 ${star <= interview.feedback.rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              Rating: {interview.feedback.rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>

                        {isInterviewer && interview.status === InterviewStatus.SCHEDULED && (
                          <Button
                            size="sm"
                            onClick={() => startInterviewMutation.mutate(interview._id)}
                            isLoading={startInterviewMutation.isPending}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}

                        <Link to={`/dashboard/interviews/${interview._id}/panel`}>
                          <Button size="sm" variant="outline">
                            Open Panel
                          </Button>
                        </Link>

                        {interview.status === InterviewStatus.IN_PROGRESS && getMeetingUrl(interview) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const baseUrl = getMeetingUrl(interview);
                              const url = new URL(baseUrl);
                              if (user?.firstName || user?.lastName) {
                                url.searchParams.set('name', `${user?.firstName || ''} ${user?.lastName || ''}`.trim());
                              }
                              if (isInterviewer) {
                                url.searchParams.set('recording', 'true');
                              }
                              window.open(url.toString(), '_blank');
                            }}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}

                        {interview.status === InterviewStatus.COMPLETED && isInterviewer && !interview.feedback && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenFeedback(interview)}
                          >
                            <StarIcon className="h-4 w-4 mr-1" />
                            Give Feedback
                          </Button>
                        )}

                        {interview.feedback && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewFeedback(interview.feedback)}
                          >
                            View Feedback
                          </Button>
                        )}

                        {interview.recording?.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(interview.recording.url, '_blank')}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Watch Recording
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<VideoCameraIcon className="h-12 w-12" />}
            title={isInterviewer ? 'No interview sessions' : 'No mock interviews yet'}
            description={
              isInterviewer
                ? 'You have no scheduled interview sessions.'
                : 'Schedule a mock interview to practice with an expert interviewer.'
            }
            action={
              !isInterviewer && (
                <Link to="/dashboard/interviews/schedule">
                  <Button>Schedule Your First Interview</Button>
                </Link>
              )
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

        {/* Feedback Modal */}
        <Modal
          isOpen={feedbackModal}
          onClose={() => setFeedbackModal(false)}
          title="Submit Interview Feedback"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating
              </label>
              <RatingStars
                value={feedback.rating}
                onChange={(val) => setFeedback({ ...feedback, rating: val })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Skills
                </label>
                <RatingStars
                  value={feedback.technicalSkills}
                  onChange={(val) => setFeedback({ ...feedback, technicalSkills: val })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication
                </label>
                <RatingStars
                  value={feedback.communication}
                  onChange={(val) => setFeedback({ ...feedback, communication: val })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Solving
                </label>
                <RatingStars
                  value={feedback.problemSolving}
                  onChange={(val) => setFeedback({ ...feedback, problemSolving: val })}
                />
              </div>
            </div>

            <Textarea
              label="Strengths"
              placeholder="What did the candidate do well?"
              value={feedback.strengths}
              onChange={(e) => setFeedback({ ...feedback, strengths: e.target.value })}
              rows={3}
            />

            <Textarea
              label="Areas for Improvement"
              placeholder="What could the candidate improve?"
              value={feedback.improvements}
              onChange={(e) => setFeedback({ ...feedback, improvements: e.target.value })}
              rows={3}
            />

            <Textarea
              label="Overall Comments"
              placeholder="Any other feedback?"
              value={feedback.overallComments}
              onChange={(e) => setFeedback({ ...feedback, overallComments: e.target.value })}
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'strong_yes', label: 'Strong Yes' },
                  { value: 'yes', label: 'Yes' },
                  { value: 'maybe', label: 'Maybe' },
                  { value: 'no', label: 'No' },
                  { value: 'strong_no', label: 'Strong No' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="recommendation"
                      value={option.value}
                      checked={feedback.recommendation === option.value}
                      onChange={(e) => setFeedback({ ...feedback, recommendation: e.target.value })}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="ml-2 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setFeedbackModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                isLoading={submitFeedbackMutation.isPending}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Feedback Modal */}
        <Modal
          isOpen={!!viewFeedback}
          onClose={() => setViewFeedback(null)}
          title="Interview Feedback"
          size="lg"
        >
          {viewFeedback ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Overall Rating</p>
                  <p className="text-lg font-semibold">{viewFeedback.rating}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overall Performance</p>
                  <p className="text-lg font-semibold">{viewFeedback.overallPerformance ?? viewFeedback.rating}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Technical Skills</p>
                  <p className="text-lg font-semibold">{viewFeedback.technicalSkills}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Problem Solving</p>
                  <p className="text-lg font-semibold">{viewFeedback.problemSolving}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Communication</p>
                  <p className="text-lg font-semibold">{viewFeedback.communication}/5</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Strengths</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {(viewFeedback.strengths || []).map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Areas of Improvement</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {(viewFeedback.areasOfImprovement || []).map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {viewFeedback.detailedFeedback && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Detailed Feedback</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewFeedback.detailedFeedback}</p>
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default InterviewsPage;
