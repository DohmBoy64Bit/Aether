import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing! Please provide one in your .env file.');
}

// ─── Token Payload Type ──────────────────────────────────────────────────
// §3.4: Typed instead of `any`
export interface TokenPayload {
  userId: string;
  username: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * §6.4: Recovery codes are random, so SHA-256 is sufficient (no need for bcrypt).
 * Bcrypt is designed for password hashing where users pick weak passwords.
 * Recovery codes are cryptographically random 8-char hex strings.
 */
export const hashRecoveryCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

export const verifyRecoveryCode = (code: string, hash: string): boolean => {
  return hashRecoveryCode(code) === hash;
};

export const generateRecoveryCode = (): string => {
  return crypto.randomBytes(4).toString('hex'); // 8 characters
};
