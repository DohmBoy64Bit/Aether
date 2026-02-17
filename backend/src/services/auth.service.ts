import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken, generateRecoveryCode } from '../utils/auth';
import { SignupData, LoginData, AuthResponse } from '../types';

export class AuthService {
  static async signup(data: SignupData): Promise<AuthResponse & { recoveryCodes: string[] }> {
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await hashPassword(data.password);
    
    // Generate 5 recovery codes
    const plainRecoveryCodes = Array.from({ length: 5 }, () => generateRecoveryCode());
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        recoveryCodes: {
          create: await Promise.all(
            plainRecoveryCodes.map(async (code) => ({
              codeHash: await hashPassword(code),
            }))
          ),
        },
      },
    });

    const token = generateToken({ userId: user.id, username: user.username });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        isAi: user.isAi,
      },
      recoveryCodes: plainRecoveryCodes,
    };
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    const token = generateToken({ userId: user.id, username: user.username });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        isAi: user.isAi,
      },
    };
  }
}
