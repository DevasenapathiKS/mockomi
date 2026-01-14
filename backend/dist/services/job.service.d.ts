import { IJobDocument } from '../models/Job';
import { JobStatus, ApplicationStatus, JobFilters, PaginationQuery, PaginationInfo } from '../types';
interface CreateJobData {
    employerId: string;
    title: string;
    description: string;
    requirements?: string[];
    responsibilities?: string[];
    skills: string[];
    experienceLevel: string;
    employmentType: string;
    salary?: {
        min?: number;
        max?: number;
        currency?: string;
        isNegotiable?: boolean;
        showOnListing?: boolean;
    };
    location: {
        city: string;
        state?: string;
        country: string;
        isRemote?: boolean;
        isHybrid?: boolean;
    };
    benefits?: string[];
    applicationDeadline?: Date;
}
interface JobWithCompany extends IJobDocument {
    company?: {
        companyName: string;
        logo?: string;
        industry?: string;
        companySize?: string;
    };
}
declare class JobService {
    createJob(data: CreateJobData): Promise<IJobDocument>;
    updateJob(jobId: string, employerId: string, data: Partial<CreateJobData>): Promise<IJobDocument>;
    deleteJob(jobId: string, employerId: string): Promise<void>;
    publishJob(jobId: string, employerId: string): Promise<IJobDocument>;
    closeJob(jobId: string, employerId: string): Promise<IJobDocument>;
    getJobById(jobId: string, incrementViews?: boolean): Promise<JobWithCompany>;
    searchJobs(filters: JobFilters, pagination: PaginationQuery): Promise<{
        jobs: JobWithCompany[];
        pagination: PaginationInfo;
    }>;
    getEmployerJobs(employerId: string, status?: JobStatus, pagination?: PaginationQuery): Promise<{
        jobs: IJobDocument[];
        pagination: PaginationInfo;
    }>;
    getJobApplications(jobId: string, employerId: string, status?: ApplicationStatus, pagination?: PaginationQuery): Promise<{
        applications: any[];
        pagination: PaginationInfo;
    }>;
}
declare const _default: JobService;
export default _default;
//# sourceMappingURL=job.service.d.ts.map