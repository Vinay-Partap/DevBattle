// ===========================================
// User Model (Type Definitions)
// ===========================================

/**
 * @typedef {Object} User
 * @property {string} id - UUID
 * @property {string} name - User's full name
 * @property {string} email - Unique email address
 * @property {string} passwordHash - Bcrypt hashed password
 * @property {'student'|'mentor'|'admin'} role - User role
 * @property {boolean} isActive - Admin/account activation status
 * @property {boolean} isVerified - Email verification status
 * @property {string|null} verificationToken - Email verification token
 * @property {Date|null} verificationTokenExpiry - Verification token expiry
 * @property {string|null} resetPasswordToken - Password reset token
 * @property {Date|null} resetPasswordTokenExpiry - Reset token expiry
 * @property {string|null} refreshToken - Hashed refresh token
 * @property {Date|null} refreshTokenExpiry - Refresh token expiry
 * @property {Date|null} lastLoginAt - Last login timestamp
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} CreateUserInput
 * @property {string} name
 * @property {string} email
 * @property {string} passwordHash
 * @property {'student'|'mentor'|'admin'} [role='student']
 */

/**
 * @typedef {Object} UpdateUserInput
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [passwordHash]
 * @property {'student'|'mentor'|'admin'} [role]
 * @property {boolean} [isVerified]
 * @property {string|null} [verificationToken]
 * @property {Date|null} [verificationTokenExpiry]
 * @property {string|null} [resetPasswordToken]
 * @property {Date|null} [resetPasswordTokenExpiry]
 * @property {string|null} [refreshToken]
 * @property {Date|null} [refreshTokenExpiry]
 * @property {Date|null} [lastLoginAt]
 */

/**
 * Sanitized user object (excludes sensitive fields).
 * @typedef {Object} SafeUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {boolean} isVerified
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

export {};
