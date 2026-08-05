import { z } from 'zod';
import { Role } from '../constants/roles';

const genderEnum = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
const skillLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
const uuid = z.string().uuid('Must be a valid UUID');

/* --------------------------- Params --------------------------- */

export const userIdParamSchema = z.object({
  id: uuid,
});

export const userIdParamsSchema = userIdParamSchema;

/* --------------------------- Body: update profile (PUT /me) --------------------------- */

export const socialLinksSchema = z
  .object({
    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
    leetcode: z.string().url().optional().or(z.literal('')),
    codeforces: z.string().url().optional().or(z.literal('')),
    hackerrank: z.string().url().optional().or(z.literal('')),
  })
  .partial();

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  level: skillLevelEnum.optional().default('beginner'),
});

export const educationSchema = z.object({
  college: z.string().min(1).max(200),
  branch: z.string().max(200).optional(),
  degree: z.string().max(200).optional(),
  startYear: z.number().int().min(1950).max(2100).optional(),
  endYear: z.number().int().min(1950).max(2100).optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1).max(200),
  designation: z.string().max(200).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  description: z.string().max(2000).optional(),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional().nullable(),
    bio: z.string().max(2000).optional().nullable(),
    gender: genderEnum.optional().nullable(),
    dateOfBirth: z.string().date().optional().nullable(),
    collegeId: uuid.optional().nullable(),
    branchId: uuid.optional().nullable(),
    batchId: uuid.optional().nullable(),
    socialLinks: socialLinksSchema.optional(),
    skills: z.array(skillSchema).max(30).optional(),
    education: z.array(educationSchema).max(20).optional(),
    experience: z.array(experienceSchema).max(20).optional(),
  })
  .strict();

/* --------------------------- Body: status / role --------------------------- */

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateRoleSchema = z.object({
  role: z.enum([Role.STUDENT, Role.MENTOR, Role.ADMIN]),
});

/* --------------------------- Query: list / search / pagination --------------------------- */

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'createdAt', 'profileCompletion'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  role: z.enum([Role.STUDENT, Role.MENTOR, Role.ADMIN]).optional(),
  collegeId: uuid.optional(),
  branchId: uuid.optional(),
  batchId: uuid.optional(),
});

export const searchQuerySchema = userListQuerySchema.extend({
  q: z.string().min(1).max(120).optional(),
});

/* --------------------------- Internal provisioning (Auth Service -> this service) --------------------------- */

export const provisionUserSchema = z.object({
  authUserId: uuid,
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum([Role.STUDENT, Role.MENTOR, Role.ADMIN]).optional(),
  isActive: z.boolean().optional().default(false),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
export type ProvisionUserInput = z.infer<typeof provisionUserSchema>;
