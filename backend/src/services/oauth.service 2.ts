import { User, JobSeekerProfile, InterviewerProfile } from '../models';
import { IUserDocument, UserRole, UserStatus } from '../types';
import { AppError } from '../utils/errors';
import redis from '../config/redis';
import logger from '../utils/logger';
import crypto from 'crypto';
import axios from 'axios';

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

class OAuthService {
  /**
   * Generate OAuth state parameter for CSRF protection
   */
  async generateState(userId?: string): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    const data = {
      state,
      userId,
      timestamp: Date.now(),
    };
    
    // Store state in Redis for 10 minutes
    await redis.setJSON(`oauth:state:${state}`, data, 600);
    return state;
  }

  /**
   * Verify OAuth state parameter
   */
  async verifyState(state: string): Promise<{ userId?: string }> {
    const data = await redis.getJSON<{ userId?: string; timestamp: number }>(`oauth:state:${state}`);
    
    if (!data) {
      throw new AppError('Invalid or expired OAuth state', 400);
    }

    // Delete state after verification (one-time use)
    await redis.del(`oauth:state:${state}`);
    
    return { userId: data.userId };
  }

  /**
   * Find or create user from OAuth profile
   */
  async findOrCreateOAuthUser(
    provider: 'google' | 'github' | 'linkedin',
    profile: OAuthProfile,
    tokens: OAuthTokens,
    linkUserId?: string
  ): Promise<{ user: IUserDocument; isNewUser: boolean }> {
    // If linking to existing account
    if (linkUserId) {
      return await this.linkOAuthProvider(linkUserId, provider, profile, tokens);
    }

    // Check if email is provided
    if (!profile.email) {
      throw new AppError(`Email not provided by ${provider}. Please grant email permission.`, 400);
    }

    // Check if user with this provider ID already exists
    const providerQuery = { [`authProviders.${provider}.id`]: profile.id };
    let user = await User.findOne(providerQuery);

    if (user) {
      // Update tokens if needed
      await this.updateOAuthTokens(user, provider, tokens);
      user.lastLogin = new Date();
      await user.save();
      
      return { user, isNewUser: false };
    }

    // Check if user with this email exists
    user = await User.findOne({ email: profile.email });

    if (user) {
      // Link OAuth provider to existing account
      return await this.linkOAuthProvider(user._id.toString(), provider, profile, tokens);
    }

    // Create new user
    const newUser = await User.create({
      email: profile.email,
      firstName: profile.firstName || 'User',
      lastName: profile.lastName || '',
      avatar: profile.avatar,
      isEmailVerified: profile.emailVerified || false,
      role: UserRole.JOB_SEEKER, // Default role
      status: UserStatus.ACTIVE,
      authProviders: {
        [provider]: {
          id: profile.id,
          ...(provider === 'google' && { 
            email: profile.email,
            refreshToken: tokens.refreshToken 
          }),
          ...(provider === 'github' && { 
            username: profile.username,
            accessToken: tokens.accessToken 
          }),
          ...(provider === 'linkedin' && { 
            accessToken: tokens.accessToken 
          }),
          linkedAt: new Date(),
        },
      },
    });

    // Create default job seeker profile
    await JobSeekerProfile.create({
      userId: newUser._id,
      interviewStats: {
        totalInterviews: 0,
        freeInterviewsUsed: 0,
        averageRating: 0,
      },
    });

    logger.info(`New user created via ${provider} OAuth`, {
      userId: newUser._id,
      email: newUser.email,
      provider,
    });

    return { user: newUser, isNewUser: true };
  }

  /**
   * Link OAuth provider to existing user account
   */
  async linkOAuthProvider(
    userId: string,
    provider: 'google' | 'github' | 'linkedin',
    profile: OAuthProfile,
    tokens: OAuthTokens
  ): Promise<{ user: IUserDocument; isNewUser: boolean }> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if provider is already linked
    if (user.authProviders && (user.authProviders as any)[provider]) {
      throw new AppError(`${provider} account is already linked to this user`, 400);
    }

    // Link provider
    user.authProviders = user.authProviders || {};
    (user.authProviders as any)[provider] = {
      id: profile.id,
      ...(provider === 'google' && { 
        email: profile.email,
        refreshToken: tokens.refreshToken 
      }),
      ...(provider === 'github' && { 
        username: profile.username,
        accessToken: tokens.accessToken 
      }),
      ...(provider === 'linkedin' && { 
        accessToken: tokens.accessToken 
      }),
      linkedAt: new Date(),
    };

    await user.save();

    logger.info(`${provider} OAuth linked to existing user`, {
      userId: user._id,
      email: user.email,
      provider,
    });

    return { user, isNewUser: false };
  }

  /**
   * Unlink OAuth provider from user account
   */
  async unlinkOAuthProvider(
    userId: string,
    provider: 'google' | 'github' | 'linkedin'
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if provider is linked
    if (!user.authProviders || !(user.authProviders as any)[provider]) {
      throw new AppError(`${provider} account is not linked`, 400);
    }

    // Prevent unlinking if it's the only auth method
    const hasPassword = !!user.password;
    const linkedProviders = Object.keys(user.authProviders || {}).filter(
      key => key !== 'local' && (user.authProviders as any)[key]
    );

    if (!hasPassword && linkedProviders.length === 1) {
      throw new AppError(
        'Cannot unlink. Please set a password first or link another account.',
        400
      );
    }

    // Unlink provider
    delete (user.authProviders as any)[provider];
    await user.save();

    logger.info(`${provider} OAuth unlinked from user`, {
      userId: user._id,
      email: user.email,
      provider,
    });
  }

  /**
   * Update OAuth tokens for existing user
   */
  private async updateOAuthTokens(
    user: IUserDocument,
    provider: 'google' | 'github' | 'linkedin',
    tokens: OAuthTokens
  ): Promise<void> {
    if (!user.authProviders || !(user.authProviders as any)[provider]) {
      return;
    }

    const providerData = (user.authProviders as any)[provider];

    if (provider === 'google' && tokens.refreshToken) {
      providerData.refreshToken = tokens.refreshToken;
    } else if (provider === 'github' && tokens.accessToken) {
      providerData.accessToken = tokens.accessToken;
    } else if (provider === 'linkedin' && tokens.accessToken) {
      providerData.accessToken = tokens.accessToken;
    }

    await user.save();
  }

  /**
   * Exchange Google authorization code for tokens and user info
   */
  async googleOAuth(code: string): Promise<{ profile: OAuthProfile; tokens: OAuthTokens }> {
    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, email, given_name, family_name, picture, verified_email } = userResponse.data;

      return {
        profile: {
          id,
          email,
          emailVerified: verified_email,
          firstName: given_name,
          lastName: family_name,
          avatar: picture,
        },
        tokens: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
        },
      };
    } catch (error: any) {
      logger.error('Google OAuth error:', error.response?.data || error.message);
      throw new AppError('Failed to authenticate with Google', 500);
    }
  }

  /**
   * Exchange GitHub authorization code for tokens and user info
   */
  async githubOAuth(code: string): Promise<{ profile: OAuthProfile; tokens: OAuthTokens }> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          code,
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      const { access_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, login, name, avatar_url } = userResponse.data;

      // Get primary email
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const primaryEmail = emailResponse.data.find((e: any) => e.primary);
      const email = primaryEmail?.email;
      const emailVerified = primaryEmail?.verified || false;

      const [firstName, ...lastNameParts] = (name || login).split(' ');

      return {
        profile: {
          id: id.toString(),
          email,
          emailVerified,
          firstName,
          lastName: lastNameParts.join(' '),
          avatar: avatar_url,
          username: login,
        },
        tokens: {
          accessToken: access_token,
        },
      };
    } catch (error: any) {
      logger.error('GitHub OAuth error:', error.response?.data || error.message);
      throw new AppError('Failed to authenticate with GitHub', 500);
    }
  }

  /**
   * Exchange LinkedIn authorization code for tokens and user info
   */
  async linkedinOAuth(code: string): Promise<{ profile: OAuthProfile; tokens: OAuthTokens }> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: process.env.LINKEDIN_CALLBACK_URL!,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const { access_token, expires_in } = tokenResponse.data;

      // Get user profile
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, localizedFirstName, localizedLastName } = profileResponse.data;

      // Get email
      const emailResponse = await axios.get(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const email = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress;

      // Get profile picture
      const pictureResponse = await axios.get(
        'https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const avatar = pictureResponse.data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;

      return {
        profile: {
          id,
          email,
          emailVerified: true, // LinkedIn emails are verified
          firstName: localizedFirstName,
          lastName: localizedLastName,
          avatar,
        },
        tokens: {
          accessToken: access_token,
          expiresIn: expires_in,
        },
      };
    } catch (error: any) {
      logger.error('LinkedIn OAuth error:', error.response?.data || error.message);
      throw new AppError('Failed to authenticate with LinkedIn', 500);
    }
  }
}

export default new OAuthService();
