import { IInterviewDocument } from '../models/Interview';
import { InterviewStatus, IInterviewFeedback, PaginationQuery, PaginationInfo } from '../types';
interface ScheduleInterviewData {
    jobSeekerId: string;
    interviewerId: string;
    scheduledAt: Date;
    duration?: number;
    topic?: string;
    paymentId?: string;
}
declare class InterviewService {
    private validateCompletedPayment;
    scheduleInterview(data: ScheduleInterviewData): Promise<IInterviewDocument>;
    getInterviewById(interviewId: string, userId: string): Promise<IInterviewDocument>;
    getJobSeekerInterviews(jobSeekerId: string, status?: InterviewStatus, pagination?: PaginationQuery): Promise<{
        interviews: IInterviewDocument[];
        pagination: PaginationInfo;
    }>;
    getInterviewerInterviews(interviewerId: string, status?: InterviewStatus, pagination?: PaginationQuery): Promise<{
        interviews: IInterviewDocument[];
        pagination: PaginationInfo;
    }>;
    getInterviewerEarnings(interviewerId: string, period?: string): Promise<{
        earnings: Array<{
            id: string;
            interviewId: string;
            candidateName: string;
            date: string;
            duration: number;
            amount: number;
            status: 'pending' | 'paid' | 'processing';
            type: string;
        }>;
        stats: {
            totalEarnings: number;
            pendingAmount: number;
            paidAmount: number;
            totalInterviews: number;
        };
    }>;
    private ensureMeetingUrl;
    startInterview(interviewId: string, interviewerId: string): Promise<IInterviewDocument>;
    completeInterview(interviewId: string, interviewerId: string): Promise<IInterviewDocument>;
    cancelInterview(interviewId: string, userId: string, reason?: string): Promise<IInterviewDocument>;
    submitFeedback(interviewId: string, interviewerId: string, feedback: Omit<IInterviewFeedback, 'submittedAt'>): Promise<IInterviewDocument>;
    uploadRecording(interviewId: string, interviewerId: string, file: Buffer, fileName: string, mimeType: string): Promise<IInterviewDocument>;
    getRecordingUrl(interviewId: string, userId: string): Promise<string>;
    checkPaymentRequired(_jobSeekerId: string): Promise<{
        required: boolean;
        pricePerInterview: number;
    }>;
    getAvailableInterviewers(expertise?: string[], _date?: Date): Promise<any[]>;
    /**
     * Job seeker creates an interview request with required skills only.
     * No interviewer or time is selected at this stage.
     * Supports coupon-based free interviews.
     * Uses MongoDB transactions to ensure atomicity.
     */
    createInterviewRequest(data: {
        jobSeekerId: string;
        requestedSkills: string[];
        preferredDuration?: number;
        notes?: string;
        paymentId?: string;
        couponCode?: string;
    }): Promise<IInterviewDocument>;
    /**
     * Get available interview requests for an interviewer based on their expertise.
     * Only returns unclaimed (REQUESTED) interviews that match interviewer's skills.
     */
    getAvailableRequests(interviewerId: string, pagination?: PaginationQuery): Promise<{
        interviews: IInterviewDocument[];
        pagination: PaginationInfo;
    }>;
    /**
     * Interviewer claims an interview request and sets the schedule.
     * This transitions the interview from REQUESTED to SCHEDULED.
     */
    claimInterview(data: {
        interviewId: string;
        interviewerId: string;
        scheduledAt: Date;
        duration?: number;
    }): Promise<IInterviewDocument>;
    /**
     * Get all interview requests made by a job seeker (including unclaimed ones).
     */
    getJobSeekerRequests(jobSeekerId: string, pagination?: PaginationQuery): Promise<{
        interviews: IInterviewDocument[];
        pagination: PaginationInfo;
    }>;
    /**
     * Expire old interview requests (to be called by a cron job).
     */
    expireOldRequests(): Promise<number>;
}
declare const _default: InterviewService;
export default _default;
//# sourceMappingURL=interview.service.d.ts.map