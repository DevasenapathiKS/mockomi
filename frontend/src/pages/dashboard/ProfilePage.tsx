import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
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
} from '@heroicons/react/24/outline';
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

  // Saving of basic info is handled together in onSubmit

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your job seeker profile</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSubmit(onSubmit)} isLoading={updateProfile.isPending || updateBasicInfo.isPending || uploadAvatar.isPending} disabled={!firstName || !lastName}>
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="mb-6">
          {!isComplete && (
            <div className="p-3 mb-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              Complete your profile to unlock all features. Missing: {missing.map((m) => m).join(', ')}
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarPreview || user?.avatar || '/default-avatar.png'}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-16 h-16 rounded-full object-cover"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                  <CameraIcon className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              )}
              {uploadAvatar.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-40"
                  />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-40"
                  />
                </div>
              ) : (
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
              )}
              <p className="text-gray-600">{profile?.headline || 'Add your headline'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="info">
                  {profile?.profileCompleteness || 0}% Complete
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {showCropper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <Card className="w-full max-w-lg overflow-hidden">
              <div className="relative w-full h-80 bg-gray-900">
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
              <div className="p-4 flex items-center justify-between gap-3">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-1/2"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCropCancel}>Cancel</Button>
                  <Button onClick={handleCropConfirm}>Crop</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-4 py-3 text-sm font-medium border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Professional Headline"
                    placeholder="e.g., Senior Software Engineer with 5+ years experience"
                    disabled={!isEditing}
                    {...register('headline')}
                    error={errors.headline?.message}
                  />
                  <Textarea
                    label="Professional Summary"
                    placeholder="Write a brief summary about yourself..."
                    rows={4}
                    disabled={!isEditing}
                    {...register('summary')}
                  />
                  <Input
                    label="Phone"
                    placeholder="Phone number"
                    disabled={!isEditing}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </Card>

              {/* Resume Section */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
                {profile?.resume ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{profile.resume.filename}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded on {new Date(profile.resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={profile.resume.url}
                        download={profile.resume.filename || 'resume'}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No resume uploaded yet</p>
                )}
                {isEditing && (
                  <div className="mt-4">
                    <label className="block">
                      <span className="sr-only">Upload resume</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                    </label>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === 'experience' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {experienceFields.map((field, index) => (
                <Card key={field.id}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExperience(index)}
                        className="text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Job Title"
                      disabled={!isEditing}
                      {...register(`experience.${index}.title`)}
                    />
                    <Input
                      label="Company"
                      disabled={!isEditing}
                      {...register(`experience.${index}.company`)}
                    />
                    <Input
                      label="Location"
                      disabled={!isEditing}
                      {...register(`experience.${index}.location`)}
                    />
                    <Input
                      label="Start Date"
                      type="month"
                      disabled={!isEditing}
                      {...register(`experience.${index}.startDate`)}
                    />
                    <Input
                      label="End Date"
                      type="month"
                      disabled={!isEditing}
                      {...register(`experience.${index}.endDate`)}
                    />
                  </div>
                  <div className="mt-4">
                    <Textarea
                      label="Description"
                      disabled={!isEditing}
                      rows={3}
                      {...register(`experience.${index}.description`)}
                    />
                  </div>
                </Card>
              ))}
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    addExperience({
                      title: '',
                      company: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      description: '',
                    })
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              )}
              {experienceFields.length === 0 && !isEditing && (
                <Card className="text-center py-8">
                  <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No experience added yet</p>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'education' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {educationFields.map((field, index) => (
                <Card key={field.id}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Institution"
                      disabled={!isEditing}
                      {...register(`education.${index}.institution`)}
                    />
                    <Input
                      label="Degree"
                      disabled={!isEditing}
                      {...register(`education.${index}.degree`)}
                    />
                    <Input
                      label="Field of Study"
                      disabled={!isEditing}
                      {...register(`education.${index}.field`)}
                    />
                    <Input
                      label="Grade/CGPA"
                      disabled={!isEditing}
                      {...register(`education.${index}.grade`)}
                    />
                    <Input
                      label="Start Date"
                      type="month"
                      disabled={!isEditing}
                      {...register(`education.${index}.startDate`)}
                    />
                    <Input
                      label="End Date"
                      type="month"
                      disabled={!isEditing}
                      {...register(`education.${index}.endDate`)}
                    />
                  </div>
                </Card>
              ))}
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    addEducation({
                      institution: '',
                      degree: '',
                      field: '',
                      startDate: '',
                      endDate: '',
                      current: false,
                      grade: '',
                    })
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              )}
              {educationFields.length === 0 && !isEditing && (
                <Card className="text-center py-8">
                  <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No education added yet</p>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="info"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-gray-500">No skills added yet</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkill}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
