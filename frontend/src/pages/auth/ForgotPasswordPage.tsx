import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [resetUrl, setResetUrl] = useState<string>('');
  const [devMode, setDevMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError('');
      const response: any = await authService.forgotPassword(data.email);
      setIsSuccess(true);
      
      // Check if we got a development mode response
      if (response?.devMode && response?.resetUrl) {
        setDevMode(true);
        setResetUrl(response.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block">
              <span className="text-3xl font-bold gradient-text">Mockomi</span>
            </Link>
          </div>

          <Card className="mt-8">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                {devMode ? 'Development Mode' : 'Check your email'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {devMode 
                  ? 'Email service is not configured. Use the link below to reset your password:'
                  : 'If an account exists with that email address, we\'ve sent you a password reset link.'
                }
              </p>
              
              {devMode && resetUrl && (
                <div className="mt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs text-yellow-800 mb-2 font-semibold">
                      ⚠️ DEVELOPMENT MODE ONLY
                    </p>
                    <Link 
                      to={resetUrl.replace(window.location.origin, '')}
                      className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Reset Password Now
                    </Link>
                    <p className="text-xs text-gray-600 mt-3">
                      Or copy this URL:
                    </p>
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                      <code className="text-xs text-gray-800 break-all">{resetUrl}</code>
                    </div>
                  </div>
                </div>
              )}
              
              {!devMode && (
                <p className="mt-4 text-xs text-gray-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              )}
              
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="outline" fullWidth>
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold gradient-text">Mockomi</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <Card className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" fullWidth isLoading={isSubmitting} size="lg">
              Send reset link
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
