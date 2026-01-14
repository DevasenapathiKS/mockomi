import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Modal } from '@/components/ui';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onChangePassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePassword(data);
    resetPassword();
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg
                    ${activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <p className="mt-1 text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <p className="mt-1 text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <p className="mt-1 text-gray-900 capitalize">
                        {user?.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Member Since
                      </label>
                      <p className="mt-1 text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <h3 className="text-lg font-semibold text-red-700 mb-4">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-100"
                    onClick={() => setDeleteAccountModal(true)}
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <KeyIcon className="h-5 w-5 inline mr-2" />
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                    <Input
                      type="password"
                      label="Current Password"
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required',
                      })}
                      error={passwordErrors.currentPassword?.message}
                    />
                    <Input
                      type="password"
                      label="New Password"
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      })}
                      error={passwordErrors.newPassword?.message}
                    />
                    <Input
                      type="password"
                      label="Confirm New Password"
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your password',
                      })}
                      error={passwordErrors.confirmPassword?.message}
                    />
                    <Button type="submit">
                      Update Password
                    </Button>
                  </form>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline" disabled>
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Enable 2FA (Coming Soon)
                  </Button>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { id: 'applications', label: 'Application Updates', description: 'Get notified when your application status changes' },
                      { id: 'interviews', label: 'Interview Reminders', description: 'Receive reminders before scheduled interviews' },
                      { id: 'jobs', label: 'New Job Matches', description: 'Get notified when new jobs match your profile' },
                      { id: 'marketing', label: 'Marketing Emails', description: 'Receive tips and updates from Mockomi' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { id: 'browser', label: 'Browser Notifications', description: 'Receive real-time notifications in your browser' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Delete Account Modal */}
        <Modal
          isOpen={deleteAccountModal}
          onClose={() => setDeleteAccountModal(false)}
          title="Delete Account"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-center text-gray-600">
              Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setDeleteAccountModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  toast.error('Account deletion is not implemented yet');
                  setDeleteAccountModal(false);
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
