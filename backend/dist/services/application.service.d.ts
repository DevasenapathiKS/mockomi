import { IJobApplicationDocument } from '../models/JobApplication';
import { ApplicationStatus, PaginationQuery, PaginationInfo } from '../types';
interface CreateApplicationData {
    jobId: string;
    jobSeekerId: string;
    coverLetter?: string;
    resumeUrl: string;
}
declare class ApplicationService {
    applyToJob(data: CreateApplicationData): Promise<IJobApplicationDocument>;
    getApplicationById(applicationId: string, userId: string): Promise<IJobApplicationDocument>;
    getJobSeekerApplications(jobSeekerId: string, status?: ApplicationStatus, pagination?: PaginationQuery): Promise<{
        applications: IJobApplicationDocument[];
        pagination: PaginationInfo;
    }>;
    updateApplicationStatus(applicationId: string, employerId: string, status: ApplicationStatus, notes?: string): Promise<IJobApplicationDocument>;
    withdrawApplication(applicationId: string, jobSeekerId: string): Promise<void>;
    getApplicationStats(employerId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        recentApplications: number;
    }>;
}
declare const _default: ApplicationService;
export default _default;
//# sourceMappingURL=application.service.d.ts.map