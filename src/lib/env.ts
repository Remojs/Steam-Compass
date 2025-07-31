// Environment variables configuration
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  apis: {
    steamApiKey: import.meta.env.VITE_STEAM_API_KEY,
    rawgApiKey: import.meta.env.VITE_RAWG_API_KEY,
  },
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
  },
} as const;

// Validation
export const validateEnv = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STEAM_API_KEY',
    'VITE_RAWG_API_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};
