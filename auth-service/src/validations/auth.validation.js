// ===========================================
// Zod Validation Schemas
// ===========================================

import { z } from 'zod';

import { ROLES, ALL_ROLES, PASSWORD_POLICY } from '../constants/index.js';

/**
 * Password validation schema with policy enforcement.
 */
const passwordSchema = z
  .string()
  .min(
    PASSWORD_POLICY.MIN_LENGTH,
    `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`,
  )
  .max(
    PASSWORD_POLICY.MAX_LENGTH,
    `Password must not exceed ${PASSWORD_POLICY.MAX_LENGTH} characters`,
  )
  .regex(PASSWORD_POLICY.REGEX, PASSWORD_POLICY.REGEX_DESCRIPTION);

/**
 * Email validation schema.
 */
const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .transform((val) => val.toLowerCase().trim());

/**
 * Name validation schema.
 */
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(255, 'Name must not exceed 255 characters')
  .trim();

/**
 * Role validation schema. Public registration intentionally excludes `admin` to
 * prevent privilege escalation through the unauthenticated API.
 */
const roleSchema = z.enum(ALL_ROLES, {
  errorMap: () => ({ message: `Role must be one of: ${ALL_ROLES.join(', ')}` }),
});

const publicRegistrationRoles = [ROLES.STUDENT, ROLES.MENTOR];
const publicRegisterRoleSchema = z.enum(publicRegistrationRoles, {
  errorMap: () => ({
    message: `Role must be one of: ${publicRegistrationRoles.join(', ')}`,
  }),
});

/**
 * Registration request body schema.
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: publicRegisterRoleSchema.optional().default(ROLES.STUDENT),
});

/**
 * Login request body schema.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Forgot password request body schema.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password request body schema.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Change password request body schema.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

/**
 * Verify email request body schema.
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Resend verification email request body schema.
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

/**
 * Refresh token request body schema (optional body, can also come from cookie).
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

/**
 * UUID parameter schema.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const updateInternalRoleSchema = z.object({
  role: roleSchema,
});

export const updateInternalStatusSchema = z.object({
  isActive: z.boolean(),
});
