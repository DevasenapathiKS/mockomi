import { IJobSeekerProfile, ICompanyProfile, IInterviewerProfile, CandidateFilters, PaginationQuery, PaginationInfo } from '../types';
declare class ProfileService {
    getJobSeekerProfile(userId: string): Promise<any>;
    updateJobSeekerProfile(userId: string, data: Partial<IJobSeekerProfile>): Promise<any>;
    uploadResume(userId: string, file: Buffer, fileName: string, mimeType: string): Promise<{
        url: string;
        fileName: string;
    }>;
    getCompanyProfile(userId: string): Promise<any>;
    createCompanyProfile(userId: string, data: ICompanyProfile): Promise<any>;
    updateCompanyProfile(userId: string, data: Partial<ICompanyProfile>): Promise<any>;
    uploadCompanyLogo(userId: string, file: Buffer, fileName: string, mimeType: string): Promise<{
        url: string;
    }>;
    getInterviewerProfile(userId: string): Promise<any>;
    updateInterviewerProfile(userId: string, data: Partial<IInterviewerProfile>): Promise<any>;
    searchCandidates(filters: CandidateFilters, pagination: PaginationQuery): Promise<{
        candidates: any[];
        pagination: PaginationInfo;
    }>;
    getCandidateDetails(candidateUserId: string): Promise<any>;
    updateAvatar(userId: string, file: Buffer, fileName: string, mimeType: string): Promise<{
        url: string;
    }>;
    updateBasicInfo(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<any>;
}
declare const _default: ProfileService;
export default _default;
//# sourceMappingURL=profile.service.d.ts.map