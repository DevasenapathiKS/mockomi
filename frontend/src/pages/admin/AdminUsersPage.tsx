import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  UserIcon,
  EyeIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Spinner, Badge, Avatar, Modal } from '@/components/ui';
import api from '@/services/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModal, setActionModal] = useState<'view' | 'ban' | 'delete' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, roleFilter, statusFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
      setActionModal(null);
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
      setActionModal(null);
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  const users = data?.users || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700">Admin</Badge>;
      case 'employer':
        return <Badge className="bg-blue-100 text-blue-700">Employer</Badge>;
      case 'interviewer':
        return <Badge className="bg-purple-100 text-purple-700">Interviewer</Badge>;
      case 'job_seeker':
        return <Badge className="bg-green-100 text-green-700">Job Seeker</Badge>;
      default:
        return <Badge>{role}</Badge>;
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} total users
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="job_seeker">Job Seekers</option>
              <option value="employer">Employers</option>
              <option value="interviewer">Interviewers</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user: User, index: number) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            size="sm"
                          />
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="danger">Banned</Badge>
                          )}
                          {user.isVerified && (
                            <CheckCircleIcon className="h-4 w-4 text-blue-500" title="Verified" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionModal('view');
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionModal('ban');
                            }}
                            className={user.isActive ? 'text-orange-600' : 'text-green-600'}
                          >
                            {user.isActive ? (
                              <NoSymbolIcon className="h-4 w-4" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionModal('delete');
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
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

        {/* View User Modal */}
        <Modal
          isOpen={actionModal === 'view' && !!selectedUser}
          onClose={() => setActionModal(null)}
          title="User Details"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={selectedUser.avatar}
                  alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  size="lg"
                />
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-gray-900 capitalize">{selectedUser.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-gray-900">{selectedUser.isActive ? 'Active' : 'Banned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Verified</p>
                  <p className="text-gray-900">{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Ban/Unban Modal */}
        <Modal
          isOpen={actionModal === 'ban' && !!selectedUser}
          onClose={() => setActionModal(null)}
          title={selectedUser?.isActive ? 'Ban User' : 'Unban User'}
          size="sm"
        >
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-gray-600">
                {selectedUser.isActive
                  ? `Are you sure you want to ban ${selectedUser.firstName} ${selectedUser.lastName}? They will not be able to access their account.`
                  : `Are you sure you want to unban ${selectedUser.firstName} ${selectedUser.lastName}?`}
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button
                  className={selectedUser.isActive ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  onClick={() => toggleStatusMutation.mutate({
                    userId: selectedUser._id,
                    isActive: !selectedUser.isActive,
                  })}
                  isLoading={toggleStatusMutation.isPending}
                >
                  {selectedUser.isActive ? 'Ban User' : 'Unban User'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={actionModal === 'delete' && !!selectedUser}
          onClose={() => setActionModal(null)}
          title="Delete User"
          size="sm"
        >
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to permanently delete {selectedUser.firstName} {selectedUser.lastName}'s account?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteUserMutation.mutate(selectedUser._id)}
                  isLoading={deleteUserMutation.isPending}
                >
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
