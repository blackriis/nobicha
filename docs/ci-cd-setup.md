# CI/CD Environment Variables Setup Guide

## Required Environment Variables

### For GitHub Actions Secrets
Add these secrets to your GitHub repository settings (Settings > Secrets and variables > Actions):

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Optional Environment Variables
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each environment variable as a secret

## Local Development Setup

Create a `.env.local` file in the `apps/web` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## CI/CD Pipeline Features

### 1. Automated Testing
- **Lint and Type Check**: ESLint and TypeScript validation
- **Unit Tests**: Jest/Vitest test suite
- **E2E Tests**: Playwright tests on multiple browsers and devices
- **Security Scan**: Trivy vulnerability scanning

### 2. Multi-Browser Testing
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

### 3. Multi-Device Testing
- Desktop viewport
- Mobile viewport (375x667)

### 4. Deployment
- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch

## Workflow Triggers

### Automatic Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to E2E test files or source code

### Manual Triggers
- Workflow dispatch (manual trigger from GitHub UI)

## Test Reports

### Artifacts Generated
- `playwright-report`: HTML test reports
- `test-videos`: Video recordings of failed tests
- `build-files`: Application build artifacts

### Report Retention
- Test reports: 30 days
- Test videos: 7 days (only for failed tests)

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Ensure all required secrets are added to GitHub repository
   - Check secret names match exactly (case-sensitive)

2. **E2E Tests Failing**
   - Check if application starts successfully
   - Verify database connection and test data
   - Review test logs in GitHub Actions

3. **Build Failures**
   - Check TypeScript compilation errors
   - Verify all dependencies are installed
   - Review build logs for specific errors

### Debug Commands

```bash
# Run E2E tests locally
npm run test:e2e

# Run specific test file
npm run test:e2e -- branch-management-simple.spec.ts

# Run with debug mode
npm run test:e2e -- --debug

# Run with specific browser
npm run test:e2e -- --project=chromium
```

## Security Considerations

1. **Secrets Management**
   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate secrets regularly

2. **Access Control**
   - Limit repository access to trusted team members
   - Use branch protection rules
   - Require reviews for production deployments

3. **Monitoring**
   - Monitor CI/CD pipeline execution
   - Set up alerts for failed builds
   - Review security scan results regularly
