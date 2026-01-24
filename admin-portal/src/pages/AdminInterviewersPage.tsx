import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CheckCircle, XCircle, Star, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminInterviewersPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'top'>('pending');
  const [page, setPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedInterviewer, setSelectedInterviewer] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-interviewers', page],
    queryFn: () => adminService.getPendingInterviewers(page, 10),
    enabled: activeTab === 'pending',
  });

  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['admin-top-interviewers'],
    queryFn: adminService.getTopInterviewers,
    enabled: activeTab === 'top',
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved, reason }: { id: string; isApproved: boolean; reason?: string }) =>
      adminService.approveInterviewer(id, isApproved, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-interviewers'] });
      toast.success('Interviewer status updated');
      setSelectedInterviewer(null);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, isApproved: true });
  };

  const handleReject = () => {
    if (!selectedInterviewer) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    approveMutation.mutate({
      id: selectedInterviewer,
      isApproved: false,
      reason: rejectionReason,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Interviewer Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review and approve interviewer applications
          </p>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-0">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('pending')}
                className={`
                  px-6 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === 'pending'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }
                `}
              >
                Pending Approvals
                {pendingData && pendingData.total > 0 && (
                  <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 px-2 py-0.5 rounded-full">
                    {pendingData.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('top')}
                className={`
                  px-6 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === 'top'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }
                `}
              >
                Top Performers
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </CardContent>
              </Card>
            ) : pendingData && pendingData.data.length > 0 ? (
              pendingData.data.map((interviewer) => (
                <Card key={interviewer._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            {(interviewer.user || interviewer.userId)?.firstName || 'Unknown'}{' '}
                            {(interviewer.user || interviewer.userId)?.lastName || 'User'}
                          </h3>
                          <Badge variant="warning">Pending</Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          {(interviewer.user || interviewer.userId)?.email || 'N/A'}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Experience:
                            </span>{' '}
                            <span className="text-slate-600 dark:text-slate-400">
                              {interviewer.experience} years
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Skills:
                            </span>{' '}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {interviewer.skills.map((skill, idx) => (
                                <Badge key={idx} variant="info">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {interviewer.bio && (
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Bio:
                              </span>{' '}
                              <p className="text-slate-600 dark:text-slate-400 mt-1">
                                {interviewer.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(interviewer._id)}
                          isLoading={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setSelectedInterviewer(interviewer._id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No pending interviewers</p>
                </CardContent>
              </Card>
            )}

            {/* Rejection Modal */}
            {selectedInterviewer && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle>Reject Interviewer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Rejection Reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      onClick={handleReject}
                      isLoading={approveMutation.isPending}
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedInterviewer(null);
                        setRejectionReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Top Performers */}
        {activeTab === 'top' && (
          <Card>
            <CardHeader>
              <CardTitle>Top Interviewers</CardTitle>
            </CardHeader>
            <CardContent>
              {topLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : topData && topData.length > 0 ? (
                <div className="space-y-4">
                  {topData.map((interviewer, idx) => (
                    <div
                      key={interviewer._id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                            {(interviewer.user || interviewer.userId)?.firstName || 'Unknown'}{' '}
                            {(interviewer.user || interviewer.userId)?.lastName || 'User'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {(interviewer.user || interviewer.userId)?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Experience</p>
                          <p className="font-semibold">{interviewer.experience} years</p>
                        </div>
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400">No top performers yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
