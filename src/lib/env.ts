type EnvConfig = {
  nodeEnv: 'development' | 'production' | 'test';
  isDev: boolean;
  isProd: boolean;
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  databaseUrl: string;
  redisUrl?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  nextAuthUrl?: string;
  nextAuthSecret?: string;
  analyticsId?: string;
  googleMapsApiKey?: string;
  resendApiKey?: string;
};

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

export function getEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];

  return {
    nodeEnv,
    isDev: nodeEnv === 'development',
    isProd: nodeEnv === 'production',
    appUrl: getOptionalEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
    supabaseUrl: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    redisUrl: getOptionalEnv('REDIS_URL'),
    googleClientId: getOptionalEnv('GOOGLE_CLIENT_ID'),
    googleClientSecret: getOptionalEnv('GOOGLE_CLIENT_SECRET'),
    nextAuthUrl: getOptionalEnv('NEXTAUTH_URL'),
    nextAuthSecret: getOptionalEnv('NEXTAUTH_SECRET'),
    analyticsId: getOptionalEnv('NEXT_PUBLIC_ANALYTICS_ID'),
    googleMapsApiKey: getOptionalEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
    resendApiKey: getOptionalEnv('RESEND_API_KEY'),
  };
}

export const env = getEnvConfig();
