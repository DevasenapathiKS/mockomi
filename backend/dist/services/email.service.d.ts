declare class EmailService {
    private transporter;
    private isConfigured;
    constructor();
    sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendInterviewConfirmationEmail(email: string, name: string, interviewDetails: {
        type: string;
        date: Date;
        interviewer?: string;
    }): Promise<void>;
    private getPasswordResetTemplate;
    private getWelcomeTemplate;
    private getInterviewConfirmationTemplate;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=email.service.d.ts.map