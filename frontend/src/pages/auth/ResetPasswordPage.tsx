import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
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
              <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
              <p className="mt-2 text-sm text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <div className="mt-6">
                <Link to="/forgot-password">
                  <Button fullWidth>Request a new link</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError('');
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
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
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Password Reset Successful</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button fullWidth>Go to login</Button>
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
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
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
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              }
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="text-xs text-gray-500">
              <p>Password must:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Be at least 8 characters long</li>
                <li>Contain at least one uppercase letter</li>
                <li>Contain at least one lowercase letter</li>
                <li>Contain at least one number</li>
              </ul>
            </div>

            <Button type="submit" fullWidth isLoading={isSubmitting} size="lg">
              Reset password
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Back to login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
