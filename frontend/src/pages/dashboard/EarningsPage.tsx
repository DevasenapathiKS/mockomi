import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CurrencyRupeeIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Spinner, Badge, Modal, Input } from '@/components/ui';
import { interviewService, profileService, withdrawalService } from '@/services';
import { BankDetails, WithdrawalMethod, WithdrawalStatus, Withdrawal } from '@/types';

interface Earning {
  id: string;
  interviewId: string;
  candidateName: string;
  date: string;
  duration: number;
  amount: number;
  status: 'pending' | 'paid' | 'processing';
  type: string;
}

const EarningsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals'>('earnings');
  
  // Bank details modal
  const [bankModal, setBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
  });

  // Withdraw modal
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod>(WithdrawalMethod.BANK_TRANSFER);

  const { data, isLoading } = useQuery({
    queryKey: ['interviewer-earnings', period],
    queryFn: () => interviewService.getInterviewerEarnings({ period }),
  });

  // Fetch current profile to get existing bank details
  const { data: profile } = useQuery({
    queryKey: ['interviewer-profile'],
    queryFn: () => profileService.getInterviewerProfile(),
  });

  // Fetch withdrawal stats
  const { data: withdrawalStats } = useQuery({
    queryKey: ['withdrawal-stats'],
    queryFn: () => withdrawalService.getWithdrawalStats(),
  });

  // Fetch withdrawal history
  const { data: withdrawalsData } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => withdrawalService.getMyWithdrawals(1, 20),
  });

  // Update bank details form when profile loads
  useEffect(() => {
    if (profile?.bankDetails) {
      setBankDetails({
        accountHolderName: profile.bankDetails.accountHolderName || '',
        accountNumber: profile.bankDetails.accountNumber || '',
        ifscCode: profile.bankDetails.ifscCode || '',
        bankName: profile.bankDetails.bankName || '',
        branchName: profile.bankDetails.branchName || '',
        upiId: profile.bankDetails.upiId || '',
      });
    }
  }, [profile]);

  const updateBankDetailsMutation = useMutation({
    mutationFn: (data: { bankDetails: BankDetails }) =>
      profileService.updateInterviewerProfile(data),
    onSuccess: () => {
      toast.success('Bank details updated successfully!');
      setBankModal(false);
      queryClient.invalidateQueries({ queryKey: ['interviewer-profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bank details');
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: () => {
      const amountInPaise = Math.round(parseFloat(withdrawAmount) * 100);
      
      if (withdrawMethod === WithdrawalMethod.BANK_TRANSFER) {
        return withdrawalService.createWithdrawal({
          amount: amountInPaise,
          method: withdrawMethod,
          bankDetails: {
            accountHolderName: profile?.bankDetails?.accountHolderName || '',
            accountNumber: profile?.bankDetails?.accountNumber || '',
            ifscCode: profile?.bankDetails?.ifscCode || '',
            bankName: profile?.bankDetails?.bankName || '',
          },
        });
      } else {
        return withdrawalService.createWithdrawal({
          amount: amountInPaise,
          method: withdrawMethod,
          upiId: profile?.bankDetails?.upiId || '',
        });
      }
    },
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully!');
      setWithdrawModal(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['withdrawal-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['interviewer-profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create withdrawal request');
    },
  });

  const earnings = data?.earnings || [];
  const stats = data?.stats || {
    totalEarnings: 0,
    pendingAmount: 0,
    paidAmount: 0,
    totalInterviews: 0,
  };

  const withdrawals = withdrawalsData?.data || [];
  const availableBalance = withdrawalStats?.availableBalance || 0;

  const filteredEarnings = statusFilter === 'all' 
    ? earnings 
    : earnings.filter((e: Earning) => e.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'processing':
        return <Badge variant="info">Processing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWithdrawalStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case WithdrawalStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case WithdrawalStatus.PROCESSING:
        return <Badge variant="info">Processing</Badge>;
      case WithdrawalStatus.FAILED:
        return <Badge variant="danger">Failed</Badge>;
      case WithdrawalStatus.REVERSED:
        return <Badge variant="gray">Reversed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const canWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 1) return false;
    if (amount > availableBalance) return false;
    
    if (withdrawMethod === WithdrawalMethod.BANK_TRANSFER) {
      return !!(profile?.bankDetails?.accountNumber && profile?.bankDetails?.ifscCode);
    } else {
      return !!profile?.bankDetails?.upiId;
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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600 mt-1">
              Track your interview earnings and payouts
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setWithdrawModal(true)}
              disabled={availableBalance < 1}
            >
              <ArrowUpRightIcon className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
            <Button variant="outline">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Available Balance</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{availableBalance?.toLocaleString()}
                  </p>
                </div>
                <CurrencyRupeeIcon className="h-12 w-12 text-green-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending Withdrawal</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{withdrawalStats?.pendingAmount?.toLocaleString() || 0}
                  </p>
                </div>
                <ClockIcon className="h-12 w-12 text-yellow-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Withdrawn</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{withdrawalStats?.totalWithdrawn?.toLocaleString() || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-blue-200" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Interviews</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.totalInterviews}
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-12 w-12 text-purple-200" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'earnings'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Earnings History
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'withdrawals'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {activeTab === 'earnings' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Period
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Time</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_year">This Year</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Earnings Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interview Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEarnings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <BanknotesIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No earnings found</p>
                          <p className="text-sm">
                            Complete interviews to start earning
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredEarnings.map((earning: Earning, index: number) => (
                        <motion.tr
                          key={earning.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">
                                {earning.candidateName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {earning.type} Interview
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-600">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {new Date(earning.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-2" />
                              {earning.duration} mins
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-green-600">
                              ₹{earning.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(earning.status)}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'withdrawals' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <ArrowUpRightIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium">No withdrawals yet</p>
                        <p className="text-sm">
                          Make your first withdrawal when you have earnings
                        </p>
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((withdrawal: Withdrawal, index: number) => (
                      <motion.tr
                        key={withdrawal._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-green-600">
                            ₹{(withdrawal.amount / 100).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-600">
                            {withdrawal.method === WithdrawalMethod.BANK_TRANSFER
                              ? 'Bank Transfer'
                              : 'UPI'}
                          </span>
                          {withdrawal.method === WithdrawalMethod.BANK_TRANSFER && withdrawal.bankDetails && (
                            <p className="text-xs text-gray-400">
                              {withdrawal.bankDetails.bankName} - {withdrawal.bankDetails.accountNumber}
                            </p>
                          )}
                          {withdrawal.method === WithdrawalMethod.UPI && withdrawal.upiId && (
                            <p className="text-xs text-gray-400">{withdrawal.upiId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {getWithdrawalStatusBadge(withdrawal.status)}
                            {withdrawal.failureReason && (
                              <p className="text-xs text-red-500 mt-1">{withdrawal.failureReason}</p>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Payout Info */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Payout Information</h3>
              <p className="text-sm text-blue-700 mt-1">
                Withdraw your earnings anytime to your bank account or UPI. Minimum withdrawal amount is ₹1 (for testing).
              </p>

              {/* Show current bank details if available */}
              {profile?.bankDetails?.accountNumber ? (
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current Bank Account</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Account Holder:</span>
                      <span className="ml-2 font-medium text-gray-900">{profile.bankDetails.accountHolderName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Account No:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        ****{profile.bankDetails.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Bank:</span>
                      <span className="ml-2 font-medium text-gray-900">{profile.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">IFSC:</span>
                      <span className="ml-2 font-medium text-gray-900">{profile.bankDetails.ifscCode}</span>
                    </div>
                    {profile.bankDetails.upiId && (
                      <div className="col-span-2">
                        <span className="text-gray-500">UPI ID:</span>
                        <span className="ml-2 font-medium text-gray-900">{profile.bankDetails.upiId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No bank details added yet. Please add your bank account to receive payouts.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-blue-300"
                onClick={() => setBankModal(true)}
              >
                {profile?.bankDetails?.accountNumber ? 'Update Bank Details' : 'Add Bank Details'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Bank Details Modal */}
        <Modal
          isOpen={bankModal}
          onClose={() => setBankModal(false)}
          title="Update Bank Details"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Please provide your bank account details for receiving payouts. Ensure all information is accurate.
            </p>

            <Input
              label="Account Holder Name"
              placeholder="Enter name as per bank account"
              value={bankDetails.accountHolderName}
              onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
              required
            />

            <Input
              label="Account Number"
              placeholder="Enter your bank account number"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="IFSC Code"
                placeholder="e.g., SBIN0001234"
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                required
              />

              <Input
                label="Bank Name"
                placeholder="Enter bank name"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Branch Name (Optional)"
              placeholder="Enter branch name"
              value={bankDetails.branchName || ''}
              onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
            />

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Alternative Payment Method</p>
              <Input
                label="UPI ID (Optional)"
                placeholder="e.g., yourname@upi"
                value={bankDetails.upiId || ''}
                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setBankModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateBankDetailsMutation.mutate({ bankDetails })}
                isLoading={updateBankDetailsMutation.isPending}
                disabled={!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName}
              >
                Save Bank Details
              </Button>
            </div>
          </div>
        </Modal>

        {/* Withdraw Modal */}
        <Modal
          isOpen={withdrawModal}
          onClose={() => setWithdrawModal(false)}
          title="Withdraw Earnings"
          size="md"
        >
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">Available Balance</p>
              <p className="text-3xl font-bold text-green-800">₹{availableBalance.toLocaleString()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="Enter amount (min ₹1)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={availableBalance}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: ₹1 (for testing) | Maximum: ₹{availableBalance.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                  withdrawMethod === WithdrawalMethod.BANK_TRANSFER
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="withdrawMethod"
                    value={WithdrawalMethod.BANK_TRANSFER}
                    checked={withdrawMethod === WithdrawalMethod.BANK_TRANSFER}
                    onChange={() => setWithdrawMethod(WithdrawalMethod.BANK_TRANSFER)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <BanknotesIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="font-medium">Bank Transfer</p>
                    {profile?.bankDetails?.accountNumber ? (
                      <p className="text-xs text-gray-500 mt-1">
                        ****{profile.bankDetails.accountNumber.slice(-4)}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">Not configured</p>
                    )}
                  </div>
                </label>

                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                  withdrawMethod === WithdrawalMethod.UPI
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="withdrawMethod"
                    value={WithdrawalMethod.UPI}
                    checked={withdrawMethod === WithdrawalMethod.UPI}
                    onChange={() => setWithdrawMethod(WithdrawalMethod.UPI)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <CurrencyRupeeIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="font-medium">UPI</p>
                    {profile?.bankDetails?.upiId ? (
                      <p className="text-xs text-gray-500 mt-1">{profile.bankDetails.upiId}</p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">Not configured</p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {!profile?.bankDetails?.accountNumber && !profile?.bankDetails?.upiId && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please add your bank details or UPI ID before making a withdrawal.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setWithdrawModal(false);
                    setBankModal(true);
                  }}
                >
                  Add Bank Details
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setWithdrawModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createWithdrawalMutation.mutate()}
                isLoading={createWithdrawalMutation.isPending}
                disabled={!canWithdraw()}
              >
                Withdraw ₹{withdrawAmount || '0'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default EarningsPage;
