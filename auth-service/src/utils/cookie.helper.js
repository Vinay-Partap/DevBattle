// ===========================================
// Cookie Helper Utility
// ===========================================

import { env } from '../config/env.js';
import { COOKIE_NAMES } from '../constants/index.js';
import jwtConfig from '../config/jwt.config.js';

/**
 * Set the refresh token as an HTTP-only cookie.
 * @param {import('express').Response} res - Express response object
 * @param {string} token - Refresh token value
 */
const setRefreshTokenCookie = (res, token) => {
  const options = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: jwtConfig.refresh.expiresInMs,
    path: '/',
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, options);
};

/**
 * Clear the refresh token cookie.
 * @param {import('express').Response} res - Express response object
 */
const clearRefreshTokenCookie = (res) => {
  const options = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, options);
};

export { setRefreshTokenCookie, clearRefreshTokenCookie };
