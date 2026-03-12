import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from Backend root
dotenvConfig({ path: resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // API Server
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:8080'),

  // Database
  DATABASE_URL: z.string().min(1),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // MinIO / S3
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY is required'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY is required'),
  S3_BUCKET: z.string().default('mcq-platform'),
  S3_REGION: z.string().default('us-east-1'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('24h'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // AI Providers (optional — can be configured later via UI)
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  GOOGLE_AI_API_KEY: z.string().optional().default(''),
  MISTRAL_API_KEY: z.string().optional().default(''),
  QWEN_VL_ENDPOINT: z.string().optional().default(''),
  QWEN_VL_API_KEY: z.string().optional().default(''),
  GLM_OCR_ENDPOINT: z.string().optional().default(''),
  GLM_OCR_API_KEY: z.string().optional().default(''),

  // Rate Limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_API_MAX: z.coerce.number().default(100),
  RATE_LIMIT_API_WINDOW_MS: z.coerce.number().default(60000),

  // File Upload
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  PRESIGNED_UPLOAD_TTL_SECONDS: z.coerce.number().default(900),
  PRESIGNED_DOWNLOAD_TTL_SECONDS: z.coerce.number().default(3600),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadConfig();
