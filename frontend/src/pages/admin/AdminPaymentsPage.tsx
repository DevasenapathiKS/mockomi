import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Spinner, Badge } from '@/components/ui';
import api from '@/services/api';

interface Payment {
  _id: string;
  orderId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'interview' | 'subscription' | 'other';
  createdAt: string;
  razorpayPaymentId?: string;
}

const AdminPaymentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', { search, statusFilter, typeFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/admin/payments?${params.toString()}`);
      return response.data;
    },
  });

  const payments = data?.payments || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };
  const stats = data?.stats || {
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      case 'refunded':
        return <Badge variant="gray">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              {pagination.total} total transactions
            </p>
          </div>
          <Button variant="outline">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">
                ₹{stats.totalRevenue.toLocaleString()}
              </p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedPayments}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <ClockIcon className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingPayments}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center gap-3">
                <XCircleIcon className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.failedPayments}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by order ID or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="interview">Interview</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
        </Card>

        {/* Payments Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <CurrencyRupeeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No payments found</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: Payment, index: number) => (
                    <motion.tr
                      key={payment._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-mono text-sm text-gray-900">
                          {payment.orderId}
                        </p>
                        {payment.razorpayPaymentId && (
                          <p className="font-mono text-xs text-gray-500">
                            {payment.razorpayPaymentId}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900">
                          {payment.user.firstName} {payment.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.user.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="gray" className="capitalize">
                          {payment.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-gray-900">
                          {payment.currency === 'INR' ? '₹' : '$'}
                          {payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </p>
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
      </div>
    </DashboardLayout>
  );
};

export default AdminPaymentsPage;
