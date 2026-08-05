import { Role } from '../constants/roles';

/* ----------------------------- Sub-entities ----------------------------- */

export interface SocialLinks {
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  leetcode?: string | null;
  codeforces?: string | null;
  hackerrank?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  level: SkillLevel;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Education {
  id: string;
  college: string;
  branch?: string | null;
  degree?: string | null;
  startYear?: number | null;
  endYear?: number | null;
}

export interface Experience {
  id: string;
  company: string;
  designation?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

/* ----------------------------- Aggregate ------------------------------- */

export interface UserProfile {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  role: Role;
  collegeId?: string | null;
  branchId?: string | null;
  batchId?: string | null;
  profileCompletion: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  socialLinks?: SocialLinks | null;
  skills?: Skill[];
  education?: Education[];
  experience?: Experience[];
}

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/* --------------------------- DTOs (input) ------------------------------ */

export interface CreateUserDto {
  authUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  collegeId?: string | null;
  branchId?: string | null;
  batchId?: string | null;
  socialLinks?: SocialLinks;
  skills?: Array<{ name: string; level?: SkillLevel }>;
  education?: Array<Omit<Education, 'id'>>;
  experience?: Array<Omit<Experience, 'id'>>;
}

export interface UpdateRoleDto {
  role: Role;
}

export interface UpdateStatusDto {
  isActive: boolean;
}

export interface SearchUsersQuery {
  q?: string;
  role?: Role;
  collegeId?: string;
  branchId?: string;
  batchId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserStatistics {
  total: number;
  students: number;
  mentors: number;
  admins: number;
  active: number;
  inactive: number;
}
