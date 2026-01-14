import { IUserDocument } from '../types';
import { UserStatus, UserRole } from '../types';
interface DashboardStats {
    totalUsers: number;
    activeJobSeekers: number;
    activeEmployers: number;
    activeInterviewers: number;
    pendingInterviewers: number;
    totalInterviews: number;
    completedInterviews: number;
    totalJobs: number;
    activeJobs: number;
    totalRevenue: number;
    monthlyRevenue: number;
}
declare class AdminService {
    getDashboardStats(): Promise<DashboardStats>;
    private getRevenueStats;
    getAllUsers(role?: UserRole, status?: UserStatus, page?: number, limit?: number): Promise<{
        users: IUserDocument[];
        total: number;
        totalPages: number;
    }>;
    updateUserStatus(userId: string, status: UserStatus, adminId: string): Promise<IUserDocument>;
    getPendingInterviewers(page?: number, limit?: number): Promise<{
        interviewers: any[];
        total: number;
        totalPages: number;
    }>;
    approveInterviewer(interviewerId: string, adminId: string, isApproved: boolean, rejectionReason?: string): Promise<any>;
    getInterviewAnalytics(startDate?: Date, endDate?: Date): Promise<any>;
    getRevenueAnalytics(startDate?: Date, endDate?: Date): Promise<any>;
    getTopInterviewers(limit?: number): Promise<any[]>;
    getSystemHealth(): Promise<any>;
    private checkDatabaseHealth;
    private checkCacheHealth;
}
declare const _default: AdminService;
export default _default;
//# sourceMappingURL=admin.service.d.ts.map