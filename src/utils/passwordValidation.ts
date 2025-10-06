import { z } from 'zod';

// Strict password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(15, 'Password must not exceed 15 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');

export const PASSWORD_REQUIREMENTS = [
  'Minimum 8 characters, maximum 15 characters',
  'At least one uppercase letter (A-Z)',
  'At least one lowercase letter (a-z)',
  'At least one number (0-9)',
  'At least one special character (!@#$%^&*(),.?":{}|<>)',
];

export const PASSWORD_EXPIRY_DAYS = 90; // 3 months

export const isPasswordExpired = (lastPasswordChange: string | null): boolean => {
  if (!lastPasswordChange) return false;
  
  const lastChange = new Date(lastPasswordChange);
  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceChange >= PASSWORD_EXPIRY_DAYS;
};

export const getDaysUntilExpiry = (lastPasswordChange: string | null): number => {
  if (!lastPasswordChange) return PASSWORD_EXPIRY_DAYS;
  
  const lastChange = new Date(lastPasswordChange);
  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, PASSWORD_EXPIRY_DAYS - daysSinceChange);
};
