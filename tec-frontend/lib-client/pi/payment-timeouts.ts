/**
 * Centralized payment timeout configuration.
 * All timeout values are in milliseconds.
 */

// Cap payment timeouts at 10 minutes to prevent excessively long-hanging flows
const MAX_TIMEOUT_MS = 10 * 60 * 1000;

const parseEnvTimeout = (envVar: string | undefined, defaultMs: number): number => {
  const parsed = envVar ? parseInt(envVar, 10) : NaN;
  if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_TIMEOUT_MS) {
    return parsed;
  }
  return defaultMs;
};

/** Timeout (ms) for the user approval stage (user confirms payment in Pi Browser). */
export const APPROVAL_TIMEOUT_MS = parseEnvTimeout(
  process.env.NEXT_PUBLIC_PI_APPROVAL_TIMEOUT,
  3 * 60 * 1000  // 3 minutes default
);

/** Timeout (ms) for the completion stage (backend processing + blockchain confirmation). */
export const COMPLETION_TIMEOUT_MS = parseEnvTimeout(
  process.env.NEXT_PUBLIC_PI_COMPLETION_TIMEOUT,
  3 * 60 * 1000  // 3 minutes default
);

/**
 * HTTP status codes from the Pi Platform API that are safe to retry.
 * - 404: Payment not yet indexed (transient); safe to retry with back-off.
 * - 429: Rate-limited; back-off and retry.
 */
export const RETRIABLE_STATUS_CODES = new Set([404, 429]);

/**
 * HTTP status codes that should NOT be retried (definitive client/server errors).
 * - 400: Bad request — retrying will not change the outcome.
 * - 401 / 403: Auth error — retrying will not help.
 * - 500: Internal server error — treated as non-retriable to avoid duplicate side-effects.
 */
export const NON_RETRIABLE_STATUS_CODES = new Set([400, 401, 403, 500]);

/** Maximum number of retry attempts for retriable requests. */
export const MAX_RETRIES = 2;

/** Base delay (ms) for exponential back-off between retries. */
export const RETRY_BASE_DELAY_MS = 1000;
