import { eq, and, or, ilike, desc, asc, sql, count, SQL } from 'drizzle-orm';
import { db } from '../database/db';
import { users, socialLinks, skills, education, experience } from '../database/schema';
import {
  UserProfile,
  CreateUserDto,
  UpdateProfileDto,
  SearchUsersQuery,
  SocialLinks,
  Skill,
  Education,
  Experience,
  UserStatistics,
} from '../types';
import {
  PaginationQuery,
  getOffset,
  buildPaginationMeta,
  PaginatedResult,
  sanitizeSortColumn,
} from '../utils/pagination';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const FALLBACK_DIR = path.join(process.cwd(), 'tmp', 'database-fallback');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'user_profiles.json');

const loadFallback = (): any[] => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (!fs.existsSync(FALLBACK_FILE)) {
      // Seed default accounts
      const defaultProfiles = [
        {
          id: "11111111-aaaa-4111-8111-111111111111",
          authUserId: "11111111-1111-4111-8111-111111111111",
          firstName: "Sarah",
          lastName: "Connor",
          email: "admin@devbattles.io",
          phone: null,
          avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
          bio: "DevBattles Platform Architect & Global Super Administrator.",
          gender: "female",
          dateOfBirth: "1995-10-25",
          role: "admin",
          collegeId: null,
          branchId: null,
          batchId: null,
          profileCompletion: 80,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          socialLinks: {
            github: "https://github.com/devbattles-admin",
            linkedin: "https://linkedin.com/in/sarah",
            portfolio: null,
            leetcode: null,
            codeforces: null,
            hackerrank: null
          },
          skills: [
            { id: "sk-1", name: "System Architecture", level: "expert" },
            { id: "sk-2", name: "Go", level: "advanced" }
          ],
          education: [],
          experience: []
        },
        {
          id: "22222222-aaaa-4222-8222-222222222222",
          authUserId: "22222222-2222-4222-8222-222222222222",
          firstName: "Aarav",
          lastName: "Patel",
          email: "aarav.patel@krmangalam.edu.in",
          phone: "+919876543210",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          bio: "Fullstack Dev & DSA enthusiast. Building high performance web apps.",
          gender: "male",
          dateOfBirth: "2004-03-12",
          role: "student",
          collegeId: null,
          branchId: null,
          batchId: null,
          profileCompletion: 95,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          socialLinks: {
            github: "https://github.com/aaravpatel-dev",
            linkedin: "https://linkedin.com/in/aarav",
            portfolio: null,
            leetcode: "https://leetcode.com/aarav",
            codeforces: null,
            hackerrank: null
          },
          skills: [
            { id: "sk-3", name: "React", level: "advanced" },
            { id: "sk-4", name: "Algorithms", level: "intermediate" }
          ],
          education: [
            {
              id: "ed-1",
              college: "KR Mangalam University",
              branch: "CSE",
              degree: "B.Tech",
              startYear: 2022,
              endYear: 2026
            }
          ],
          experience: []
        },
        {
          id: "33333333-aaaa-4333-8333-333333333333",
          authUserId: "33333333-3333-4333-8333-333333333333",
          firstName: "Rajesh",
          lastName: "Sharma",
          email: "rajesh.sharma@krmangalam.edu.in",
          phone: null,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          bio: "Professor and mentor.",
          gender: "male",
          dateOfBirth: null,
          role: "mentor",
          collegeId: null,
          branchId: null,
          batchId: null,
          profileCompletion: 70,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          socialLinks: {
            github: "https://github.com/rsharma-prof",
            linkedin: "https://linkedin.com/in/rajesh",
            portfolio: null,
            leetcode: null,
            codeforces: null,
            hackerrank: null
          },
          skills: [
            { id: "sk-5", name: "Distributed Systems", level: "expert" }
          ],
          education: [],
          experience: [
            {
              id: "ex-1",
              company: "Amazon",
              designation: "Senior SDE",
              startDate: "2018-01-01",
              endDate: "2023-01-01",
              description: "Built large-scale notifications platform."
            }
          ]
        }
      ];
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(defaultProfiles, null, 2), 'utf8');
      return defaultProfiles;
    }
    const content = fs.readFileSync(FALLBACK_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading user fallback:', error);
    return [];
  }
};

