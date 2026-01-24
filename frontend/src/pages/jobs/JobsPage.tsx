import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { jobService } from '@/services/jobService';
import { Job, JobType, ExperienceLevel } from '@/types';
import { PublicLayout } from '@/components/layout';
import { Button, Card, Badge, Spinner, EmptyState } from '@/components/ui';

const JobsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState<string>('all');
  const [experienceLevel, setExperienceLevel] = useState<string>('all');
  const [isRemote, setIsRemote] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { search, jobType, experienceLevel, isRemote, page }],
    queryFn: () =>
      jobService.searchJobs({
        search: search || undefined,
        type: jobType !== 'all' ? jobType : undefined,
        experience: experienceLevel !== 'all' ? experienceLevel : undefined,
        remote: isRemote === 'true' ? 'true' : undefined,
        page,
        limit: 12,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setJobType('all');
    setExperienceLevel('all');
    setIsRemote('all');
    setPage(1);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not disclosed';
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
    if (min) return `₹${(min / 100000).toFixed(1)}L+`;
    return `Up to ₹${(max! / 100000).toFixed(1)}L`;
  };

  const getJobTypeBadge = (type: JobType) => {
    const variants: Record<JobType, 'primary' | 'success' | 'warning' | 'info' | 'gray'> = {
      [JobType.FULL_TIME]: 'primary',
      [JobType.PART_TIME]: 'info',
      [JobType.CONTRACT]: 'warning',
      [JobType.INTERNSHIP]: 'success',
      [JobType.REMOTE]: 'gray',
    };
    return variants[type] || 'gray';
  };

  const hasActiveFilters = jobType !== 'all' || experienceLevel !== 'all' || isRemote !== 'all';

  console.log('data', data);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white text-center mb-8">
              Find Your Dream Job
            </h1>
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                  />
                </div>
                <Button type="submit" size="lg" className="md:w-auto">
                  Search Jobs
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <Card className="sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="all">All Types</option>
                      <option value={JobType.FULL_TIME}>Full Time</option>
                      <option value={JobType.PART_TIME}>Part Time</option>
                      <option value={JobType.CONTRACT}>Contract</option>
                      <option value={JobType.INTERNSHIP}>Internship</option>
                      <option value={JobType.REMOTE}>Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="all">All Levels</option>
                      <option value={ExperienceLevel.ENTRY}>Entry Level</option>
                      <option value={ExperienceLevel.MID}>Mid Level</option>
                      <option value={ExperienceLevel.SENIOR}>Senior Level</option>
                      <option value={ExperienceLevel.LEAD}>Lead</option>
                      <option value={ExperienceLevel.EXECUTIVE}>Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remote Work
                    </label>
                    <select
                      value={isRemote}
                      onChange={(e) => setIsRemote(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="all">All</option>
                      <option value="true">Remote Only</option>
                      <option value="false">On-site Only</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Jobs List */}
            <div className="flex-1">
              {/* Mobile filter toggle */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full"
                >
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  {isLoading ? 'Loading...' : `Showing ${data?.data?.length || 0} of ${data?.pagination?.total || 0} jobs`}
                </p>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <Spinner size="lg" />
                </div>
              )}

              {/* Jobs grid */}
              {data && data.data && data.data.length > 0 && (
                <div className="space-y-4">
                  {data.data.map((job: Job, index: number) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/jobs/${job._id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="flex gap-4">
                            {/* Company Logo */}
                            <div className="flex-shrink-0">
                              {job.company?.logo ? (
                                <img
                                  src={job.company.logo}
                                  alt={job.company.companyName}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Job Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                                    {job.title}
                                  </h3>
                                  <p className="text-gray-600">
                                    {job.company?.companyName || 'Company'}
                                  </p>
                                </div>
                                <Badge variant={getJobTypeBadge(job.employmentType)}>
                                  {job.employmentType.replace('_', ' ').toLocaleUpperCase()}
                                </Badge>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
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
                                  <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                                  {formatSalary(job.salary?.min, job.salary?.max)}
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Skills */}
                              {job.skills && job.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {job.skills.slice(0, 4).map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {job.skills.length > 4 && (
                                    <span className="px-2 py-1 text-gray-500 text-xs">
                                      +{job.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {data && data.data && data.data.length === 0 && (
                <EmptyState
                  title="No jobs found"
                  description="Try adjusting your search or filters to find what you're looking for."
                  action={
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  }
                />
              )}

              {/* Pagination */}
              {data && data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default JobsPage;
