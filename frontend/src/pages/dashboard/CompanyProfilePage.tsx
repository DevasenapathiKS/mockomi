import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhotoIcon,
  PencilIcon,
  CheckBadgeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { useCompanyProfile, useCreateCompanyProfile, useUpdateCompanyProfile } from '@/hooks/useProfile';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Textarea, Card, Spinner, Badge } from '@/components/ui';

interface CompanyFormData {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  website: string;
  description: string;
  industry: string;
  companySize: string;
  founded: number;
  headquarters: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  socialLinks: {
    linkedin: string;
    github: string;
    portfolio: string;
    twitter: string;
  };
}

const CompanyProfilePage: React.FC = () => {
  const { data: profile, isLoading, isError, error } = useCompanyProfile();
  const createProfile = useCreateCompanyProfile();
  const updateProfile = useUpdateCompanyProfile();
  const [isEditing, setIsEditing] = useState(false);

  const defaultValues: CompanyFormData = {
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    website: '',
    description: '',
    industry: '',
    companySize: '',
    founded: new Date().getFullYear(),
    headquarters: {
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
    },
    socialLinks: {
      linkedin: '',
      github: '',
      portfolio: '',
      twitter: '',
    },
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyFormData>({
    defaultValues,
  });

  const notFoundError = isError && (error as Error)?.message?.toLowerCase().includes('not found');

  useEffect(() => {
    if (profile) {
      reset({
        companyName: profile.companyName || '',
        companyEmail: profile.companyEmail || '',
        companyPhone: profile.companyPhone || '',
        website: profile.website || '',
        description: profile.description || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        founded: profile.founded || new Date().getFullYear(),
        headquarters: {
          address: profile.headquarters?.address || '',
          city: profile.headquarters?.city || '',
          state: profile.headquarters?.state || '',
          country: profile.headquarters?.country || 'India',
          pincode: profile.headquarters?.pincode || '',
        },
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || '',
          github: profile.socialLinks?.github || '',
          portfolio: profile.socialLinks?.portfolio || '',
          twitter: profile.socialLinks?.twitter || '',
        },
      });
    }
  }, [profile, reset]);

  useEffect(() => {
    if (notFoundError) {
      setIsEditing(true);
    }
  }, [notFoundError]);

  const buildPayload = (data: CompanyFormData) => ({
    companyName: data.companyName.trim(),
    companyEmail: data.companyEmail.trim(),
    companyPhone: data.companyPhone.trim() || undefined,
    website: data.website.trim() || undefined,
    description: data.description.trim() || undefined,
    industry: data.industry || undefined,
    companySize: data.companySize || undefined,
    founded: data.founded ? Number(data.founded) : undefined,
    headquarters: {
      address: data.headquarters.address.trim() || undefined,
      city: data.headquarters.city.trim() || undefined,
      state: data.headquarters.state.trim() || undefined,
      country: data.headquarters.country.trim() || undefined,
      pincode: data.headquarters.pincode.trim() || undefined,
    },
    socialLinks: {
      linkedin: data.socialLinks.linkedin.trim() || undefined,
      github: data.socialLinks.github.trim() || undefined,
      portfolio: data.socialLinks.portfolio.trim() || undefined,
      twitter: data.socialLinks.twitter.trim() || undefined,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    const payload = buildPayload(data);
    const mutation = notFoundError || !profile ? createProfile : updateProfile;

    try {
      await mutation.mutateAsync(payload);
      setIsEditing(false);
    } catch {
      // Errors are handled by the mutation hooks with toasts
    }
  };

  const showForm = isEditing || notFoundError || !profile;

  const industryOptions = [
    { value: '', label: 'Select Industry' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'other', label: 'Other' },
  ];

  const sizeOptions = [
    { value: '', label: 'Select Company Size' },
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1001-5000', label: '1001-5000 employees' },
    { value: '5000+', label: '5000+ employees' },
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

  if (isError && !notFoundError) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-red-600">
          Failed to load company profile. Please try again.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your company information to attract the best candidates
            </p>
            {(notFoundError || !profile) && (
              <p className="text-sm text-amber-600 mt-2">
                You haven&rsquo;t created a company profile yet. Fill the form below to get started.
              </p>
            )}
          </div>
          {!showForm && (
            <Button onClick={() => setIsEditing(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Company Header */}
        <Card className="mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              {profile?.logo ? (
                <img
                  src={profile.logo}
                  alt={profile.companyName}
                  className="h-24 w-24 rounded-xl object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-xl bg-gray-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border">
                  <PhotoIcon className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile?.companyName || 'Your Company Name'}
                </h2>
                {profile?.isVerified && (
                  <Badge variant="success">
                    <CheckBadgeIcon className="h-4 w-4 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mt-1">{profile?.industry || 'Industry'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                {profile?.headquarters?.city && (
                  <span className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {profile.headquarters.city}, {profile.headquarters.state}
                  </span>
                )}
                {profile?.companySize && (
                  <span className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {profile.companySize} employees
                  </span>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {showForm ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    placeholder="e.g., Tech Corp Inc."
                    {...register('companyName', { required: 'Company name is required' })}
                    error={errors.companyName?.message}
                  />
                  <Input
                    label="Company Email"
                    placeholder="contact@company.com"
                    type="email"
                    {...register('companyEmail', { required: 'Company email is required' })}
                    error={errors.companyEmail?.message}
                  />
                  <Input
                    label="Company Phone"
                    placeholder="+91 98765 43210"
                    {...register('companyPhone')}
                  />
                  <Input
                    label="Website"
                    placeholder="https://company.com"
                    {...register('website')}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                    <select
                      {...register('industry')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {industryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
                    <select
                      {...register('companySize')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {sizeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Founded Year"
                    type="number"
                  {...register('founded', { valueAsNumber: true })}
                    min={1800}
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="mt-4">
                  <Textarea
                    label="Company Description"
                    placeholder="Tell candidates about your company..."
                    rows={4}
                    {...register('description')}
                  />
                </div>
              </Card>

              {/* Headquarters */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Headquarters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      placeholder="Street and area"
                      {...register('headquarters.address')}
                    />
                  </div>
                  <Input
                    label="City"
                    placeholder="e.g., Bangalore"
                    {...register('headquarters.city')}
                  />
                  <Input
                    label="State"
                    placeholder="e.g., Karnataka"
                    {...register('headquarters.state')}
                  />
                  <Input
                    label="Country"
                    placeholder="e.g., India"
                    {...register('headquarters.country')}
                  />
                  <Input
                    label="Pincode"
                    placeholder="e.g., 560001"
                    {...register('headquarters.pincode')}
                  />
                </div>
              </Card>

              {/* Social Links */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Social Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="LinkedIn"
                    placeholder="https://linkedin.com/company/..."
                    {...register('socialLinks.linkedin')}
                  />
                  <Input
                    label="Twitter"
                    placeholder="https://twitter.com/..."
                    {...register('socialLinks.twitter')}
                  />
                  <Input
                    label="GitHub"
                    placeholder="https://github.com/your-org"
                    {...register('socialLinks.github')}
                  />
                  <Input
                    label="Portfolio / Website"
                    placeholder="https://company.com/portfolio"
                    {...register('socialLinks.portfolio')}
                  />
                </div>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateProfile.isPending || createProfile.isPending}>
                  {notFoundError || !profile ? 'Create Profile' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* About */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-600">
                {profile?.description || 'No description provided yet.'}
              </p>
            </Card>

            {/* Contact Information */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {profile?.companyEmail && (
                  <div className="flex items-center text-gray-600">
                    <GlobeAltIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <a href={`mailto:${profile.companyEmail}`} className="text-primary-600 hover:underline">
                      {profile.companyEmail}
                    </a>
                  </div>
                )}
                {profile?.companyPhone && (
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{profile.companyPhone}</span>
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center text-gray-600">
                    <GlobeAltIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile?.headquarters?.city && (
                  <div className="flex items-start text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      {profile.headquarters.address && <p>{profile.headquarters.address}</p>}
                      <p>
                        {profile.headquarters.city}{profile.headquarters.state ? `, ${profile.headquarters.state}` : ''}
                      </p>
                      <p>{profile.headquarters.country}</p>
                      {profile.headquarters.pincode && <p>{profile.headquarters.pincode}</p>}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Company Details */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{profile?.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company Size</p>
                  <p className="font-medium">{profile?.companySize || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Founded</p>
                  <p className="font-medium">{profile?.founded || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={profile?.isVerified ? 'success' : 'warning'}>
                    {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfilePage;