const saveFallback = (profiles: any[]) => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving user fallback:', error);
  }
};

const SORTABLE_COLUMNS = ['firstName', 'lastName', 'email', 'createdAt', 'profileCompletion'];

const mapProfile = (row: any): UserProfile => ({
  id: row.id,
  authUserId: row.authUserId,
  firstName: row.firstName,
  lastName: row.lastName,
  email: row.email,
  phone: row.phone ?? null,
  avatarUrl: row.avatarUrl ?? null,
  bio: row.bio ?? null,
  gender: row.gender ?? null,
  dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth).toISOString().slice(0, 10) : null,
  role: row.role,
  collegeId: row.collegeId ?? null,
  branchId: row.branchId ?? null,
  batchId: row.batchId ?? null,
  profileCompletion: row.profileCompletion,
  isActive: row.isActive,
  createdAt: new Date(row.createdAt).toISOString(),
  updatedAt: new Date(row.updatedAt).toISOString(),
  socialLinks: row.socialLinks
    ? {
        github: row.socialLinks.github ?? null,
        linkedin: row.socialLinks.linkedin ?? null,
        portfolio: row.socialLinks.portfolio ?? null,
        leetcode: row.socialLinks.leetcode ?? null,
        codeforces: row.socialLinks.codeforces ?? null,
        hackerrank: row.socialLinks.hackerrank ?? null,
      }
    : null,
  skills: Array.isArray(row.skills)
    ? row.skills.map((s: any) => ({ id: s.id, name: s.name, level: s.level }))
    : undefined,
  education: Array.isArray(row.education)
    ? row.education.map((e: any) => ({
        id: e.id,
        college: e.college,
        branch: e.branch ?? null,
        degree: e.degree ?? null,
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
      }))
    : undefined,
  experience: Array.isArray(row.experience)
    ? row.experience.map((x: any) => ({
        id: x.id,
        company: x.company,
        designation: x.designation ?? null,
        startDate: x.startDate ? new Date(x.startDate).toISOString().slice(0, 10) : null,
        endDate: x.endDate ? new Date(x.endDate).toISOString().slice(0, 10) : null,
        description: x.description ?? null,
      }))
    : undefined,
});

const withRelations = {
  socialLinks: true,
  skills: true,
  education: true,
  experience: true,
} as const;

export class UserRepository {
  /** Create the profile row when the Auth Service provisions a new account. */
  async create(dto: CreateUserDto): Promise<UserProfile> {
    try {
      const [row] = await db
        .insert(users)
        .values({
          authUserId: dto.authUserId,
          email: dto.email,
          firstName: dto.firstName ?? '',
          lastName: dto.lastName ?? '',
          role: dto.role ?? 'student',
          isActive: dto.isActive ?? false,
        })
        .returning();
      return mapProfile(row);
    } catch (err) {
      const list = loadFallback();
      const newUser = {
        id: crypto.randomUUID(),
        authUserId: dto.authUserId,
        firstName: dto.firstName ?? '',
        lastName: dto.lastName ?? '',
        email: dto.email,
        phone: null,
        avatarUrl: null,
        bio: null,
        gender: null,
        dateOfBirth: null,
        role: dto.role ?? 'student',
        collegeId: null,
        branchId: null,
        batchId: null,
        profileCompletion: 15,
        isActive: dto.isActive ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        socialLinks: {
          github: null,
          linkedin: null,
          portfolio: null,
          leetcode: null,
          codeforces: null,
          hackerrank: null
        },
        skills: [],
        education: [],
        experience: []
      };
      list.push(newUser);
      saveFallback(list);
      return newUser as any;
    }
  }

