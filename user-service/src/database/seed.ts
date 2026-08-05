import { Pool } from 'pg';
import { config } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { Role } from '../constants/roles';
import logger from '../utils/logger';

/**
 * Seeds demo profiles so the service is usable immediately after migration.
 * Run: npm run db:seed   (or npm run db:seed -- --reset to wipe first)
 */
const DEMO_USERS = [
  {
    authUserId: '11111111-1111-4111-8111-111111111111',
    email: 'admin@devbattles.io',
    firstName: 'Sarah',
    lastName: 'Connor',
    role: Role.ADMIN,
    skills: [
      { name: 'System Architecture', level: 'expert' as const },
      { name: 'Go', level: 'advanced' as const },
    ],
    socialLinks: {
      github: 'https://github.com/devbattles-admin',
      linkedin: 'https://linkedin.com/in/sarah',
    },
  },
  {
    authUserId: '22222222-2222-4222-8222-222222222222',
    email: 'aarav.patel@krmangalam.edu.in',
    firstName: 'Aarav',
    lastName: 'Patel',
    role: Role.STUDENT,
    skills: [
      { name: 'React', level: 'advanced' as const },
      { name: 'Algorithms', level: 'intermediate' as const },
    ],
    education: [
      {
        college: 'KR Mangalam University',
        branch: 'CSE',
        degree: 'B.Tech',
        startYear: 2022,
        endYear: 2026,
      },
    ],
    socialLinks: {
      github: 'https://github.com/aaravpatel-dev',
      leetcode: 'https://leetcode.com/aarav',
    },
  },
  {
    authUserId: '33333333-3333-4333-8333-333333333333',
    email: 'rajesh.sharma@krmangalam.edu.in',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    role: Role.MENTOR,
    skills: [{ name: 'Distributed Systems', level: 'expert' as const }],
    experience: [
      {
        company: 'Amazon',
        designation: 'Senior SDE',
        startDate: '2018-01-01',
        endDate: '2023-01-01',
        description: 'Built large-scale notifications platform.',
      },
    ],
    socialLinks: {
      github: 'https://github.com/rsharma-prof',
      linkedin: 'https://linkedin.com/in/rajesh',
    },
  },
];

const run = async (): Promise<void> => {
  const pool = new Pool({ connectionString: config.databaseUrl });

  if (process.argv.includes('--reset')) {
    logger.info('Resetting user data...');
    await pool.query(
      'TRUNCATE users, social_links, skills, education, experience RESTART IDENTITY CASCADE;',
    );
  }

  for (const demo of DEMO_USERS) {
    const existing = await userRepository.findByAuthUserId(demo.authUserId);
    const profile = existing
      ? await userRepository.update(existing.id, {
          email: demo.email,
          firstName: demo.firstName,
          lastName: demo.lastName,
          role: demo.role,
          isActive: true,
        } as any)
      : await userRepository.create({
          authUserId: demo.authUserId,
          email: demo.email,
          firstName: demo.firstName,
          lastName: demo.lastName,
          role: demo.role,
          isActive: true,
        });

    if (!profile) {
      throw new Error(`Failed to upsert seed user: ${demo.email}`);
    }

    if (demo.skills) await userRepository.replaceSkills(profile.id, demo.skills);
    if (demo.education) await userRepository.replaceEducation(profile.id, demo.education);
    if (demo.experience) await userRepository.replaceExperience(profile.id, demo.experience);
    if (demo.socialLinks) await userRepository.upsertSocialLinks(profile.id, demo.socialLinks);
    logger.info(`${existing ? 'Updated' : 'Seeded'} ${demo.role}: ${demo.email}`);
  }

  await pool.end();
  logger.info('Seed complete.');
};

run().catch((err) => {
  logger.error('Seed failed', { error: err.message });
  process.exit(1);
});
