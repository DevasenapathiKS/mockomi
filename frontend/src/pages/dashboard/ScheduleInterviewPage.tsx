import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { interviewService } from '@/services/interviewService';
import { paymentService } from '@/services/paymentService';
import { DashboardLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

// Available skills/topics for interview
const AVAILABLE_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js',
  'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby',
  'System Design', 'Data Structures', 'Algorithms', 'Database Design',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'DevOps',
  'Machine Learning', 'Data Science', 'AI/ML',
  'Frontend', 'Backend', 'Full Stack', 'Mobile Development',
  'REST API', 'GraphQL', 'Microservices',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
  'Behavioral', 'HR Interview', 'Leadership',
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes (Recommended)' },
  { value: 90, label: '90 minutes' },
];

const ScheduleInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [preferredDuration, setPreferredDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !selectedSkills.includes(skill)
  );

  const paymentEligibilityQuery = useQuery({
    queryKey: ['interview-payment-check'],
    queryFn: () => interviewService.checkPaymentRequirement(),
  });

  const createRequestMutation = useMutation({
    mutationFn: (payload?: { paymentId?: string }) => interviewService.createInterviewRequest({
      requestedSkills: selectedSkills,
      preferredDuration,
      notes: notes || undefined,
      paymentId: payload?.paymentId,
    }),
    onSuccess: () => {
      toast.success('Interview request submitted! You will be notified when an interviewer accepts.');
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['my-interview-requests'] });
      navigate('/dashboard/interviews');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit interview request');
    },
  });

  const loadRazorpayScript = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });

  const startPaymentFlow = async (): Promise<string> => {
    const eligibility = paymentEligibilityQuery.data;
    const amountPaise = Math.max(
      10000,
      Math.round((eligibility?.pricePerInterview ?? 100) * 100)
    );

    const razorpayKey = 'rzp_test_RxlUrYIiGrG6kN';
    if (!razorpayKey) {
      throw new Error('Payment key is not configured. Please contact support.');
    }

    const order = await paymentService.createOrder({
      amount: amountPaise,
      notes: { reason: 'mock_interview_request' },
    });

    await loadRazorpayScript();

    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not available'));
        return;
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Mockomi',
        description: 'Mock interview booking',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            const payment = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve(payment._id);
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          email: user?.email || '',
        },
        notes: order?.paymentId ? { paymentId: order.paymentId } : undefined,
        theme: { color: '#0ea5e9' },
      });

      razorpay.on('payment.failed', (resp: any) => {
        reject(new Error(resp?.error?.description || 'Payment failed'));
      });

      razorpay.open();
    });
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill for your interview');
      return;
    }

    try {
      let paymentId: string | undefined;

      // Always refresh eligibility to avoid stale free-count
      const eligibility = (await paymentEligibilityQuery.refetch()).data;
      if (!eligibility) {
        toast.error('Unable to check payment eligibility. Please try again.');
        return;
      }

      if (eligibility.required) {
        setIsProcessingPayment(true);
        paymentId = await startPaymentFlow();
        toast.success('Payment successful. Creating interview request...');
      }

      await createRequestMutation.mutateAsync({ paymentId });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit interview request');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Request Mock Interview</h1>
          <p className="text-gray-600 mt-1">
            Select the skills you want to be interviewed on. An expert interviewer will pick up your request.
          </p>
        </div>

        {/* How It Works */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">How It Works</h3>
              <ol className="list-decimal list-inside text-blue-700 mt-2 space-y-1">
                <li>Select the skills/topics you want to practice</li>
                <li>Choose your preferred interview duration</li>
                <li>Submit your request</li>
                <li>An expert interviewer matching your skills will claim your request</li>
                <li>You&apos;ll receive a notification with the scheduled time</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Pricing Info */}
        <Card className="mb-8 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">Pricing Information</h3>
              <p className="text-primary-700 mt-1">
                Your first 2 mock interviews are <strong>FREE</strong>! After that, each interview costs just ₹{paymentEligibilityQuery.data?.pricePerInterview ?? 100}.
              </p>
              {paymentEligibilityQuery.data && (
                <p className="text-sm text-primary-700 mt-2">
                  Free interviews left: {paymentEligibilityQuery.data.freeInterviewsRemaining ?? 0}. Payment required: {paymentEligibilityQuery.data.required ? 'Yes' : 'No'}.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Skills Selection */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Interview Topics *
          </h2>
          
          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected ({selectedSkills.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors cursor-pointer"
                    >
                      {skill}
                      <span className="ml-1">×</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Search Skills */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search skills..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Available Skills */}
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {filteredSkills.map((skill, index) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.01 }}
              >
                <button
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {skill}
                </button>
              </motion.div>
            ))}
          </div>

          {filteredSkills.length === 0 && skillSearch && (
            <p className="text-gray-500 text-sm mt-2">
              No skills found matching &quot;{skillSearch}&quot;
            </p>
          )}
        </Card>

        {/* Duration Selection */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Preferred Duration
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferredDuration(option.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferredDuration === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{option.value} min</div>
                {option.value === 60 && (
                  <div className="text-xs text-gray-500">Recommended</div>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Additional Notes */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Notes (Optional)
          </h2>
          <textarea
            placeholder="Any specific areas you want to focus on, your experience level, or other preferences..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <p className="font-semibold text-gray-900">
              {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-gray-600">
              Duration: {preferredDuration} minutes
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            isLoading={createRequestMutation.isPending || isProcessingPayment}
            disabled={
              selectedSkills.length === 0 ||
              isProcessingPayment ||
              paymentEligibilityQuery.isLoading
            }
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Submit Interview Request
          </Button>
        </div>

        {/* Success Info */}
        <div className="mt-6 flex items-center gap-3 text-gray-600">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <p className="text-sm">
            Once submitted, matching interviewers will see your request and can claim it.
            You&apos;ll be notified immediately when scheduled.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScheduleInterviewPage;
