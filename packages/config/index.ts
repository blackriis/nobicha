// Helper guards for required vs optional environment variables
function requireEnvVar(value: string | undefined, name: string): string {
  if (!value || value.startsWith('YOUR_') || value.trim() === '') {
    throw new Error(
      `❌ Environment variable ${name} is required but not set. Please check your .env.local file and restart the server.`
    );
  }
  return value;
}

function optionalEnvVar(value: string | undefined, name: string): string | undefined {
  if (!value || value.startsWith('YOUR_') || value.trim() === '') {
    return undefined;
  }
  return value;
}

export const supabaseConfig = {
  url: requireEnvVar(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    'NEXT_PUBLIC_SUPABASE_URL'
  ),
  anonKey: requireEnvVar(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ),
  serviceRoleKey: optionalEnvVar(
    process.env.SUPABASE_SERVICE_ROLE_KEY, 
    'SUPABASE_SERVICE_ROLE_KEY'
  ),
}

// Helper function to check if we're using placeholder configuration
export function isPlaceholderConfig(): boolean {
  return supabaseConfig.url.includes('placeholder') || 
         supabaseConfig.anonKey.includes('placeholder');
}

export const config = {
  supabase: supabaseConfig,
  env: process.env.NODE_ENV || 'development',
  isPlaceholder: isPlaceholderConfig(),
}
