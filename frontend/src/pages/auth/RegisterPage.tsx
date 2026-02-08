import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { clsx } from 'clsx';
// import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
// import { toast } from 'react-hot-toast';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    role: z.enum(['job_seeker', 'employer', 'interviewer']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type UserRoleOption = {
  value: 'job_seeker' | 'employer' | 'interviewer';
  label: string;
  description: string;
  icon: string;
};

const roleOptions: UserRoleOption[] = [
  {
    value: 'job_seeker',
    label: 'Job Seeker',
    description: 'Find jobs and practice interviews',
    icon: '🎯',
  },
  // {
  //   value: 'employer',
  //   label: 'Employer',
  //   description: 'Post jobs and find candidates',
  //   icon: '🏢',
  // },
  {
    value: 'interviewer',
    label: 'Interviewer',
    description: 'Conduct mock interviews and earn',
    icon: '🎤',
  },
];

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isRegistering } = useAuth();
  const { isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'job_seeker',
    },
  });

  const selectedRole = watch('role');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold gradient-text">Mockomi</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <Card className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to join as
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('role', option.value)}
                    className={clsx(
                      'relative flex flex-col items-center rounded-lg border-2 p-4 cursor-pointer transition-all',
                      selectedRole === option.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="text-2xl mb-2">{option.icon}</span>
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        selectedRole === option.value ? 'text-primary-600' : 'text-gray-900'
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500 text-center mt-1">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder="John"
                leftIcon={<UserIcon className="h-5 w-5" />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              error={errors.email?.message}
              helperText={
                selectedRole === 'employer'
                  ? 'Please use your company email (not gmail, yahoo, etc.)'
                  : undefined
              }
              {...register('email')}
            />

            <Input
              label="Phone number"
              type="tel"
              placeholder="+91 98765 43210"
              leftIcon={<PhoneIcon className="h-5 w-5" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password"
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
              label="Confirm password"
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

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" fullWidth isLoading={isRegistering} size="lg">
              Create account
            </Button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                </div>
              </div>

              {/* <div className="mt-6 space-y-3">
                <SocialLoginButton
                  provider="google"
                  onSuccess={() => {
                    toast.success('Successfully signed up with Google');
                  }}
                  onError={(error) => {
                    toast.error(error);
                  }}
                />
                <SocialLoginButton
                  provider="github"
                  onSuccess={() => {
                    toast.success('Successfully signed up with GitHub');
                  }}
                  onError={(error) => {
                    toast.error(error);
                  }}
                />
                <SocialLoginButton
                  provider="linkedin"
                  onSuccess={() => {
                    toast.success('Successfully signed up with LinkedIn');
                  }}
                  onError={(error) => {
                    toast.error(error);
                  }}
                />
              </div> */}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
