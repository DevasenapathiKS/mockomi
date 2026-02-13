import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { User } from '../models/User';
import type { UserRole } from '../models/User';

import { AppError } from '../../../core/error';
import { config } from '../../../config/env';

type RegisterInput = {
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthTokenPayload = JwtPayload & {
  userId: string;
  role: UserRole;
};

export class AuthService {
  public async register(input: RegisterInput): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();

    const existing = await User.findOne({ email }).exec();
    if (existing) {
      throw new AppError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'candidate',
    });

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  public async login(
    input: LoginInput,
  ): Promise<{ token: string; user: PublicUser }> {
    const email = input.email.trim().toLowerCase();

    const user = await User.findOne({ email }).exec();
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  public verifyToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);

      if (typeof decoded === 'string' || !decoded) {
        throw new AppError('Invalid token', 401);
      }

      const payload = decoded as JwtPayload;
      const userId = payload.userId;
      const role = payload.role;

      if (typeof userId !== 'string') {
        throw new AppError('Invalid token', 401);
      }
      if (role !== 'candidate' && role !== 'interviewer' && role !== 'admin') {
        throw new AppError('Invalid token', 401);
      }

      return decoded as AuthTokenPayload;
    } catch (_error: unknown) {
      throw new AppError('Invalid token', 401);
    }
  }
}

