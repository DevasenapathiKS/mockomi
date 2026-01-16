import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CameraIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useJobSeekerProfile, useUpdateJobSeekerProfile, useUploadResume, useUploadAvatar, useUpdateBasicInfo } from '@/hooks/useProfile';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Card, Spinner, Textarea, Badge } from '@/components/ui';
import { JobType, JobPreferences } from '@/types';

interface ExperienceEntry {
  company: string;
  title: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  level: 'high_school' | 'diploma' | 'bachelors' | 'masters' | 'phd' | 'other';
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
}

interface ProfileFormData {
  headline: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  preferences?: {
    jobTypes: string[];
    locations: string[];
    remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  };
}

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { data: profile, isLoading } = useJobSeekerProfile();
  const { isComplete, missing } = useProfileCompletion();
  const updateProfile = useUpdateJobSeekerProfile();
  const uploadResume = useUploadResume();
  const uploadAvatar = useUploadAvatar();
  const updateBasicInfo = useUpdateBasicInfo();
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      headline: '',
      summary: '',
      experience: [],
      education: [],
      skills: [],
      preferences: {
        jobTypes: [],
        locations: [],
        remotePreference: 'any',
      },
    },
  });

  // Sync editable name fields with current user
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone((user as any)?.phone || '');
    }
  }, [user]);

  // If onboarding flag is present and profile incomplete, start in edit mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === '1' && !isComplete) {
      setIsEditing(true);
    }
  }, [location.search, isComplete]);

  // Sync form defaults when profile loads
  useEffect(() => {
    if (!profile) return;
    reset({
      headline: profile.headline || '',
      summary: profile.summary || '',
      experience: profile.experience || [],
      education: profile.education || [],
      skills: (profile.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name || '')).filter(Boolean),
      preferences: profile.preferences
        ? {
            jobTypes: (profile.preferences.jobTypes as any) || [],
            locations: (profile.preferences.locations as any) || [],
            remotePreference: (profile.preferences.remotePreference as any) || 'any',
          }
        : {
            jobTypes: [],
            locations: [],
            remotePreference: 'any',
          },
    });
  }, [profile, reset]);

  const {
    fields: experienceFields,
    append: addExperience,
    remove: removeExperience,
  } = useFieldArray({ control, name: 'experience' });

  const {
    fields: educationFields,
    append: addEducation,
    remove: removeEducation,
  } = useFieldArray({ control, name: 'education' });

  const skills = watch('skills') || [];

  const onSubmit = async (data: ProfileFormData) => {
    // Transform preferences to match the expected type
    const transformedData = {
      ...data,
      preferences: data.preferences
        ? ({
            ...data.preferences,
            jobTypes: data.preferences.jobTypes as JobType[],
          } as JobPreferences)
        : undefined,
    };

    try {
      // If there's a cropped avatar waiting, upload it first
      if (avatarFile) {
        await uploadAvatar.mutateAsync(avatarFile);
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setAvatarFile(null);
      }

      const updates: Promise<any>[] = [];

      // Update basic info if changed
      if (
        firstName !== user?.firstName ||
        lastName !== user?.lastName ||
        phone !== (user as any)?.phone
      ) {
        updates.push(updateBasicInfo.mutateAsync({ firstName, lastName, phone }));
      }

      // Update job seeker profile
      updates.push(updateProfile.mutateAsync(transformedData));

      await Promise.all(updates);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setValue('skills', [...skills, newSkill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setValue('skills', skills.filter((s) => s !== skill));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadResume.mutate(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > maxSize) {
      toast.error('Image size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const getCroppedBlob = async (src: string, pixels: { x: number; y: number; width: number; height: number }) => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = pixels.width;
    canvas.height = pixels.height;

    ctx.drawImage(
      image,
      pixels.x,
      pixels.y,
      pixels.width,
      pixels.height,
      0,
      0,
      pixels.width,
      pixels.height
    );

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.92);
    });
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCropConfirm = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      // Store preview and file for deferred upload
      setAvatarFile(file);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(previewUrl);

      // Close cropper and reset state
      setShowCropper(false);
      setImageSrc(null);
      setCroppedAreaPixels(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });

      toast.success('Preview ready. Click Save Changes to upload.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to crop image');
    }
  };

  // Derive a reasonable completeness percentage if backend value is missing/zero
  const completionPercent = useMemo(() => {
    if (typeof profile?.profileCompleteness === 'number' && profile.profileCompleteness > 0) {
      return profile.profileCompleteness;
    }
    const checks = [
      Boolean(user?.firstName),
      Boolean(user?.lastName),
      Boolean((user as any)?.phone || phone),
      Boolean(profile?.headline || watch('headline')),
      Boolean(profile?.summary || watch('summary')),
      (profile?.skills?.length || watch('skills')?.length || 0) > 0,
      (profile?.education?.length || watch('education')?.length || 0) > 0,
    ];
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    return isComplete ? 100 : score;
  }, [profile, user, phone, isComplete, watch]);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: UserIcon },
    { id: 'experience', label: 'Experience', icon: BriefcaseIcon },
    { id: 'education', label: 'Education', icon: AcademicCapIcon },
    { id: 'skills', label: 'Skills', icon: WrenchScrewdriverIcon },
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
      <div className="max-w-5xl mx-auto pb-24">
        {/* Hero Profile Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 mb-8">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative px-8 py-10">
            {!isComplete && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-start gap-3">
                  <CheckCircleSolidIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">Complete your profile</p>
                    <p className="text-white/90 text-sm">
                      Missing: {missing.join(', ')}. Complete your profile to unlock all features.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl bg-white/10 backdrop-blur-sm">
                  <img
                    src={avatarPreview || user?.avatar || '/default-avatar.png'}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-full h-full object-cover"
                  />
                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <Spinner size="md" className="text-white" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <motion.label
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute -bottom-2 -right-2 bg-white text-primary-600 p-3 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <CameraIcon className="h-5 w-5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </motion.label>
                )}
              </div>

              {/* Name & Info Section */}
              <div className="flex-1 text-white">
                {isEditing ? (
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-48 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                    />
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-48 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold mb-2">
                    {user?.firstName} {user?.lastName}
                  </h1>
                )}
                
                <p className="text-white/90 text-lg mb-4">
                  {profile?.headline || <span className="text-white/60 italic">Add your professional headline</span>}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      {completionPercent}% Complete
                    </span>
                  </div>
                  {user?.email && (
                    <span className="text-white/80 text-sm">{user.email}</span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="bg-white text-primary-600 border-white hover:bg-white/90 shadow-lg"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {activeTab === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <UserIcon className="h-6 w-6 text-primary-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-5">
                    <Input
                      label="Professional Headline"
                      placeholder="e.g., Senior Software Engineer with 5+ years experience"
                      disabled={!isEditing}
                      {...register('headline')}
                      error={errors.headline?.message}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                    <Textarea
                      label="Professional Summary"
                      placeholder="Write a brief summary about yourself, your experience, and what you're looking for..."
                      rows={5}
                      disabled={!isEditing}
                      {...register('summary')}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="+91 9876543210"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </Card>

                {/* Resume Section */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <DocumentArrowUpIcon className="h-6 w-6 text-primary-600" />
                    Resume
                  </h3>
                  {profile?.resume ? (
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl border border-primary-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                          <DocumentArrowUpIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{profile.resume.filename}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Uploaded on {new Date(profile.resume.uploadedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <a
                        href={profile.resume.url}
                        download={profile.resume.filename || 'resume'}
                        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                      <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">No resume uploaded yet</p>
                      <p className="text-sm text-gray-500">Upload your resume to help employers find you</p>
                    </div>
                  )}
                  {isEditing && (
                    <div className="mt-4">
                      <label className="block">
                        <span className="sr-only">Upload resume</span>
                        <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer">
                          <DocumentArrowUpIcon className="h-6 w-6 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              {profile?.resume ? 'Replace Resume' : 'Upload Resume'}
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOC, or DOCX (Max 10MB)</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            className="hidden"
                          />
                        </div>
                      </label>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {activeTab === 'experience' && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {experienceFields.length === 0 && !isEditing ? (
                  <Card className="text-center py-16">
                    <BriefcaseIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No experience added yet</h3>
                    <p className="text-gray-600 mb-6">Add your work experience to showcase your career journey</p>
                    <Button onClick={() => setIsEditing(true)}>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Experience
                    </Button>
                  </Card>
                ) : (
                  <>
                    {experienceFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                      >
                        <Card className="p-6">
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              Experience {index + 1}
                            </h4>
                            {isEditing && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeExperience(index)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                              label="Job Title"
                              placeholder="e.g., Senior Software Engineer"
                              disabled={!isEditing}
                              {...register(`experience.${index}.title`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="Company"
                              placeholder="e.g., Tech Company Inc."
                              disabled={!isEditing}
                              {...register(`experience.${index}.company`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employment Type
                              </label>
                              <select
                                disabled={!isEditing}
                                className={`block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                                {...register(`experience.${index}.employmentType` as const)}
                              >
                                <option value="full_time">Full-time</option>
                                <option value="part_time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="freelance">Freelance</option>
                                <option value="internship">Internship</option>
                              </select>
                            </div>
                            <Input
                              label="Location"
                              placeholder="City, Country"
                              disabled={!isEditing}
                              {...register(`experience.${index}.location`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="Start Date"
                              type="month"
                              disabled={!isEditing}
                              {...register(`experience.${index}.startDate`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="End Date"
                              type="month"
                              disabled={!isEditing || watch(`experience.${index}.current`)}
                              {...register(`experience.${index}.endDate`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                          </div>
                          <div className="mt-5">
                            <Textarea
                              label="Description"
                              placeholder="Describe your responsibilities and achievements..."
                              disabled={!isEditing}
                              rows={4}
                              {...register(`experience.${index}.description`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          addExperience({
                            title: '',
                            company: '',
                            employmentType: 'full_time',
                            location: '',
                            startDate: '',
                            endDate: '',
                            current: false,
                            description: '',
                          })
                        }
                        className="w-full border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Another Experience
                      </Button>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'education' && (
              <motion.div
                key="education"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {educationFields.length === 0 && !isEditing ? (
                  <Card className="text-center py-16">
                    <AcademicCapIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No education added yet</h3>
                    <p className="text-gray-600 mb-6">Add your educational background to complete your profile</p>
                    <Button onClick={() => setIsEditing(true)}>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Education
                    </Button>
                  </Card>
                ) : (
                  <>
                    {educationFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                      >
                        <Card className="p-6">
                          <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              Education {index + 1}
                            </h4>
                            {isEditing && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeEducation(index)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                              label="Institution"
                              placeholder="e.g., University of Technology"
                              disabled={!isEditing}
                              {...register(`education.${index}.institution`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="Degree"
                              placeholder="e.g., Bachelor of Science"
                              disabled={!isEditing}
                              {...register(`education.${index}.degree`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Education Level
                              </label>
                              <select
                                disabled={!isEditing}
                                className={`block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                                {...register(`education.${index}.level` as const)}
                              >
                                <option value="high_school">High school</option>
                                <option value="diploma">Diploma</option>
                                <option value="bachelors">Bachelors</option>
                                <option value="masters">Masters</option>
                                <option value="phd">PhD</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <Input
                              label="Field of Study"
                              placeholder="e.g., Computer Science"
                              disabled={!isEditing}
                              {...register(`education.${index}.field`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="Grade/CGPA"
                              placeholder="e.g., 3.8 / 4.0"
                              disabled={!isEditing}
                              {...register(`education.${index}.grade`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="Start Date"
                              type="month"
                              disabled={!isEditing}
                              {...register(`education.${index}.startDate`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                            <Input
                              label="End Date"
                              type="month"
                              disabled={!isEditing || watch(`education.${index}.current`)}
                              {...register(`education.${index}.endDate`)}
                              className={!isEditing ? 'bg-gray-50' : ''}
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          addEducation({
                            institution: '',
                            degree: '',
                            level: 'bachelors',
                            field: '',
                            startDate: '',
                            endDate: '',
                            current: false,
                            grade: '',
                          })
                        }
                        className="w-full border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Another Education
                      </Button>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-primary-600" />
                    Skills & Expertise
                  </h3>
                  {skills.length === 0 && !isEditing ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                      <WrenchScrewdriverIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">No skills added yet</p>
                      <p className="text-sm text-gray-500">Add your skills to help employers find you</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="info"
                            className="flex items-center gap-2 px-4 py-2 text-base"
                          >
                            {skill}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-1 hover:text-red-600 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-3 pt-4 border-t">
                          <Input
                            placeholder="Add a skill (e.g., JavaScript, Python, React)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkill();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button type="button" onClick={addSkill}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Image Cropper Modal */}
        <AnimatePresence>
          {showCropper && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl mx-4"
              >
                <Card className="overflow-hidden">
                  <div className="relative w-full h-96 bg-gray-900">
                    {imageSrc && (
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    )}
                  </div>
                  <div className="p-6 bg-white">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zoom: {zoom.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleCropCancel} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleCropConfirm} className="flex-1">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Apply Crop
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Save Button */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-8 right-8 z-40"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="text-right pr-4 border-r border-gray-200">
                  <p className="text-xs text-gray-500">You have unsaved changes</p>
                  <p className="text-sm font-medium text-gray-900">Review and save your profile</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-gray-300"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    isLoading={updateProfile.isPending || updateBasicInfo.isPending || uploadAvatar.isPending}
                    disabled={!firstName || !lastName}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
