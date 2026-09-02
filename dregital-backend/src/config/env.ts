import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().min(1).default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  ADMIN_USERNAME: z.string().min(1, 'ADMIN_USERNAME is required'),
  ADMIN_PASSWORD: z.string().min(6, 'ADMIN_PASSWORD must be at least 6 characters'),
  ADMIN_JWT_SECRET: z.string().min(16, 'ADMIN_JWT_SECRET must be at least 16 characters'),
  ADMIN_JWT_EXPIRES_IN: z.string().default('12h'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables:');
  for (const [key, issue] of Object.entries(parsed.error.flatten().fieldErrors)) {
    console.error(`   - ${key}: ${issue?.join(', ')}`);
  }
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  /** Allowed origins for CORS (from comma-separated CLIENT_URL). */
  clientOrigins: parsed.data.CLIENT_URL.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export type Env = typeof env;