  async findByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    try {
      const row = await db.query.users.findFirst({
        where: eq(users.authUserId, authUserId),
        with: withRelations,
      });
      return row ? mapProfile(row) : null;
    } catch (err) {
      const list = loadFallback();
      return list.find((u) => u.authUserId === authUserId) || null;
    }
  }

  async findById(id: string): Promise<UserProfile | null> {
    try {
      const row = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: withRelations,
      });
      return row ? mapProfile(row) : null;
    } catch (err) {
      const list = loadFallback();
      return list.find((u) => u.id === id) || null;
    }
  }

  async update(id: string, patch: Partial<UpdateProfileDto>): Promise<UserProfile | null> {
    try {
      const [row] = await db
        .update(users)
        .set({ ...patch, updatedAt: new Date() } as any)
        .where(eq(users.id, id))
        .returning();
      return row ? mapProfile(row) : null;
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      list[idx] = {
        ...list[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      saveFallback(list);
      return list[idx];
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const [row] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return Boolean(row);
    } catch (err) {
      const list = loadFallback();
      const filtered = list.filter((u) => u.id !== id);
      if (filtered.length === list.length) return false;
      saveFallback(filtered);
      return true;
    }
  }

  /** Paginated, filtered, sorted listing (used by /users and /users/search). */
  async findMany(query: SearchUsersQuery & PaginationQuery): Promise<PaginatedResult<UserProfile>> {
    try {
      const conditions: SQL[] = [];

      if (query.q) {
        const term = `%${query.q}%`;
        conditions.push(
          or(ilike(users.firstName, term), ilike(users.lastName, term), ilike(users.email, term))!,
        );
      }
      if (query.role) conditions.push(eq(users.role, query.role));
      if (query.collegeId) conditions.push(eq(users.collegeId, query.collegeId));
      if (query.branchId) conditions.push(eq(users.branchId, query.branchId));
      if (query.batchId) conditions.push(eq(users.batchId, query.batchId));

      const where = conditions.length ? and(...conditions) : undefined;
      const sortColumn = sanitizeSortColumn(query.sortBy, SORTABLE_COLUMNS, 'createdAt');
      const orderFn = query.sortOrder === 'asc' ? asc : desc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderExpr = (users as any)[sortColumn];

      const [rows, totalResult] = await Promise.all([
        db.query.users.findMany({
          where,
          orderBy: orderFn(orderExpr),
          limit: query.limit,
          offset: getOffset(query.page, query.limit),
        }),
        db.select({ value: count() }).from(users).where(where),
      ]);

      const items = rows.map((r) => mapProfile(r));
      return {
        items,
        pagination: buildPaginationMeta(totalResult[0].value, query.page, query.limit),
      };
    } catch (err) {
      let list = loadFallback();
      if (query.q) {
        const q = query.q.toLowerCase();
        list = list.filter((u) => 
          (u.firstName && u.firstName.toLowerCase().includes(q)) ||
          (u.lastName && u.lastName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
        );
      }
      if (query.role) list = list.filter((u) => u.role === query.role);
      if (query.collegeId) list = list.filter((u) => u.collegeId === query.collegeId);
      if (query.branchId) list = list.filter((u) => u.branchId === query.branchId);
      if (query.batchId) list = list.filter((u) => u.batchId === query.batchId);

      const total = list.length;
      
      // Sort
      const sortCol = sanitizeSortColumn(query.sortBy, SORTABLE_COLUMNS, 'createdAt');
      const order = query.sortOrder || 'desc';
      list.sort((a, b) => {
        const valA = a[sortCol] ?? '';
        const valB = b[sortCol] ?? '';
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });

      // Paginate
      const page = query.page || 1;
      const limit = query.limit || 10;
      const offset = getOffset(page, limit);
      const items = list.slice(offset, offset + limit);

      return {
        items,
        pagination: buildPaginationMeta(total, page, limit),
      };
    }
  }

  async existsByAuthUserId(authUserId: string): Promise<boolean> {
    try {
      const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.authUserId, authUserId))
        .limit(1);
      return Boolean(row);
    } catch (err) {
      const list = loadFallback();
      return list.some((u) => u.authUserId === authUserId);
    }
  }

  async existsByEmail(email: string, exceptAuthUserId?: string): Promise<boolean> {
    try {
      const conditions = [ilike(users.email, email)];
      if (exceptAuthUserId) conditions.push(sql`${users.authUserId} <> ${exceptAuthUserId}`);
      const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(...conditions))
        .limit(1);
      return Boolean(row);
    } catch (err) {
      const list = loadFallback();
      return list.some((u) => 
        u.email.toLowerCase() === email.toLowerCase() && 
        (!exceptAuthUserId || u.authUserId !== exceptAuthUserId)
      );
    }
  }

  /* --------------------------- Sub-entities --------------------------- */

  async upsertSocialLinks(userId: string, data: SocialLinks): Promise<void> {
    try {
      await db.delete(socialLinks).where(eq(socialLinks.userId, userId));
      await db.insert(socialLinks).values({
        userId,
        github: data.github ?? null,
        linkedin: data.linkedin ?? null,
        portfolio: data.portfolio ?? null,
        leetcode: data.leetcode ?? null,
        codeforces: data.codeforces ?? null,
        hackerrank: data.hackerrank ?? null,
      });
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        list[idx].socialLinks = {
          github: data.github ?? null,
          linkedin: data.linkedin ?? null,
          portfolio: data.portfolio ?? null,
          leetcode: data.leetcode ?? null,
          codeforces: data.codeforces ?? null,
          hackerrank: data.hackerrank ?? null,
        };
        saveFallback(list);
      }
    }
  }

  async replaceSkills(
    userId: string,
    items: Array<{ name: string; level?: Skill['level'] }>,
  ): Promise<void> {
    try {
      await db.delete(skills).where(eq(skills.userId, userId));
      if (items.length) {
        await db
          .insert(skills)
          .values(items.map((s) => ({ userId, name: s.name, level: s.level ?? 'beginner' })));
      }
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        list[idx].skills = items.map((s, i) => ({
          id: `sk-${i + 1}`,
          name: s.name,
          level: s.level ?? 'beginner'
        }));
        saveFallback(list);
      }
    }
  }

  async replaceEducation(userId: string, items: Array<Omit<Education, 'id'>>): Promise<void> {
    try {
      await db.delete(education).where(eq(education.userId, userId));
      if (items.length) {
        await db.insert(education).values(
          items.map((e) => ({
            userId,
            college: e.college,
            branch: e.branch ?? null,
            degree: e.degree ?? null,
            startYear: e.startYear ?? null,
            endYear: e.endYear ?? null,
          })),
        );
      }
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        list[idx].education = items.map((e, i) => ({
          id: `ed-${i + 1}`,
          college: e.college,
          branch: e.branch ?? null,
          degree: e.degree ?? null,
          startYear: e.startYear ?? null,
          endYear: e.endYear ?? null
        }));
        saveFallback(list);
      }
    }
  }

  async replaceExperience(userId: string, items: Array<Omit<Experience, 'id'>>): Promise<void> {
    try {
      await db.delete(experience).where(eq(experience.userId, userId));
      if (items.length) {
        await db.insert(experience).values(
          items.map((x) => ({
            userId,
            company: x.company,
            designation: x.designation ?? null,
            startDate: x.startDate ? new Date(x.startDate).toISOString().slice(0, 10) : null,
            endDate: x.endDate ? new Date(x.endDate).toISOString().slice(0, 10) : null,
            description: x.description ?? null,
          })),
        );
      }
    } catch (err) {
      const list = loadFallback();
      const idx = list.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        list[idx].experience = items.map((x, i) => ({
          id: `ex-${i + 1}`,
          company: x.company,
          designation: x.designation ?? null,
          startDate: x.startDate ?? null,
          endDate: x.endDate ?? null,
          description: x.description ?? null
        }));
        saveFallback(list);
      }
    }
  }

  /* ----------------------------- Statistics --------------------------- */

  async getStatistics(): Promise<UserStatistics> {
    try {
      const [total, active, students, mentors, admins] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(users).where(eq(users.isActive, true)),
        db.select({ value: count() }).from(users).where(eq(users.role, 'student')),
        db.select({ value: count() }).from(users).where(eq(users.role, 'mentor')),
        db.select({ value: count() }).from(users).where(eq(users.role, 'admin')),
      ]);

      const totalCount = Number(total[0].value);
      const activeCount = Number(active[0].value);
      return {
        total: totalCount,
        active: activeCount,
        inactive: totalCount - activeCount,
        students: Number(students[0].value),
        mentors: Number(mentors[0].value),
        admins: Number(admins[0].value),
      };
    } catch (err) {
      const list = loadFallback();
      const total = list.length;
      const active = list.filter((u) => u.isActive).length;
      const students = list.filter((u) => u.role === 'student').length;
      const mentors = list.filter((u) => u.role === 'mentor').length;
      const admins = list.filter((u) => u.role === 'admin').length;
      return {
        total,
        active,
        inactive: total - active,
        students,
        mentors,
        admins
      };
    }
  }
}

export const userRepository = new UserRepository();
