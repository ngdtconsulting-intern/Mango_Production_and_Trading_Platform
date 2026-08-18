import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Rate limiters for the endpoints an attacker can hammer without an account.
 *
 * `keyGenerator` is left at the library default, which reads `req.ip`. That
 * means the limit is only as trustworthy as `req.ip`: behind a proxy or load
 * balancer every request appears to come from the proxy, and one user's
 * failures would lock out everyone. If this is deployed behind a proxy, set
 * `app.set('trust proxy', 1)` in server.js so `req.ip` reflects the real
 * client — see the note there.
 */

const limitReached = (label) => (req, res, next, options) => {
  logger.warn(`Rate limit hit on ${label} from ${req.ip}`);
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
  });
};

/**
 * Login: the endpoint worth guarding most, because a failure costs the attacker
 * nothing and a success costs the user everything.
 *
 * `skipSuccessfulRequests` means only failed attempts count, so somebody
 * legitimately signing in and out repeatedly is never locked out — the budget
 * is spent on wrong passwords alone.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 8,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
  handler: limitReached('login'),
});

/**
 * Registration: slower and per-IP, to stop bulk account creation. Deliberately
 * more generous than login, since a shared connection (an office, a village
 * internet cafe) may legitimately sign several people up in one sitting.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many accounts created from this address. Please try again later.',
  handler: limitReached('register'),
});
