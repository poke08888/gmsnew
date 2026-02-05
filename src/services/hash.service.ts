import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { connectDB } from '~/libs/db';
import { User } from '~/models/user.model';
const SALT_ROUNDS = 12;
const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY);


/**
 * Hashes a password using bcrypt.
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch {
    throw new Error('Error hashing password');
  }
}

/**
 * Verifies a password against a hash using bcrypt.
 * @param password - The plain text password to verify.
 * @param hash - The hashed password to compare against.
 * @returns A promise that resolves to true if the password matches, false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch {
    throw new Error('Error verifying password');
  }
}

export async function generateJWT(payload: any, expiresIn: string | number = '1h'): Promise<string> {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(expiresIn)
        .sign(SECRET_KEY);
    return jwt;
}

export async function verifyJWT(token: string): Promise<any | false> {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      await connectDB();
      const user = await User.findOne({ username: payload.username as string }).lean();
      if (!user) {
        return false;
      }
      return user;
    } catch {
        return false;
    }
}