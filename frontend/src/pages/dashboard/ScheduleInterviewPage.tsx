import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  CurrencyRupeeIcon,
  // ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TicketIcon,
  XMarkIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { interviewService } from '@/services/interviewService';
import { paymentService } from '@/services/paymentService';
import { couponService } from '@/services/couponService';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
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

// const DURATION_OPTIONS = [
//   { value: 30, label: '30 minutes' },
//   { value: 45, label: '45 minutes' },
//   { value: 60, label: '60 minutes' },
//   { value: 90, label: '90 minutes' },
// ];

const ScheduleInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const preferredDuration = 30;
  const [notes, setNotes] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    remainingUses: number;
    description: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !selectedSkills.includes(skill)
  );

  const paymentEligibilityQuery = useQuery({
    queryKey: ['interview-payment-check'],
    queryFn: () => interviewService.checkPaymentRequirement(),
  });

  const validateCouponMutation = useMutation({
    mutationFn: (code: string) => couponService.validateCoupon(code),
    onSuccess: (data) => {
      if (data.valid && data.coupon) {
        setAppliedCoupon({
          code: data.coupon.code,
          remainingUses: data.remainingUses,
          description: data.coupon.description,
          discountType: data.coupon.discountType || 'percentage',
          discountValue: data.coupon.discountValue || 0,
        });
        setCouponError(null);
        toast.success(data.message);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message);
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      setAppliedCoupon(null);
      setCouponError(error.message);
      toast.error(error.message);
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (payload?: { paymentId?: string; couponCode?: string }) => {
      // If we have both paymentId and couponCode, we need to handle the discount on backend
      // For now, if payment was made, use paymentId. If coupon makes it free, use couponCode only.
      return interviewService.createInterviewRequest({
        requestedSkills: selectedSkills,
        preferredDuration,
        notes: notes || undefined,
        paymentId: payload?.paymentId,
        couponCode: payload?.couponCode,
      });
    },
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
    const basePrice = eligibility?.pricePerInterview ?? 100;
    
    // Calculate discounted amount if coupon is applied
    let finalAmount = basePrice;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        // Percentage discount: reduce by percentage
        finalAmount = basePrice * (1 - appliedCoupon.discountValue / 100);
      } else {
        // Flat discount: subtract flat amount
        finalAmount = Math.max(0, basePrice - appliedCoupon.discountValue);
      }
    }
    
    const amountPaise = Math.max(
      100, // Minimum 100 rupees in paise
      Math.round(finalAmount * 100)
    );

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      throw new Error('Payment key is not configured. Please contact support.');
    }

    const order = await paymentService.createOrder({
      amount: amountPaise,
      notes: { 
        reason: 'mock_interview_request',
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      },
    });

    await loadRazorpayScript();

    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not available'));
        return;
      }

      // Build description with discount info
      let description = 'Mock interview booking';
      if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
          description = `Mock interview booking - ${appliedCoupon.discountValue}% discount applied (Coupon: ${appliedCoupon.code})`;
        } else {
          description = `Mock interview booking - ₹${appliedCoupon.discountValue} discount applied (Coupon: ${appliedCoupon.code})`;
        }
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        amount: amountPaise, // Use the calculated amount directly, not order.amount
        currency: order.currency,
        name: 'Mockomi',
        description: description,
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
        modal: {
          ondismiss: () => {
            // User closed the payment modal without completing payment
            reject(new Error('Payment was cancelled. Interview request was not created.'));
          },
        },
      });

      razorpay.on('payment.failed', (resp: any) => {
        reject(new Error(resp?.error?.description || 'Payment failed. Interview request was not created.'));
      });

      razorpay.open();
    });
  };

  const toggleSkill = (skill: string) => {
    const normalizedSkill = skill.trim();
    if (!normalizedSkill) return;
    
    if (selectedSkills.includes(normalizedSkill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== normalizedSkill));
    } else {
      setSelectedSkills([...selectedSkills, normalizedSkill]);
    }
  };

  const addCustomSkill = () => {
    const normalizedSkill = skillSearch.trim();
    if (!normalizedSkill) {
      toast.error('Please enter a skill name');
      return;
    }
    
    if (selectedSkills.includes(normalizedSkill)) {
      toast.error('This skill is already selected');
      return;
    }

    setSelectedSkills([...selectedSkills, normalizedSkill]);
    setSkillSearch('');
    toast.success(`Added "${normalizedSkill}" as a custom skill`);
  };

  const clearAllSkills = () => {
    setSelectedSkills([]);
    setSkillSearch('');
  };

  const clearSearch = () => {
    setSkillSearch('');
  };

  // Check if current search can be added as custom skill
  const canAddCustomSkill = skillSearch.trim() && 
    !selectedSkills.includes(skillSearch.trim()) && 
    !AVAILABLE_SKILLS.map(s => s.toLowerCase()).includes(skillSearch.trim().toLowerCase());

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);
    await validateCouponMutation.mutateAsync(couponCode.trim().toUpperCase());
    setIsValidatingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleSubmit = async () => {
    if (selectedSkills.length === 0) {
      toast.error('Please select at least one skill for your interview');
      return;
    }

    const eligibility = paymentEligibilityQuery.data;
    const basePrice = eligibility?.pricePerInterview ?? 100;
    
    // Calculate if coupon makes it free
    let isFree = false;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        // Free if 100% discount
        isFree = appliedCoupon.discountValue >= 100;
      } else {
        // Free if flat discount covers full amount
        isFree = appliedCoupon.discountValue >= basePrice;
      }
    }

    // If coupon makes it free, skip payment
    if (appliedCoupon && isFree) {
      try {
        await createRequestMutation.mutateAsync({ couponCode: appliedCoupon.code });
      } catch (error: any) {
        // Error is already handled in the mutation's onError
      }
      return;
    }

    // Otherwise, process payment (with or without discount)
    let paymentId: string | undefined;
    try {
      setIsProcessingPayment(true);
      
      // Start payment flow - this will show Razorpay modal with discounted amount
      // If user cancels or payment fails, this will throw an error
      paymentId = await startPaymentFlow();
      
      // Only proceed to create interview request if payment was successful
      if (!paymentId) {
        throw new Error('Payment verification failed');
      }
      
      toast.success('Payment successful! Creating interview request...');
      
      // Create interview request with payment ID and coupon code (if applied)
      await createRequestMutation.mutateAsync({ 
        paymentId,
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      });
    } catch (error: any) {
      // Handle payment cancellation or failure
      const errorMessage = error?.message || 'Payment was cancelled or failed';
      
      // Only show error if it's not just a cancellation (user-initiated)
      if (errorMessage.includes('cancelled')) {
        toast.error('Payment cancelled. Interview request was not created. Please try again when ready.');
      } else if (errorMessage.includes('failed')) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage || 'Failed to process payment. Please try again.');
      }
      
      // Don't create interview request if payment failed or was cancelled
      return;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const eligibility = paymentEligibilityQuery.data;
  const basePrice = eligibility?.pricePerInterview ?? 100;
  
  // Calculate discounted price for display
  let discountedPrice = basePrice;
  let isFree = false;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountedPrice = basePrice * (1 - appliedCoupon.discountValue / 100);
      isFree = appliedCoupon.discountValue >= 100;
    } else {
      discountedPrice = Math.max(0, basePrice - appliedCoupon.discountValue);
      isFree = appliedCoupon.discountValue >= basePrice;
    }
  }

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
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">How It Works</h3>
              <ol className="list-decimal list-inside text-blue-700 mt-2 space-y-1 text-sm">
                <li>Select the skills/topics you want to practice</li>
                <li>Choose your preferred interview duration</li>
                <li>Apply a coupon code or complete payment</li>
                <li>Submit your request</li>
                <li>An expert interviewer matching your skills will claim your request</li>
                <li>You&apos;ll receive a notification with the scheduled time</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Coupon Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TicketIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-3">Have a Coupon Code?</h3>
              
              {!appliedCoupon ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code (e.g., INTERVIEW50)"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCoupon();
                        }
                      }}
                      className="flex-1 uppercase"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      isLoading={isValidatingCoupon}
                      disabled={!couponCode.trim() || isValidatingCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    >
                      {couponError}
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircleSolidIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appliedCoupon.code}</p>
                        <p className="text-sm text-gray-600 mt-1">{appliedCoupon.description}</p>
                        <p className="text-sm text-green-600 font-medium mt-2">
                          {appliedCoupon.remainingUses} use{appliedCoupon.remainingUses !== 1 ? 's' : ''} remaining
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </Card>

        {/* Pricing Info */}
        <Card className="mb-8 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900">Pricing Information</h3>
              {appliedCoupon && !isFree ? (
                <div className="mt-2 space-y-1">
                  <p className="text-primary-700">
                    <span className="line-through text-gray-500">₹{basePrice}</span>{' '}
                    <span className="font-semibold text-green-600">₹{Math.round(discountedPrice)}</span>
                    {' '}({appliedCoupon.discountType === 'percentage' 
                      ? `${appliedCoupon.discountValue}% off` 
                      : `₹${appliedCoupon.discountValue} off`})
                  </p>
                  <p className="text-sm text-primary-600">
                    You save ₹{Math.round(basePrice - discountedPrice)}!
                  </p>
                </div>
              ) : appliedCoupon && isFree ? (
                <p className="text-green-700 font-semibold mt-1">
                  🎉 This interview is FREE with your coupon!
                </p>
              ) : (
                <p className="text-primary-700 mt-1">
                  Each interview costs ₹{basePrice}. Apply a coupon code above for discounts!
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Skills Selection */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Select Interview Topics *
            </h2>
            {selectedSkills.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllSkills}
                className="text-gray-600"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-primary-900 flex items-center gap-2">
                  <CheckBadgeIcon className="h-4 w-4" />
                  Selected Skills ({selectedSkills.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <motion.button
                    key={skill}
                    type="button"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => toggleSkill(skill)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors cursor-pointer shadow-sm"
                  >
                    {skill}
                    <XMarkIcon className="h-4 w-4 ml-1.5" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Search Skills */}
          <div className="mb-4 relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search skills or add custom skills..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canAddCustomSkill) {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                className="pl-10 pr-10"
              />
              {skillSearch && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {canAddCustomSkill && (
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                      title="Add as custom skill"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {canAddCustomSkill && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-primary-600 flex items-center gap-2"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Press Enter or click + to add &quot;{skillSearch.trim()}&quot; as a custom skill
              </motion.p>
            )}
          </div>

          {/* Available Skills */}
          {filteredSkills.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Available skills ({filteredSkills.length})
              </p>
              <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                {filteredSkills.map((skill, index) => (
                  <motion.button
                    key={skill}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => toggleSkill(skill)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white text-gray-800 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 border border-gray-200 transition-all cursor-pointer shadow-sm"
                  >
                    {skill}
                    <span className="ml-1.5 text-primary-600">+</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            >
              {selectedSkills.length === AVAILABLE_SKILLS.length ? (
                <>
                  <CheckBadgeIcon className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-gray-900 font-medium mb-1">All skills selected!</p>
                  <p className="text-sm text-gray-600">
                    You&apos;ve selected all available skills. Remove some to see more options.
                  </p>
                </>
              ) : skillSearch ? (
                <>
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-900 font-medium mb-1">
                    No matching skills found
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    &quot;{skillSearch}&quot; is not in our predefined list. You can add it as a custom skill!
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      onClick={addCustomSkill}
                      className="flex items-center gap-2"
                    >
                      <PlusCircleIcon className="h-4 w-4" />
                      Add &quot;{skillSearch}&quot; as Custom Skill
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSearch}
                    >
                      Clear Search
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <CheckBadgeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-900 font-medium mb-1">No skills available</p>
                  <p className="text-sm text-gray-600">
                    All skills have been selected. Remove some skills above to see more options.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </Card>

        {/* Duration Selection */}
        {/* <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Preferred Duration
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferredDuration(option.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  preferredDuration === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-semibold text-lg">{option.value} min</div>
                {option.value === 30 && (
                  <div className="text-xs text-gray-500 mt-1">Recommended</div>
                )}
              </button>
            ))}
          </div>
        </Card> */}

        {/* Additional Notes */}
        <Card className="mb-6 p-6">
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
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm text-gray-600">
                Duration: {preferredDuration} minutes
              </p>
              {appliedCoupon && (
                <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                  <SparklesIcon className="h-4 w-4" />
                  Coupon applied: {appliedCoupon.code}
                  {!isFree && (
                    <span className="ml-2">
                      (₹{Math.round(discountedPrice)} after {appliedCoupon.discountType === 'percentage' 
                        ? `${appliedCoupon.discountValue}%` 
                        : `₹${appliedCoupon.discountValue}`} discount)
                    </span>
                  )}
                </p>
              )}
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
              {appliedCoupon && isFree
                ? 'Submit Interview Request (Free)'
                : appliedCoupon
                ? `Submit Interview Request (₹${Math.round(discountedPrice)})`
                : `Submit Interview Request (₹${basePrice})`}
            </Button>
          </div>
        </Card>

        {/* Success Info */}
        <div className="mt-6 flex items-center gap-3 text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
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
