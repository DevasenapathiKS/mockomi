import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PaymentStatus } from '@/types';
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: adminService.getPaymentStats,
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter, page],
    queryFn: () => adminService.getAllPayments(statusFilter === 'all' ? undefined : statusFilter, page, 10),
  });

  const refundMutation = useMutation({
    mutationFn: adminService.initiateRefund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
      toast.success('Refund initiated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payment Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and manage all payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                    ₹{stats?.totalRevenue.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                    {stats?.completedPayments || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                    {stats?.pendingPayments || 0}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Refunded</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                    {stats?.refundedPayments || 0}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PaymentStatus | 'all');
                setPage(1);
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
            >
              <option value="all">All Status</option>
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.COMPLETED}>Completed</option>
              <option value={PaymentStatus.FAILED}>Failed</option>
              <option value={PaymentStatus.REFUNDED}>Refunded</option>
            </select>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold">User</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments?.data.map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-50">
                                {payment.user
                                  ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || 'N/A'
                                  : 'Unknown User'}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {payment.user?.email || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 dark:text-slate-50">
                              ₹{payment.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                payment.status === PaymentStatus.COMPLETED
                                  ? 'success'
                                  : payment.status === PaymentStatus.PENDING
                                  ? 'warning'
                                  : payment.status === PaymentStatus.REFUNDED
                                  ? 'info'
                                  : 'error'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end">
                              {payment.status === PaymentStatus.COMPLETED && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to refund this payment?')) {
                                      refundMutation.mutate(payment._id);
                                    }
                                  }}
                                  isLoading={refundMutation.isPending}
                                >
                                  Refund
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {payments && payments.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, payments.total)} of{' '}
                      {payments.total} transactions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(payments.totalPages, p + 1))}
                        disabled={page === payments.totalPages}
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
    </DashboardLayout>
  );
}
