import React, { useState, Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems, Transition, TransitionChild } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
  UserIcon,
  CalendarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { UserRole } from '@/types';
import Avatar from '@/components/ui/Avatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const { data: unreadCount } = useUnreadCount();

  const getNavigationItems = () => {
    const common = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon, badge: unreadCount },
      { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
    ];

    switch (user?.role) {
      case UserRole.JOB_SEEKER:
        return [
          ...common.slice(0, 1),
          { name: 'My Profile', href: '/dashboard/profile', icon: UserIcon },
          // { name: 'Browse Jobs', href: '/jobs', icon: BriefcaseIcon },
          // { name: 'My Applications', href: '/dashboard/applications', icon: BriefcaseIcon },
          { name: 'Mock Interviews', href: '/dashboard/interviews', icon: CalendarIcon },
          { name: 'Schedule Interview', href: '/dashboard/interviews/schedule', icon: CalendarIcon },
          ...common.slice(1),
        ];
      case UserRole.EMPLOYER:
        return [
          ...common.slice(0, 1),
          { name: 'Company Profile', href: '/dashboard/company', icon: BuildingOfficeIcon },
          { name: 'My Jobs', href: '/dashboard/my-jobs', icon: BriefcaseIcon },
          { name: 'Candidates', href: '/dashboard/candidates', icon: UsersIcon },
          ...common.slice(1),
        ];
      case UserRole.INTERVIEWER:
        return [
          ...common.slice(0, 1),
          { name: 'My Profile', href: '/dashboard/interviewer-profile', icon: UserIcon },
          { name: 'Interview Requests', href: '/dashboard/interview-requests', icon: BriefcaseIcon },
          { name: 'My Interviews', href: '/dashboard/interviews', icon: CalendarIcon },
          { name: 'Earnings', href: '/dashboard/earnings', icon: ChartBarIcon },
          ...common.slice(1),
        ];
      default:
        return common;
    }
  };

  const navigation = getNavigationItems();

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </TransitionChild>

          <div className="fixed inset-0 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
                <TransitionChild
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </TransitionChild>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <Link to="/" className="text-2xl font-bold gradient-text">
                      Mockomi
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={clsx(
                                  isActive(item.href)
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                )}
                              >
                                <item.icon className="h-6 w-6 shrink-0" />
                                {item.name}
                                {item.badge ? (
                                  <span className="ml-auto w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs rounded-full">
                                    {item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/" className="text-2xl font-bold gradient-text">
              Mockomi
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={clsx(
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                        {item.badge ? (
                          <span className="ml-auto w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs rounded-full">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navbar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                onClick={() => navigate('/dashboard/notifications')}
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount ? (
                  <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="-m-1.5 flex items-center p-1.5">
                  <Avatar
                    src={user?.avatar}
                    name={`${user?.firstName} ${user?.lastName}`}
                    size="sm"
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </span>
                </MenuButton>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          to="/dashboard/settings"
                          className={clsx(
                            focus ? 'bg-gray-50' : '',
                            'flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
                          Settings
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className={clsx(
                            focus ? 'bg-gray-50' : '',
                            'flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700 w-full'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400" />
                          {isLoggingOut ? 'Logging out...' : 'Log out'}
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
