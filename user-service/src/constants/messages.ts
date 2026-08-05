export const Messages = {
  // Generic
  SUCCESS: 'Request processed successfully.',
  CREATED: 'Resource created successfully.',
  UPDATED: 'Resource updated successfully.',
  DELETED: 'Resource deleted successfully.',

  // Auth / access
  UNAUTHORIZED: 'Authentication required. Provide a valid bearer token.',
  INVALID_TOKEN: 'Invalid or expired authentication token.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  TOKEN_MISSING: 'Authorization header is missing or malformed.',

  // Users
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'A user profile already exists for this account.',
  EMAIL_TAKEN: 'The provided email is already in use.',
  PROFILE_FETCHED: 'User profile retrieved successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  USER_FETCHED: 'User retrieved successfully.',
  USER_LISTED: 'Users retrieved successfully.',
  USER_DELETED: 'User deleted successfully.',
  USER_BLOCKED: 'User blocked successfully.',
  USER_ACTIVATED: 'User activated successfully.',
  ROLE_UPDATED: 'User role updated successfully.',
  AUTH_SYNC_FAILED: 'User profile changed locally but failed to synchronize with the Auth Service.',

  // Avatar
  AVATAR_UPLOADED: 'Avatar uploaded successfully.',
  AVATAR_DELETED: 'Avatar removed successfully.',
  AVATAR_REQUIRED: 'Avatar file is required.',
  AVATAR_INVALID_TYPE: 'Unsupported image type. Allowed: PNG, JPEG, WEBP.',
  AVATAR_TOO_LARGE: 'Avatar exceeds the maximum allowed size.',
  AVATAR_UPLOAD_FAILED: 'Failed to persist avatar file.',

  // Search / stats
  SEARCH_RESULTS: 'Search completed successfully.',
  STATISTICS_FETCHED: 'User statistics retrieved successfully.',

  // Validation
  VALIDATION_FAILED: 'Validation failed.',

  // System
  HEALTH_OK: 'Service is healthy.',
  NOT_FOUND: 'The requested resource was not found.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;
