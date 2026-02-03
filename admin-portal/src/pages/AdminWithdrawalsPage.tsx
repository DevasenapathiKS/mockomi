import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WithdrawalStatus, AdminWithdrawal } from '@/types';
import { Wallet, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const LIMIT = 10;

export default function AdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>(WithdrawalStatus.PENDING);
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ withdrawal: AdminWithdrawal; reason: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: withdrawalsData, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter, page],
    queryFn: () =>
      adminService.getWithdrawals(
        page,
        LIMIT,
        statusFilter === 'all' ? undefined : statusFilter
      ),
  });

  const approveMutation = useMutation({
    mutationFn: adminService.approveWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      toast.success('Withdrawal approved. Amount will be credited to the bank account.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminService.rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setRejectModal(null);
      toast.success('Withdrawal request rejected.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const withdrawals = withdrawalsData?.data ?? [];
  const totalPages = withdrawalsData?.totalPages ?? 0;
  const total = withdrawalsData?.total ?? 0;

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case WithdrawalStatus.PROCESSING:
        return (
          <Badge variant="info" className="flex items-center gap-1 w-fit">
            <RefreshCw className="h-3 w-3" />
            Processing
          </Badge>
        );
      case WithdrawalStatus.COMPLETED:
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case WithdrawalStatus.REJECTED:
      case WithdrawalStatus.FAILED:
        return (
          <Badge variant="error" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatAmount = (amountPaise: number) =>
    `₹${(amountPaise / 100).toLocaleString('en-IN')}`;

  const getTransferDetails = (w: AdminWithdrawal) => {
    if (w.method === 'bank_transfer' && w.bankDetails) {
      return `${w.bankDetails.accountHolderName} • ${w.bankDetails.bankName} • ****${(w.bankDetails.accountNumber || '').slice(-4)}`;
    }
    if (w.upiId) return `UPI: ${w.upiId}`;
    return '—';
  };

  const userName = (w: AdminWithdrawal) => {
    const u = w.userId;
    if (typeof u === 'object' && u) {
      return `${(u as { firstName?: string }).firstName ?? ''} ${(u as { lastName?: string }).lastName ?? ''}`.trim() || ((u as { email?: string }).email ?? w._id);
    }
    return w._id;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Withdrawal Requests
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Approve or reject interviewer withdrawal requests. Once approved, the amount is credited to their bank account.
          </p>
        </div>

        {/* Status filter */}
        <Card>
          <CardContent className="p-4">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as WithdrawalStatus | 'all');
                setPage(1);
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
            >
              <option value="pending">Pending (awaiting approval)</option>
              <option value="all">All</option>
              <option value={WithdrawalStatus.PROCESSING}>Processing</option>
              <option value={WithdrawalStatus.COMPLETED}>Completed</option>
              <option value={WithdrawalStatus.REJECTED}>Rejected</option>
              <option value={WithdrawalStatus.FAILED}>Failed</option>
            </select>
          </CardContent>
        </Card>

        {/* Withdrawals table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : withdrawals.length === 0 ? (
              <p className="text-center py-8 text-slate-500 dark:text-slate-400">
                No withdrawals found.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold">Interviewer</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Bank / UPI</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr
                          key={w._id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-50">
                                {userName(w)}
                              </p>
                              {typeof w.userId === 'object' && w.userId && 'email' in w.userId && (
                                <p className="text-xs text-slate-500">{w.userId.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {formatAmount(w.amount)}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            {w.method.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                            {getTransferDetails(w)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(w.status)}
                            {w.failureReason && (
                              <p className="text-xs text-slate-500 mt-1 max-w-[160px]" title={w.failureReason}>
                                {w.failureReason}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(w.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {w.status === WithdrawalStatus.PENDING && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => approveMutation.mutate(w._id)}
                                  disabled={approveMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRejectModal({ withdrawal: w, reason: '' })}
                                  disabled={rejectMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Total: {total} withdrawal{total !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Reject Withdrawal
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {formatAmount(rejectModal.withdrawal.amount)} – {userName(rejectModal.withdrawal)}
            </p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((m) => (m ? { ...m, reason: e.target.value } : null))
              }
              placeholder="e.g. Invalid bank details"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 mb-4 min-h-[80px]"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  rejectMutation.mutate({
                    id: rejectModal.withdrawal._id,
                    reason: rejectModal.reason || undefined,
                  })
                }
                disabled={rejectMutation.isPending}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
