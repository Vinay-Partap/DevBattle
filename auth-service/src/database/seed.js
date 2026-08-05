// ===========================================
// Database Seed Script
// ===========================================

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db, client } from '../config/db.config.js';
import { logger } from '../utils/logger.js';

import { users } from './schema.js';

const SALT_ROUNDS = 12;

const seedUsers = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Sarah Connor',
    email: 'admin@devbattles.io',
    password: 'AdminP@ssw0rd!',
    role: 'admin',
    isActive: true,
    isVerified: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Aarav Patel',
    email: 'aarav.patel@krmangalam.edu.in',
    password: 'StudentP@ssw0rd!',
    role: 'student',
    isActive: true,
    isVerified: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@krmangalam.edu.in',
    password: 'MentorP@ssw0rd!',
    role: 'mentor',
    isActive: true,
    isVerified: true,
  },
];

const seed = async () => {
  try {
    logger.info('Seeding auth-service database...');

    if (process.argv.includes('--reset')) {
      await db.delete(users);
      logger.info('Cleared existing auth users (--reset).');
    }

    for (const seedUser of seedUsers) {
      const existing = await db.select().from(users).where(eq(users.email, seedUser.email)).limit(1);
      const passwordHash = await bcrypt.hash(seedUser.password, SALT_ROUNDS);
      const values = {
        id: seedUser.id,
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        isActive: seedUser.isActive,
        isVerified: seedUser.isVerified,
      };

      if (existing.length > 0) {
        await db
          .update(users)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(users.email, seedUser.email));
        logger.info(`Updated seed auth user: ${seedUser.email}`);
        continue;
      }

      await db.insert(users).values(values);
      logger.info(`Seeded ${seedUser.role}: ${seedUser.email}`);
    }

    logger.info('Auth-service database seeding completed.');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

seed();
