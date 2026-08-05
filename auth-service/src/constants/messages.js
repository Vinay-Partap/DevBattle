// ===========================================
// Application Messages
// ===========================================

export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Registration submitted successfully. Your profile is pending administrator approval.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
  TOKEN_REFRESHED: 'Access token refreshed successfully.',
  ME_SUCCESS: 'User profile retrieved successfully.',

  // Password
  FORGOT_PASSWORD_SUCCESS:
    'If an account exists with that email, a password reset link has been sent.',
  RESET_PASSWORD_SUCCESS: 'Password has been reset successfully.',
  CHANGE_PASSWORD_SUCCESS: 'Password changed successfully.',

  // Email
  EMAIL_VERIFIED: 'Email verified successfully.',
  VERIFICATION_EMAIL_SENT: 'Verification email sent successfully.',
};

export const ERROR_MESSAGES = {
  // General
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  ROUTE_NOT_FOUND: 'The requested route does not exist.',

  // Auth
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  INVALID_TOKEN: 'Invalid or expired token.',
  TOKEN_EXPIRED: 'Token has expired. Please log in again.',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired. Please log in again.',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token.',
  REFRESH_TOKEN_REVOKED: 'Refresh token has been revoked.',
  ACCOUNT_NOT_VERIFIED: 'Account is not verified. Please verify your email.',
  ACCOUNT_PENDING: 'Account is pending administrator approval.',
  ACCOUNT_DISABLED: 'Account has been disabled.',

  // Password
  PASSWORD_TOO_WEAK: 'Password does not meet the minimum strength requirements.',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match.',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset token.',
  SAME_PASSWORD: 'New password must be different from the current password.',

  // Email
  EMAIL_ALREADY_VERIFIED: 'Email is already verified.',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token.',

  // Roles
  INVALID_ROLE: 'Invalid role specified.',
  INSUFFICIENT_ROLE: 'You do not have the required role to perform this action.',
};
