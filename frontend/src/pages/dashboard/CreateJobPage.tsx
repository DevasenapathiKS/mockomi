import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { jobService } from '@/services/jobService';
import { JobType, ExperienceLevel, JobStatus } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Textarea, Card, Spinner } from '@/components/ui';

interface JobFormData {
  title: string;
  description: string;
  location: {
    city: string;
    state: string;
    country: string;
    isRemote: boolean;
  };
  employmentType: JobType;
  experienceLevel: ExperienceLevel;
  salary: {
    min: number;
    max: number;
    currency: string;
    isNegotiable: boolean;
  };
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline: string;
  openings: number;
  status: JobStatus;
}

const CreateJobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingJob, isLoading: loadingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id!),
    enabled: isEdit,
  });

  const { register, control, handleSubmit, formState: { errors } } = useForm<JobFormData>({
    defaultValues: existingJob || {
      title: '',
      description: '',
      location: { city: '', state: '', country: 'India', isRemote: false },
      employmentType: JobType.FULL_TIME,
      experienceLevel: ExperienceLevel.MID,
      salary: { min: 0, max: 0, currency: 'INR', isNegotiable: true },
      skills: [''],
      requirements: [''],
      responsibilities: [''],
      benefits: [''],
      applicationDeadline: '',
      openings: 1,
      status: JobStatus.DRAFT,
    },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    // @ts-ignore - array of strings
    name: 'skills',
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control,
    // @ts-ignore - array of strings  
    name: 'requirements',
  });

  const { fields: respFields, append: appendResp, remove: removeResp } = useFieldArray({
    control,
    // @ts-ignore - array of strings
    name: 'responsibilities',
  });

  const { fields: benefitFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({
    control,
    // @ts-ignore - array of strings
    name: 'benefits',
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => jobService.createJob(data),
    onSuccess: () => {
      toast.success('Job posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      navigate('/dashboard/my-jobs');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create job');
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: (data: any) => jobService.updateJob(id!, data),
    onSuccess: () => {
      toast.success('Job updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      navigate('/dashboard/my-jobs');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update job');
    },
  });

  const onSubmit = (data: JobFormData) => {
    // Filter out empty strings from arrays
    const cleanedData = {
      ...data,
      skills: (data.skills as any).filter((s: any) => s?.value || s),
      requirements: (data.requirements as any).filter((r: any) => r?.value || r),
      responsibilities: (data.responsibilities as any).filter((r: any) => r?.value || r),
      benefits: (data.benefits as any).filter((b: any) => b?.value || b),
      // Ensure employmentType is mapped to correct enum value
      employmentType: mapEmploymentType(data.employmentType),
    };

    if (isEdit) {
      updateJobMutation.mutate(cleanedData);
    } else {
      createJobMutation.mutate(cleanedData);
    }
    // Map employmentType to correct enum value
    function mapEmploymentType(type: JobType): string {
      switch (type) {
        case JobType.FULL_TIME:
          return 'full_time';
        case JobType.PART_TIME:
          return 'part_time';
        case JobType.CONTRACT:
          return 'contract';
        case JobType.INTERNSHIP:
          return 'internship';
        case JobType.REMOTE:
          return 'freelance';
        default:
          return type;
      }
    }
  };

  const employmentTypes = [
    { value: JobType.FULL_TIME, label: 'Full Time' },
    { value: JobType.PART_TIME, label: 'Part Time' },
    { value: JobType.CONTRACT, label: 'Contract' },
    { value: JobType.INTERNSHIP, label: 'Internship' },
    { value: JobType.REMOTE, label: 'Remote' },
  ];

  const experienceLevels = [
    { value: ExperienceLevel.ENTRY, label: 'Entry Level (0-2 years)' },
    { value: ExperienceLevel.MID, label: 'Mid Level (2-5 years)' },
    { value: ExperienceLevel.SENIOR, label: 'Senior Level (5-8 years)' },
    { value: ExperienceLevel.LEAD, label: 'Lead (8+ years)' },
    { value: ExperienceLevel.EXECUTIVE, label: 'Executive' },
  ];

  if (isEdit && loadingJob) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/my-jobs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Jobs
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Job' : 'Post a New Job'}
          </h1>
          <p className="text-gray-600 mt-1">
            Fill in the details to {isEdit ? 'update your job listing' : 'create a new job listing'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                <Input
                  label="Job Title"
                  placeholder="e.g., Senior Software Engineer"
                  {...register('title', { required: 'Job title is required' })}
                  error={errors.title?.message}
                />

                <Textarea
                  label="Job Description"
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  rows={6}
                  {...register('description', { required: 'Description is required' })}
                  error={errors.description?.message}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Employment Type
                    </label>
                    <select
                      {...register('employmentType')}
                      className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {employmentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Experience Level
                    </label>
                    <select
                      {...register('experienceLevel')}
                      className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Number of Openings"
                  type="number"
                  min={1}
                  {...register('openings', { valueAsNumber: true })}
                />
              </div>
            </Card>

            {/* Location */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="e.g., Bangalore"
                  {...register('location.city')}
                />
                <Input
                  label="State"
                  placeholder="e.g., Karnataka"
                  {...register('location.state')}
                />
                <Input
                  label="Country"
                  placeholder="e.g., India"
                  {...register('location.country')}
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('location.isRemote')}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    This is a remote position
                  </label>
                </div>
              </div>
            </Card>

            {/* Salary */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Minimum (₹ per annum)"
                  type="number"
                  placeholder="e.g., 600000"
                  {...register('salary.min', { valueAsNumber: true })}
                />
                <Input
                  label="Maximum (₹ per annum)"
                  type="number"
                  placeholder="e.g., 1000000"
                  {...register('salary.max', { valueAsNumber: true })}
                />
                <div className="flex items-center md:pt-6">
                  <input
                    type="checkbox"
                    {...register('salary.isNegotiable')}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Negotiable</label>
                </div>
              </div>
            </Card>

            {/* Skills */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="space-y-3">
                {skillFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="e.g., React.js"
                      {...register(`skills.${index}` as any)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSkill('' as any)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </Card>

            {/* Requirements */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
              <div className="space-y-3">
                {reqFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="e.g., 3+ years of experience in web development"
                      {...register(`requirements.${index}` as any)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeReq(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendReq('' as any)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </Card>

            {/* Responsibilities */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
              <div className="space-y-3">
                {respFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="e.g., Design and implement new features"
                      {...register(`responsibilities.${index}` as any)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeResp(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendResp('' as any)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Responsibility
                </Button>
              </div>
            </Card>

            {/* Benefits */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h3>
              <div className="space-y-3">
                {benefitFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="e.g., Health insurance"
                      {...register(`benefits.${index}` as any)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendBenefit('' as any)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              </div>
            </Card>

            {/* Application Deadline */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deadline</h3>
              <Input
                type="date"
                label="Application Deadline"
                {...register('applicationDeadline')}
                min={new Date().toISOString().split('T')[0]}
              />
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/my-jobs')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createJobMutation.isPending || updateJobMutation.isPending}
              >
                {isEdit ? 'Update Job' : 'Post Job'}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateJobPage;
