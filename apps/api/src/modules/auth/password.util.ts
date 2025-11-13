import * as bcrypt from 'bcryptjs';

/**
 * Hash a plain text password using bcryptjs
 * @param plainPassword The plain text password
 * @returns Promise<string> The hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Verify a plain text password against a hash
 * @param plainPassword The plain text password to verify
 * @param hash The hashed password to compare against
 * @returns Promise<boolean> True if passwords match
 */
export async function verifyPassword(
  plainPassword: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
