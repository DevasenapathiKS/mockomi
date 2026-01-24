import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { authService } from './services/authService';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminInterviewersPage from './pages/AdminInterviewersPage';
import AdminJobsPage from './pages/AdminJobsPage';
import AdminInterviewsPage from './pages/AdminInterviewsPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminCouponsPage from './pages/AdminCouponsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, accessToken, user, setUser, initialized } = useAuthStore();
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Only initialize once
    if (!hasInitialized.current && !initialized) {
      hasInitialized.current = true;
      initialize();
    }
  }, [initialize, initialized]);

  useEffect(() => {
    // If we have a token but no user after initialization, fetch the current user
    if (initialized && accessToken && !user) {
      authService
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // If fetching user fails, tokens might be invalid
          // The API interceptor will handle logout
        });
    }
  }, [initialized, accessToken, user, setUser]);

  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, initialized } = useAuthStore();

  // Wait for initialization before checking auth
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <AdminUsersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/interviewers"
            element={
              <PrivateRoute>
                <AdminInterviewersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <PrivateRoute>
                <AdminJobsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <PrivateRoute>
                <AdminInterviewsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <AdminPaymentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/coupons"
            element={
              <PrivateRoute>
                <AdminCouponsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <AdminSettingsPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
