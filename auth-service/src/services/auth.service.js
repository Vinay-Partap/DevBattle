// ===========================================
// Authentication Service
// ===========================================

import userRepository from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/password.helper.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.helper.js';
import { generateToken, hashToken } from '../utils/token.helper.js';
import { sanitizeUser } from '../utils/response.helper.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/cookie.helper.js';
import { logger } from '../utils/logger.js';
import {
  AppError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/messages.js';
import jwtConfig from '../config/jwt.config.js';
import { env } from '../config/env.js';

import emailService from './email.service.js';

/**
 * Authentication service containing all auth-related business logic.
 */
class AuthService {
  /**
   * Register a new user.
   * @param {Object} data - Registration data
   * @param {string} data.name - User's name
   * @param {string} data.email - User's email
   * @param {string} data.password - Plain text password
   * @param {string} [data.role='student'] - User role
   * @returns {Promise<Object>} Registration result
   */
  async register(data) {
    const { name, email, password, role } = data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const verificationToken = generateToken(32);
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the auth account as inactive. The User Service profile is provisioned
    // with the same pending status; an administrator must approve it before login.
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role: role || 'student',
      isActive: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry,
    });

    // Provision profile in User Service synchronously in integrated environments.
    // If provisioning fails, roll back the auth record so the two services cannot drift.
    if (env.NODE_ENV !== 'test') {
      try {
        await this.provisionUserProfile(user, name);
      } catch (err) {
        await userRepository.delete(user.id).catch((deleteErr) => {
          logger.error('Failed to roll back auth user after profile provisioning failure:', deleteErr);
        });
        throw err;
      }
    }

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail(user, verificationToken).catch((err) => {
      logger.error('Failed to send verification email:', err);
    });

    logger.info(`New user registered: ${email}`);

    return {
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      user: sanitizeUser(user),
    };
  }

  /**
   * Authenticate a user and issue tokens.
   * @param {Object} data - Login data
   * @param {string} data.email - User's email
   * @param {string} data.password - Plain text password
   * @param {import('express').Response} res - Express response (for setting cookies)
   * @returns {Promise<Object>} Login result with tokens
   */
  async provisionUserProfile(user, name) {
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userSvcRes = await fetch(`${env.USER_SERVICE_URL}/api/v1/internal/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        authUserId: user.id,
        email: user.email,
        firstName,
        lastName,
        role: user.role,
        isActive: false,
      }),
    });

    if (!userSvcRes.ok) {
      const errText = await userSvcRes.text();
      logger.error(
        `Failed to provision user profile in User Service. Status: ${userSvcRes.status}, Error: ${errText}`,
      );
      throw new AppError('Failed to provision user profile. Please try again later.', 502);
    }

    logger.info(`Successfully provisioned user profile in User Service for user: ${user.id}`);
  }

  async login(data, res) {
    const { email, password } = data;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.isActive === false) {
      throw new ForbiddenError(ERROR_MESSAGES.ACCOUNT_PENDING);
    }

    // Generate tokens
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Hash refresh token before storing in database
    const hashedRefreshToken = hashToken(refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + jwtConfig.refresh.expiresInMs);

    // Store hashed refresh token in database
    await userRepository.updateRefreshToken(user.id, hashedRefreshToken, refreshTokenExpiry);

    // Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in: ${email}`);

    return {
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      accessToken,
      user: sanitizeUser(user),
    };
  }

  /**
   * Logout a user by invalidating the refresh token.
   * @param {string} userId - User's ID
   * @param {import('express').Response} res - Express response (for clearing cookies)
   * @returns {Promise<Object>}
   */
  async logout(userId, res) {
    // Clear refresh token from database
    await userRepository.clearRefreshToken(userId);

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    logger.info(`User logged out: ${userId}`);

    return {
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    };
  }

  /**
   * Refresh the access token using the refresh token (rotation).
   * @param {string} refreshToken - Refresh token from cookie
   * @param {import('express').Response} res - Express response (for setting new cookie)
   * @returns {Promise<Object>} New access token
   */
  async refreshAccessToken(refreshToken, res) {
    if (!refreshToken) {
      throw new UnauthorizedError(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
    }

    // Verify the refresh token JWT (throws if invalid/expired)
    verifyRefreshToken(refreshToken);

    // Hash the provided refresh token to compare with stored hash
    const hashedToken = hashToken(refreshToken);

    // Find user by hashed refresh token
    const user = await userRepository.findByRefreshToken(hashedToken);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.REFRESH_TOKEN_REVOKED);
    }

    // Check if refresh token has expired in the database
    if (user.refreshTokenExpiry && new Date(user.refreshTokenExpiry) < new Date()) {
      await userRepository.clearRefreshToken(user.id);
      clearRefreshTokenCookie(res);
      throw new UnauthorizedError(ERROR_MESSAGES.REFRESH_TOKEN_EXPIRED);
    }

    // Generate new tokens (rotation)
    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Hash new refresh token and store
    const newHashedRefreshToken = hashToken(newRefreshToken);
    const newRefreshTokenExpiry = new Date(Date.now() + jwtConfig.refresh.expiresInMs);

    await userRepository.updateRefreshToken(user.id, newHashedRefreshToken, newRefreshTokenExpiry);

    // Set new refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    logger.debug(`Access token refreshed for user: ${user.id}`);

    return {
      message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
      accessToken: newAccessToken,
    };
  }

  /**
   * Get the currently authenticated user's profile.
   * @param {string} userId - User's ID
   * @returns {Promise<Object>} User profile
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    return {
      message: SUCCESS_MESSAGES.ME_SUCCESS,
      user: sanitizeUser(user),
    };
  }

  /**
   * Initiate forgot password flow.
   * @param {string} email - User's email
   * @returns {Promise<Object>}
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);

    // Always return success message to prevent email enumeration
    if (!user) {
      logger.warn(`Forgot password requested for non-existent email: ${email}`);
      return { message: SUCCESS_MESSAGES.FORGOT_PASSWORD_SUCCESS };
    }

    // Generate reset token
    const resetToken = generateToken(32);
    const hashedResetToken = hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed reset token
    await userRepository.setResetPasswordToken(user.id, hashedResetToken, resetTokenExpiry);

    // Send reset email (non-blocking)
    emailService.sendPasswordResetEmail(user, resetToken).catch((err) => {
      logger.error('Failed to send password reset email:', err);
    });

    logger.info(`Password reset requested for: ${email}`);

    return { message: SUCCESS_MESSAGES.FORGOT_PASSWORD_SUCCESS };
  }

  /**
   * Reset password using a reset token.
   * @param {Object} data - Reset data
   * @param {string} data.token - Reset token
   * @param {string} data.password - New password
   * @returns {Promise<Object>}
   */
  async resetPassword(data) {
    const { token, password } = data;

    // Hash the token to look it up
    const hashedToken = hashToken(token);

    // Find user by reset token
    const user = await userRepository.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_RESET_TOKEN);
    }

    // Check if token has expired
    if (user.resetPasswordTokenExpiry && new Date(user.resetPasswordTokenExpiry) < new Date()) {
      await userRepository.clearResetPasswordToken(user.id);
      throw new ValidationError(ERROR_MESSAGES.INVALID_RESET_TOKEN);
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.clearResetPasswordToken(user.id);

    // Invalidate refresh tokens
    await userRepository.clearRefreshToken(user.id);

    // Send password changed confirmation email (non-blocking)
    emailService.sendPasswordChangedEmail(user).catch((err) => {
      logger.error('Failed to send password changed email:', err);
    });

    logger.info(`Password reset completed for user: ${user.id}`);

    return { message: SUCCESS_MESSAGES.RESET_PASSWORD_SUCCESS };
  }

  /**
   * Change password for an authenticated user.
   * @param {string} userId - User's ID
   * @param {Object} data - Change password data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @returns {Promise<Object>}
   */
  async changePassword(userId, data) {
    const { currentPassword, newPassword } = data;

    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if new password is the same as old
    const isSamePassword = await comparePassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ValidationError(ERROR_MESSAGES.SAME_PASSWORD);
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(userId, passwordHash);

    // Invalidate all refresh tokens (force re-login on all devices)
    await userRepository.clearRefreshToken(userId);

    // Send confirmation email (non-blocking)
    emailService.sendPasswordChangedEmail(user).catch((err) => {
      logger.error('Failed to send password changed email:', err);
    });

    logger.info(`Password changed for user: ${userId}`);

    return { message: SUCCESS_MESSAGES.CHANGE_PASSWORD_SUCCESS };
  }

  /**
   * Verify user's email address.
   * @param {string} token - Verification token
   * @returns {Promise<Object>}
   */
  async verifyEmail(token) {
    // Hash the token to look it up
    const hashedToken = hashToken(token);

    // Find user by verification token
    const user = await userRepository.findByVerificationToken(hashedToken);

    if (!user) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_VERIFICATION_TOKEN);
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_VERIFICATION_TOKEN);
    }

    // Check if already verified
    if (user.isVerified) {
      return { message: SUCCESS_MESSAGES.EMAIL_ALREADY_VERIFIED };
    }

    // Verify the email
    await userRepository.verifyEmail(user.id);

    logger.info(`Email verified for user: ${user.id}`);

    return { message: SUCCESS_MESSAGES.EMAIL_VERIFIED };
  }

  /**
   * Resend verification email.
   * @param {string} email - User's email
   * @returns {Promise<Object>}
   */
  async updateInternalRole(userId, role) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    const updated = await userRepository.update(userId, { role });
    logger.info(`Auth role synchronized for user ${userId}: ${role}`);

    return {
      message: 'Auth user role synchronized successfully.',
      user: sanitizeUser(updated),
    };
  }

  async updateInternalStatus(userId, isActive) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.NOT_FOUND);
    }

    const updated = await userRepository.update(userId, { isActive });
    logger.info(`Auth status synchronized for user ${userId}: ${isActive ? 'active' : 'inactive'}`);

    return {
      message: 'Auth user status synchronized successfully.',
      user: sanitizeUser(updated),
    };
  }

  async resendVerificationEmail(email) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal whether email exists
      return { message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT };
    }

    if (user.isVerified) {
      return { message: SUCCESS_MESSAGES.EMAIL_ALREADY_VERIFIED };
    }

    // Generate new verification token
    const verificationToken = generateToken(32);
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new verification token
    await userRepository.update(user.id, {
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry,
    });

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail(user, verificationToken).catch((err) => {
      logger.error('Failed to send verification email:', err);
    });

    logger.info(`Verification email resent for: ${email}`);

    return { message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT };
  }
}

export default new AuthService();
