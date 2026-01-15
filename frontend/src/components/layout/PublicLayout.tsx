import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
// import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // const navigation = [
  //   { name: 'Home', href: '/' },
  //   { name: 'Jobs', href: '/jobs' },
  //   { name: 'For Employers', href: '/employers' },
  //   { name: 'For Interviewers', href: '/interviewers' },
  //   { name: 'About', href: '/about' },
  // ];

  // const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <nav className="container-custom flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold gradient-text">Mockomi</span>
          </Link>

          {/* Desktop navigation */}
          {/* <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div> */}

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>
                {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden -m-2.5 p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </nav>

        {/* Mobile menu */}
        <Transition show={mobileMenuOpen} as={Fragment}>
          <Dialog as="div" className="md:hidden" onClose={setMobileMenuOpen}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 z-50 bg-black/30" />
            </TransitionChild>

            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white px-6 py-6">
                <div className="flex items-center justify-between">
                  <Link
                    to="/"
                    className="text-2xl font-bold gradient-text"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mockomi
                  </Link>
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-6 flow-root">
                  <div className="-my-6 divide-y divide-gray-200">
                    {/* <div className="space-y-2 py-6">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={clsx(
                            '-mx-3 block rounded-lg px-3 py-2 text-base font-semibold',
                            isActive(item.href)
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-900 hover:bg-gray-50'
                          )}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div> */}
                    <div className="py-6 space-y-3">
                      {isAuthenticated ? (
                        <Button
                          fullWidth
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate('/dashboard');
                          }}
                        >
                          Dashboard
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            fullWidth
                            onClick={() => {
                              setMobileMenuOpen(false);
                              navigate('/login');
                            }}
                          >
                            Log in
                          </Button>
                          <Button
                            fullWidth
                            onClick={() => {
                              setMobileMenuOpen(false);
                              navigate('/register');
                            }}
                          >
                            Get Started
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </Dialog>
        </Transition>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="container-custom py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-bold text-white">Mockomi</span>
              <p className="mt-4 text-sm">
                Your gateway to career success. Practice interviews, find jobs, and land your dream role.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">For Job Seekers</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                <li><Link to="/interviews" className="hover:text-white">Mock Interviews</Link></li>
                <li><Link to="/resources" className="hover:text-white">Career Resources</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">For Employers</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/employers" className="hover:text-white">Post a Job</Link></li>
                <li><Link to="/employers" className="hover:text-white">Search Candidates</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-center">
            © {new Date().getFullYear()} Mockomi. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
