import { IUserDocument } from '../types';
interface OAuthProfile {
    id: string;
    email?: string;
    emailVerified?: boolean;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    username?: string;
}
interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}
declare class OAuthService {
    /**
     * Generate OAuth state parameter for CSRF protection
     */
    generateState(userId?: string): Promise<string>;
    /**
     * Verify OAuth state parameter
     */
    verifyState(state: string): Promise<{
        userId?: string;
    }>;
    /**
     * Find or create user from OAuth profile
     */
    findOrCreateOAuthUser(provider: 'google' | 'github' | 'linkedin', profile: OAuthProfile, tokens: OAuthTokens, linkUserId?: string): Promise<{
        user: IUserDocument;
        isNewUser: boolean;
    }>;
    /**
     * Link OAuth provider to existing user account
     */
    linkOAuthProvider(userId: string, provider: 'google' | 'github' | 'linkedin', profile: OAuthProfile, tokens: OAuthTokens): Promise<{
        user: IUserDocument;
        isNewUser: boolean;
    }>;
    /**
     * Unlink OAuth provider from user account
     */
    unlinkOAuthProvider(userId: string, provider: 'google' | 'github' | 'linkedin'): Promise<void>;
    /**
     * Update OAuth tokens for existing user
     */
    private updateOAuthTokens;
    /**
     * Exchange Google authorization code for tokens and user info
     */
    googleOAuth(code: string): Promise<{
        profile: OAuthProfile;
        tokens: OAuthTokens;
    }>;
    /**
     * Exchange GitHub authorization code for tokens and user info
     */
    githubOAuth(code: string): Promise<{
        profile: OAuthProfile;
        tokens: OAuthTokens;
    }>;
    /**
     * Exchange LinkedIn authorization code for tokens and user info
     */
    linkedinOAuth(code: string): Promise<{
        profile: OAuthProfile;
        tokens: OAuthTokens;
    }>;
}
declare const _default: OAuthService;
export default _default;
//# sourceMappingURL=oauth.service.d.ts.map