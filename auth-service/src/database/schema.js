// ===========================================
// Database Schema - Users Table
// ===========================================

import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Users table schema.
 * Stores all user account information including authentication credentials.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 50 }).notNull().default('student'),
    isActive: boolean('is_active').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    verificationToken: text('verification_token'),
    verificationTokenExpiry: timestamp('verification_token_expiry', { withTimezone: true }),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordTokenExpiry: timestamp('reset_password_token_expiry', { withTimezone: true }),
    refreshToken: text('refresh_token'),
    refreshTokenExpiry: timestamp('refresh_token_expiry', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      emailIndex: index('users_email_idx').on(table.email),
      roleIndex: index('users_role_idx').on(table.role),
      verificationTokenIndex: index('users_verification_token_idx').on(table.verificationToken),
      resetTokenIndex: index('users_reset_password_token_idx').on(table.resetPasswordToken),
      refreshTokenIndex: index('users_refresh_token_idx').on(table.refreshToken),
      createdAtIndex: index('users_created_at_idx').on(table.createdAt),
    };
  },
);
