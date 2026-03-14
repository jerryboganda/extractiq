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
  CORS_ORIGIN: z.string().url().default('http://localhost:8080'),
  APP_BASE_URL: z.string().url().default('http://localhost:8080/app'),

  // Database
  DATABASE_URL: z.string().min(1),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  // MinIO / S3
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_PUBLIC_ENDPOINT: z.string().url().default('http://localhost:9000'),
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
  QWEN_VL_ENDPOINT: z.union([z.string().url(), z.literal('')]).optional().default(''),
  QWEN_VL_API_KEY: z.string().optional().default(''),
  GLM_OCR_ENDPOINT: z.union([z.string().url(), z.literal('')]).optional().default(''),
  GLM_OCR_API_KEY: z.string().optional().default(''),

  // Email
  SMTP_HOST: z.string().min(1).default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true'),
  SMTP_FROM_NAME: z.string().default('ExtractIQ Document Intelligence'),
  SMTP_FROM: z.string().email().default('noreply@extractiq.local'),
  SALES_NOTIFICATION_EMAIL: z.string().email().default('sales@extractiq.local'),
  SUPPORT_NOTIFICATION_EMAIL: z.string().email().default('support@extractiq.local'),
  ENABLE_EMAIL_DELIVERY: z.string().default('true').transform((v) => v === 'true'),

  // Rate Limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_API_MAX: z.coerce.number().default(100),
  RATE_LIMIT_API_WINDOW_MS: z.coerce.number().default(60000),

  // File Upload
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  PRESIGNED_UPLOAD_TTL_SECONDS: z.coerce.number().default(900),
  PRESIGNED_DOWNLOAD_TTL_SECONDS: z.coerce.number().default(3600),
}).superRefine((config, ctx) => {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (!config.APP_BASE_URL.startsWith('https://')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['APP_BASE_URL'],
      message: 'APP_BASE_URL must use https:// in production',
    });
  }

  if (!config.CORS_ORIGIN.startsWith('https://')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGIN'],
      message: 'CORS_ORIGIN must use https:// in production',
    });
  }

  const publicStorageHost = new URL(config.S3_PUBLIC_ENDPOINT).hostname;
  if (['localhost', '127.0.0.1', 'minio'].includes(publicStorageHost)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['S3_PUBLIC_ENDPOINT'],
      message: 'S3_PUBLIC_ENDPOINT must be browser reachable in production',
    });
  }

  if (config.ENABLE_EMAIL_DELIVERY) {
    if (!config.SMTP_USER.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_USER'],
        message: 'SMTP_USER is required when email delivery is enabled in production',
      });
    }

    if (!config.SMTP_PASS.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_PASS'],
        message: 'SMTP_PASS is required when email delivery is enabled in production',
      });
    }
  }
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
