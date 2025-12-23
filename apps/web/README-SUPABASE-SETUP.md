# Supabase Configuration Setup

## Prerequisites

### Node.js Version Requirement

⚠️ **IMPORTANT**: This project requires **Node.js 20 or later**. Node.js 18 and below are deprecated.

**Check your Node.js version:**
```bash
node --version
```

**If you need to upgrade:**
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

The project includes `.nvmrc` file - if you use nvm, simply run:
```bash
nvm use
```

## Quick Fix for "Failed to fetch" Error

The authentication error occurs because placeholder Supabase credentials are being used. Follow these steps:

### 1. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Navigate to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJhbGciOi...`)
   - **service_role key** (starts with `eyJhbGciOi...`)

### 2. Create Environment Variables File

**Create `apps/web/.env.local` file** (if it doesn't exist):

```bash
cd apps/web
touch .env.local
```

**Add the following variables** (replace with your actual values):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Important**: 
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Make sure all values are filled in - no placeholders allowed
- The URL should NOT have a trailing slash

### 3. Restart Development Server

```bash
cd apps/web
npm run dev
```

### 4. Test Authentication

The login form should now connect to your Supabase project successfully.

## Database Schema

Ensure your Supabase project has the required tables:
- `users` - User profiles and roles
- `branches` - Store locations
- `time_entries` - Employee time tracking with selfie URLs

## Security Notes

- Never commit `.env.local` to version control
- Use service role key only in API routes (server-side)
- anon key is safe for client-side usage