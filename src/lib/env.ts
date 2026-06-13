/**
 * Environment variable validation.
 * Called at module load time in server-side code.
 * Throws on missing required vars in production; warns in development.
 */

interface EnvConfig {
  GROQ_API_KEY: string;
  HINDSIGHT_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
}

function validateEnv(): EnvConfig {
  const required = {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    HINDSIGHT_API_KEY: process.env.HINDSIGHT_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v || v.trim() === '')
    .map(([k]) => k);

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}.\nAdd them to .env.local and restart the dev server.`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      console.warn(`⚠️  ${msg}`);
    }
  }

  return {
    GROQ_API_KEY:        process.env.GROQ_API_KEY        || '',
    HINDSIGHT_API_KEY:   process.env.HINDSIGHT_API_KEY   || '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };
}

export const env = validateEnv();

/** User-friendly label for a missing-key error surfaced to the API consumer. */
export function missingKeyError(keyName: string) {
  return {
    error: 'configuration_error',
    message: `${keyName} is not configured. Add it to your .env.local file and restart the server.`,
  };
}
