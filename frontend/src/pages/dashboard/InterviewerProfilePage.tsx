import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  UserIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { profileService } from '@/services/profileService';
import { InterviewType, AvailabilitySlot } from '@/types';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Spinner, Textarea, Badge } from '@/components/ui';

interface InterviewerProfileForm {
  currentPosition: string;
  currentCompany: string;
  experience: number;
  bio: string;
  expertise: string[];
  hourlyRate: number;
  interviewTypes: InterviewType[];
  languages: string[];
  availability: AvailabilitySlot[];
  linkedinUrl: string;
}

const InterviewerProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [newExpertise, setNewExpertise] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['interviewer-profile'],
    queryFn: () => profileService.getInterviewerProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: InterviewerProfileForm) => profileService.updateInterviewerProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['interviewer-profile'] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InterviewerProfileForm>({
    defaultValues: {
      currentPosition: profile?.currentPosition || '',
      currentCompany: profile?.currentCompany || '',
      experience: profile?.experience || 0,
      bio: profile?.bio || '',
      expertise: profile?.expertise || [],
      hourlyRate: profile?.hourlyRate || 500,
      interviewTypes: profile?.interviewTypes || [],
      languages: profile?.languages || ['English'],
      availability: profile?.availability || [],
      linkedinUrl: profile?.linkedinUrl || '',
    },
  });

  const {
    fields: availabilityFields,
    append: addAvailability,
    remove: removeAvailability,
  } = useFieldArray({
    control,
    name: 'availability',
  });

  const expertise = watch('expertise') || [];
  const languages = watch('languages') || [];
  const interviewTypes = watch('interviewTypes') || [];

  const onSubmit = (data: InterviewerProfileForm) => {
    updateMutation.mutate(data);
  };

  const addExpertise = () => {
    if (newExpertise && !expertise.includes(newExpertise)) {
      setValue('expertise', [...expertise, newExpertise]);
      setNewExpertise('');
    }
  };

  const removeExpertise = (item: string) => {
    setValue('expertise', expertise.filter((e) => e !== item));
  };

  const addLanguage = () => {
    if (newLanguage && !languages.includes(newLanguage)) {
      setValue('languages', [...languages, newLanguage]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (item: string) => {
    setValue('languages', languages.filter((l) => l !== item));
  };

  const toggleInterviewType = (type: InterviewType) => {
    if (interviewTypes.includes(type)) {
      setValue('interviewTypes', interviewTypes.filter((t) => t !== type));
    } else {
      setValue('interviewTypes', [...interviewTypes, type]);
    }
  };

  const dayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  if (isLoading) {
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interviewer Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your interviewer profile and availability
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <StarSolidIcon className="h-6 w-6 text-yellow-400 mr-1" />
              <span className="text-2xl font-bold">
                {profile?.rating?.average?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Rating ({profile?.rating?.count || 0} reviews)</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {profile?.totalInterviews || 0}
            </p>
            <p className="text-sm text-gray-600">Interviews Completed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ₹{profile?.totalEarnings?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </Card>
          <Card className="text-center">
            <Badge variant={profile?.isApproved ? 'success' : 'warning'}>
              {profile?.approvalStatus || 'pending'}
            </Badge>
            <p className="text-sm text-gray-600 mt-2">Approval Status</p>
          </Card>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Basic Info */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Current Position"
                    placeholder="e.g., Senior Software Engineer"
                    {...register('currentPosition')}
                    error={errors.currentPosition?.message}
                  />
                  <Input
                    label="Current Company"
                    placeholder="e.g., Google"
                    {...register('currentCompany')}
                    error={errors.currentCompany?.message}
                  />
                  <Input
                    type="number"
                    label="Years of Experience"
                    {...register('experience', { valueAsNumber: true, min: 0, required: 'Experience is required' })}
                    error={errors.experience?.message}
                  />
                  <Input
                    type="number"
                    label="Hourly Rate (₹)"
                    {...register('hourlyRate', { valueAsNumber: true, min: 100 })}
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="LinkedIn URL"
                    placeholder="https://linkedin.com/in/yourprofile"
                    {...register('linkedinUrl')}
                  />
                </div>
                <div className="mt-4">
                  <Textarea
                    label="Bio"
                    placeholder="Tell candidates about yourself and your interview style..."
                    rows={4}
                    {...register('bio')}
                  />
                </div>
              </Card>

              {/* Expertise */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {expertise.map((item) => (
                    <Badge key={item} variant="gray" className="flex items-center gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeExpertise(item)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add expertise (e.g., React, System Design)"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                  />
                  <Button type="button" onClick={addExpertise}>
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </div>
              </Card>

              {/* Interview Types */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(InterviewType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleInterviewType(type)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        interviewTypes.includes(type)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Languages */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {languages.map((item) => (
                    <Badge key={item} variant="info" className="flex items-center gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeLanguage(item)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add language"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  />
                  <Button type="button" onClick={addLanguage}>
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                </div>
              </Card>

              {/* Availability */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
                <div className="space-y-3">
                  {availabilityFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <select
                        {...register(`availability.${index}.dayOfWeek` as const, { valueAsNumber: true })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        {dayOptions.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="time"
                        {...register(`availability.${index}.slots.0.startTime` as const)}
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        {...register(`availability.${index}.slots.0.endTime` as const)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAvailability(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addAvailability({ dayOfWeek: 1, slots: [{ startTime: '09:00', endTime: '17:00' }] })}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Availability Slot
                  </Button>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* View Mode */}
            <Card>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profile?.currentPosition || 'Position not set'}
                    </h2>
                    {profile?.isApproved && (
                      <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-600">{profile?.currentCompany || 'Company not set'}</p>
                  <p className="text-gray-500 mt-1">{profile?.experience || 0} years of experience</p>
                  <p className="text-gray-600 mt-3">{profile?.bio || 'No bio available'}</p>
                  {profile?.linkedinUrl && (
                    <a 
                      href={profile.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline mt-2 inline-block"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.expertise?.map((item) => (
                  <Badge key={item} variant="primary">{item}</Badge>
                )) || <p className="text-gray-500">No expertise added</p>}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Types</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.interviewTypes?.map((type) => (
                  <Badge key={type} variant="info">{type.replace('_', ' ')}</Badge>
                )) || <p className="text-gray-500">No interview types selected</p>}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.languages?.map((lang) => (
                  <Badge key={lang} variant="gray">{lang}</Badge>
                )) || <p className="text-gray-500">No languages added</p>}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
              {profile?.availability && profile.availability.length > 0 ? (
                <div className="space-y-2">
                  {profile.availability.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span>{dayOptions.find(d => d.value === slot.dayOfWeek)?.label}</span>
                      <span>•</span>
                      <span>
                        {slot.slots?.map((s, i) => (
                          <span key={i}>
                            {s.startTime} - {s.endTime}
                            {i < slot.slots.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No availability set</p>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Hourly Rate</h3>
                  <p className="text-gray-600">Your rate for interview sessions</p>
                </div>
                <div className="flex items-center gap-1">
                  <CurrencyRupeeIcon className="h-6 w-6 text-gray-600" />
                  <span className="text-2xl font-bold text-gray-900">{profile?.hourlyRate || 0}</span>
                  <span className="text-gray-500">/hour</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewerProfilePage;
