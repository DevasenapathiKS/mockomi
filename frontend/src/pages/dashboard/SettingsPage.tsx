import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Modal } from '@/components/ui';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { authService } from '@/services/authService';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Fetch linked providers
  useEffect(() => {
    const fetchLinkedProviders = async () => {
      setIsLoadingProviders(true);
      try {
        const providers = await authService.getLinkedProviders();
        setLinkedProviders(providers);
      } catch (error) {
        console.error('Failed to fetch linked providers:', error);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    if (activeTab === 'security') {
      fetchLinkedProviders();
    }
  }, [activeTab]);

  const handleUnlinkProvider = async (provider: string) => {
    if (linkedProviders.length <= 1) {
      toast.error('You must have at least one authentication method');
      return;
    }

    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    setIsUnlinking(provider);
    try {
      await authService.unlinkProvider(provider);
      setLinkedProviders(linkedProviders.filter(p => p !== provider));
      toast.success(`${provider} account unlinked successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlink provider';
      toast.error(errorMessage);
    } finally {
      setIsUnlinking(null);
    }
  };

  const handleLinkProvider = async () => {
    try {
      const providers = await authService.getLinkedProviders();
      setLinkedProviders(providers);
      toast.success('Account linked successfully');
    } catch (error) {
      console.error('Failed to refresh providers:', error);
    }
  };

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

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <LinkIcon className="h-5 w-5 inline mr-2" />
                    Linked Accounts
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Link your social accounts to sign in with multiple providers.
                  </p>

                  {isLoadingProviders ? (
                    <div className="flex items-center justify-center py-8">
                      <svg
                        className="animate-spin h-8 w-8 text-primary-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Google Account */}
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">Google</p>
                            <p className="text-sm text-gray-500">
                              {linkedProviders.includes('google') ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {linkedProviders.includes('google') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkProvider('google')}
                            disabled={isUnlinking === 'google' || linkedProviders.length <= 1}
                          >
                            {isUnlinking === 'google' ? 'Unlinking...' : 'Unlink'}
                          </Button>
                        ) : (
                          <div className="w-32">
                            <SocialLoginButton
                              provider="google"
                              isLinking={true}
                              onSuccess={handleLinkProvider}
                              onError={(error) => toast.error(error)}
                              className="!py-1 !px-3 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* GitHub Account */}
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              fillRule="evenodd"
                              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">GitHub</p>
                            <p className="text-sm text-gray-500">
                              {linkedProviders.includes('github') ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {linkedProviders.includes('github') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkProvider('github')}
                            disabled={isUnlinking === 'github' || linkedProviders.length <= 1}
                          >
                            {isUnlinking === 'github' ? 'Unlinking...' : 'Unlink'}
                          </Button>
                        ) : (
                          <div className="w-32">
                            <SocialLoginButton
                              provider="github"
                              isLinking={true}
                              onSuccess={handleLinkProvider}
                              onError={(error) => toast.error(error)}
                              className="!py-1 !px-3 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* LinkedIn Account */}
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">LinkedIn</p>
                            <p className="text-sm text-gray-500">
                              {linkedProviders.includes('linkedin') ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {linkedProviders.includes('linkedin') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkProvider('linkedin')}
                            disabled={isUnlinking === 'linkedin' || linkedProviders.length <= 1}
                          >
                            {isUnlinking === 'linkedin' ? 'Unlinking...' : 'Unlink'}
                          </Button>
                        ) : (
                          <div className="w-32">
                            <SocialLoginButton
                              provider="linkedin"
                              isLinking={true}
                              onSuccess={handleLinkProvider}
                              onError={(error) => toast.error(error)}
                              className="!py-1 !px-3 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {linkedProviders.length > 1 && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <svg
                            className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm text-blue-700">
                            You can sign in with any of your linked accounts. You must keep at least one authentication method.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
