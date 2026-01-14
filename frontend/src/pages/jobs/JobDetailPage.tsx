import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { jobService } from '@/services/jobService';
import { useAuthStore } from '@/store/authStore';
import { PublicLayout } from '@/components/layout';
import { Button, Card, Badge, Spinner, EmptyState, Modal, Textarea } from '@/components/ui';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [applyModal, setApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id!),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: () => jobService.applyToJob(id!, { coverLetter }),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      setApplyModal(false);
      setCoverLetter('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    setApplyModal(true);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not disclosed';
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L per year`;
    if (min) return `₹${(min / 100000).toFixed(1)}L+ per year`;
    return `Up to ₹${(max! / 100000).toFixed(1)}L per year`;
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !job) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <EmptyState
            title="Job not found"
            description="The job you're looking for doesn't exist or has been removed."
            action={
              <Link to="/jobs">
                <Button>Browse Jobs</Button>
              </Link>
            }
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to="/jobs"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                {job.company?.logo ? (
                  <img
                    src={job.company.logo}
                    alt={job.company.companyName}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Job Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <p className="text-lg text-gray-600 mt-1">
                      {job.company?.companyName || 'Company'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <BookmarkIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ShareIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {job.location?.city || job.location?.country || 'Location not specified'}
                    {job.location?.remote && ' (Remote)'}
                  </div>
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-1" />
                    {job.experienceLevel}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {job.employmentType.replace('_', ' ')}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="primary">{job.employmentType.replace('_', ' ')}</Badge>
                  {job.location?.remote && <Badge variant="success">Remote</Badge>}
                </div>

                <div className="mt-6">
                  <Button
                    size="lg"
                    onClick={handleApply}
                    disabled={user?.role === 'employer'}
                  >
                    {user?.role === 'employer' ? 'Cannot apply as employer' : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Job Description
                  </h2>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    {job.description.split('\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Requirements
                    </h2>
                    <ul className="space-y-2">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Responsibilities
                    </h2>
                    <ul className="space-y-2">
                      {job.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Benefits
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="info">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Job Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CurrencyRupeeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Salary</p>
                        <p className="font-medium">{formatSalary(job.salary?.min, job.salary?.max)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium capitalize">{job.experienceLevel}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Job Type</p>
                        <p className="font-medium capitalize">{job.employmentType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Posted</p>
                        <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Applications</p>
                        <p className="font-medium">{job.applicationsCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Company Info */}
              {job.company && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      About the Company
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      {job.company.logo ? (
                        <img
                          src={job.company.logo}
                          alt={job.company.companyName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{job.company.companyName}</p>
                        {job.company.industry && (
                          <p className="text-sm text-gray-500">{job.company.industry}</p>
                        )}
                      </div>
                    </div>
                    {job.company.description && (
                      <p className="text-sm text-gray-600 line-clamp-4">
                        {job.company.description}
                      </p>
                    )}
                    {job.company.website && (
                      <a
                        href={job.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Visit Website →
                      </a>
                    )}
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Modal */}
        <Modal
          isOpen={applyModal}
          onClose={() => setApplyModal(false)}
          title="Apply for this position"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              <p className="text-gray-600">{job.company?.companyName}</p>
            </div>

            <Textarea
              label="Cover Letter (Optional)"
              placeholder="Tell the employer why you're a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setApplyModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => applyMutation.mutate()}
                isLoading={applyMutation.isPending}
              >
                Submit Application
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PublicLayout>
  );
};

export default JobDetailPage;
