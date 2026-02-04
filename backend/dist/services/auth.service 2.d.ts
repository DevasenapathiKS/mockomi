import { IUserDocument, UserRole } from '../types';
interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
}
interface LoginData {
    email: string;
    password: string;
}
interface AuthResponse {
    user: IUserDocument;
    accessToken: string;
    refreshToken: string;
}
declare class AuthService {
    register(data: RegisterData): Promise<AuthResponse>;
    login(data: LoginData): Promise<AuthResponse>;
    refreshToken(userId: string, oldRefreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken?: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    forgotPassword(email: string): Promise<{
        resetToken?: string;
        devMode?: boolean;
    }>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    getMe(userId: string): Promise<IUserDocument>;
    private createRoleProfile;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service%202.d.ts.map