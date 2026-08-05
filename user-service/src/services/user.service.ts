import {
  UserProfile,
  CreateUserDto,
  UpdateProfileDto,
  UserStatistics,
  SocialLinks,
  Skill,
  Education,
  Experience,
} from '../types';
import { Role } from '../constants/roles';
import { PaginatedResult } from '../utils/pagination';
import { ApiError } from '../utils/error';
import { Messages } from '../constants/messages';
import { userRepository } from '../repositories/user.repository';
import { saveAvatar, removeAvatar } from '../utils/fileUpload';
import { config } from '../config/env';
import logger from '../utils/logger';

/** Abstraction so the service can be unit-tested with a mock repository. */
export interface IUserRepository {
  create(dto: CreateUserDto): Promise<UserProfile>;
  findByAuthUserId(authUserId: string): Promise<UserProfile | null>;
  findById(id: string): Promise<UserProfile | null>;
  update(id: string, patch: Partial<UpdateProfileDto>): Promise<UserProfile | null>;
  delete(id: string): Promise<boolean>;
  findMany(query: any): Promise<PaginatedResult<UserProfile>>;
  existsByAuthUserId(authUserId: string): Promise<boolean>;
  existsByEmail(email: string, exceptAuthUserId?: string): Promise<boolean>;
  upsertSocialLinks(userId: string, data: SocialLinks): Promise<void>;
  replaceSkills(
    userId: string,
    items: Array<{ name: string; level?: Skill['level'] }>,
  ): Promise<void>;
  replaceEducation(userId: string, items: Array<Omit<Education, 'id'>>): Promise<void>;
  replaceExperience(userId: string, items: Array<Omit<Experience, 'id'>>): Promise<void>;
  getStatistics(): Promise<UserStatistics>;
}

/**
 * Weighted profile-completion score (0-100). Recomputed whenever the profile
 * or any sub-entity changes so the field stays authoritative.
 */
const computeProfileCompletion = (p: Partial<UserProfile>): number => {
  let score = 0;
  if (p.firstName && p.lastName) score += 10;
  if (p.email) score += 5;
  if (p.phone) score += 10;
  if (p.avatarUrl) score += 10;
  if (p.bio && p.bio.length >= 10) score += 15;
  if (p.gender) score += 5;
  if (p.dateOfBirth) score += 5;
  if (p.collegeId) score += 5;
  if (p.skills && p.skills.length > 0) score += 10;
  if (p.education && p.education.length > 0) score += 10;
  if (p.experience && p.experience.length > 0) score += 10;
  if (p.socialLinks && Object.values(p.socialLinks).some((v) => v)) score += 5;
  return Math.min(100, score);
};

export class UserService {
  constructor(private readonly repository: IUserRepository = userRepository) {}

  private async syncAuthAccount(
    authUserId: string,
    field: 'role' | 'status',
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (config.isTest) return;

    try {
      const res = await fetch(`${config.authServiceUrl}/api/v1/internal/users/${authUserId}/${field}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': config.internalApiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text();
        logger.error('Auth Service synchronization failed', {
          authUserId,
          field,
          status: res.status,
          detail,
        });
        throw ApiError.internal(Messages.AUTH_SYNC_FAILED, 'AUTH_SYNC_FAILED');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error('Auth Service synchronization error', {
        authUserId,
        field,
        error: err instanceof Error ? err.message : err,
      });
      throw ApiError.internal(Messages.AUTH_SYNC_FAILED, 'AUTH_SYNC_FAILED');
    }
  }

  /* ----------------------------- Self (Me) ----------------------------- */

  async getMe(authUserId: string): Promise<UserProfile> {
    const user = await this.repository.findByAuthUserId(authUserId);
    if (!user) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    if (!user.isActive) throw ApiError.forbidden(Messages.FORBIDDEN, 'ACCOUNT_INACTIVE');
    return user;
  }

  async updateMe(authUserId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const current = await this.repository.findByAuthUserId(authUserId);
    if (!current) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    if (dto.email && dto.email.toLowerCase() !== current.email.toLowerCase()) {
      const taken = await this.repository.existsByEmail(dto.email, authUserId);
      if (taken) throw ApiError.conflict(Messages.EMAIL_TAKEN, 'EMAIL_TAKEN');
    }

    // Persist base columns
    const basePatch: Partial<UpdateProfileDto> = { ...dto };
    delete (basePatch as any).socialLinks;
    delete (basePatch as any).skills;
    delete (basePatch as any).education;
    delete (basePatch as any).experience;

    let updated = (await this.repository.update(current.id, basePatch)) ?? current;

    // Persist sub-entities
    if (dto.socialLinks) await this.repository.upsertSocialLinks(current.id, dto.socialLinks);
    if (dto.skills) await this.repository.replaceSkills(current.id, dto.skills);
    if (dto.education) await this.repository.replaceEducation(current.id, dto.education);
    if (dto.experience) await this.repository.replaceExperience(current.id, dto.experience);

    // Recompute completion from the freshest snapshot
    const refreshed = await this.repository.findById(current.id);
    if (refreshed) {
      const completion = computeProfileCompletion(refreshed);
      updated =
        (await this.repository.update(current.id, { profileCompletion: completion } as any)) ??
        refreshed;
    }

    return updated;
  }

  /* --------------------------- Avatar --------------------------- */

  async uploadAvatar(
    authUserId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<UserProfile> {
    const current = await this.repository.findByAuthUserId(authUserId);
    if (!current) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    const url = await saveAvatar(file.buffer, file.mimetype);
    const previous = current.avatarUrl ?? null;

    let updated = (await this.repository.update(current.id, { avatarUrl: url } as any)) ?? current;
    if (previous && previous !== url) await removeAvatar(previous).catch(() => undefined);

    const completion = computeProfileCompletion({ ...updated, avatarUrl: url });
    updated =
      (await this.repository.update(current.id, { profileCompletion: completion } as any)) ??
      updated;
    return updated;
  }

  async deleteAvatar(authUserId: string): Promise<UserProfile> {
    const current = await this.repository.findByAuthUserId(authUserId);
    if (!current) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    const previous = current.avatarUrl ?? null;
    let updated = (await this.repository.update(current.id, { avatarUrl: null } as any)) ?? current;
    if (previous) await removeAvatar(previous).catch(() => undefined);

    const completion = computeProfileCompletion({ ...updated, avatarUrl: null });
    updated =
      (await this.repository.update(current.id, { profileCompletion: completion } as any)) ??
      updated;
    return updated;
  }

  /* --------------------------- Admin / Mentor reads --------------------------- */

  async getById(id: string): Promise<UserProfile> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    return user;
  }

  async list(query: any): Promise<PaginatedResult<UserProfile>> {
    return this.repository.findMany(query);
  }

  async search(query: any): Promise<PaginatedResult<UserProfile>> {
    return this.repository.findMany(query);
  }

  async statistics(): Promise<UserStatistics> {
    return this.repository.getStatistics();
  }

  /* --------------------------- Admin mutations --------------------------- */

  async deleteUser(id: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    if (user.avatarUrl) await removeAvatar(user.avatarUrl).catch(() => undefined);
    await this.repository.delete(id);
  }

  async changeStatus(id: string, isActive: boolean): Promise<UserProfile> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    const updated = await this.repository.update(id, { isActive } as any);
    if (!updated) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    await this.syncAuthAccount(user.authUserId, 'status', { isActive });
    return updated;
  }

  async changeRole(id: string, role: Role): Promise<UserProfile> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    const updated = await this.repository.update(id, { role } as any);
    if (!updated) throw ApiError.notFound(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');

    await this.syncAuthAccount(user.authUserId, 'role', { role });
    return updated;
  }

  /** Provisioned by the Auth Service when a new account is created. Idempotent. */
  async provision(dto: CreateUserDto): Promise<UserProfile> {
    const exists = await this.repository.existsByAuthUserId(dto.authUserId);
    if (exists) {
      const existing = await this.repository.findByAuthUserId(dto.authUserId);
      if (existing) return existing;
    }
    return this.repository.create(dto);
  }
}

export const userService = new UserService();
