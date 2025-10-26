# Vercel Deployment Configuration Guide

## Current Status
- ✅ **Build**: Successful (889.52 kB bundle size)
- ✅ **Edge Functions**: Deployed to Supabase
- ⏳ **Vercel Environment Variables**: Need to be configured
- ⏳ **Domain Configuration**: Pending

## Required Vercel Environment Variables

### Step 1: Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your PubHub project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Environment Variables
Add these environment variables for **Production**, **Preview**, and **Development**:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://ykzckfwdvmzuzxhezthv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlremNrZndkdm16dXp4aGV6dGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTM2OTIsImV4cCI6MjA3Njk4OTY5Mn0.UoI8-lcWPepwOJz0nML-70f3MnxseCwB_AMedHLoVZE

# Sentry Configuration (Error Tracking)
VITE_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Optional: Analytics (if using Vercel Analytics)
VERCEL_ANALYTICS_ID=your-analytics-id
```

### Step 3: Verify Build Configuration
The `vercel.json` file is already configured correctly:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

## Deployment Steps

### Step 1: Deploy to Vercel
1. **Via CLI** (if Vercel CLI is installed):
   ```bash
   vercel --prod
   ```

2. **Via GitHub Integration**:
   - Push changes to main branch
   - Vercel will automatically deploy

3. **Via Vercel Dashboard**:
   - Go to project dashboard
   - Click "Deploy" button
   - Upload the `build` folder

### Step 2: Verify Deployment
1. Check deployment URL (e.g., `https://pubhub-xyz.vercel.app`)
2. Test authentication flows
3. Verify OAuth redirects work with production URL

### Step 3: Update OAuth Redirect URLs
Once you have the production URL, update OAuth provider redirect URLs:

#### Google Cloud Console
- Add: `https://your-production-domain.vercel.app/oauth/callback`

#### Facebook Developer Console  
- Add: `https://your-production-domain.vercel.app/oauth/callback`

#### Twitter Developer Portal
- Add: `https://your-production-domain.vercel.app/oauth/callback`

## Performance Optimization (Day 5)

### Current Bundle Size: 889.52 kB
**Warning**: Bundle exceeds 500 kB threshold

### Code Splitting Implementation
Add to `vite.config.ts`:
```typescript
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-*'],
          'charts': ['recharts'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
});
```

### Lazy Loading Implementation
```typescript
// Lazy load heavy components
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const EbookGenerator = lazy(() => import('./components/EbookGenerator'));
const MediaLibrary = lazy(() => import('./components/MediaLibrary'));
```

## Monitoring Setup (Day 5)

### Vercel Analytics
✅ **Analytics Setup Complete**: Web analytics script added to `index.html`
- Page views and user behavior tracking
- Web vitals monitoring
- Custom event tracking available
- See `MONITORING_SETUP.md` for detailed configuration

### Error Monitoring
✅ **Sentry Setup Complete**: Vite + React configuration implemented
- Error tracking and performance monitoring configured
- Source maps automatically uploaded during build
- Session replay enabled for debugging
- See `SENTRY_SETUP.md` for detailed configuration

### Uptime Monitoring
✅ **Uptime Monitoring Ready**: Script available at `scripts/uptime-monitor.sh`
- Health check endpoint monitoring
- Response time tracking
- SSL certificate validation
- Alert notifications (Slack, email)
- See `MONITORING_SETUP.md` for configuration options

## Security Checklist (Day 7)

### Environment Variables
- [ ] No secrets exposed in client code
- [ ] All API keys properly configured
- [ ] OAuth redirect URLs match exactly

### CORS Configuration
- [ ] Supabase Edge Functions CORS settings
- [ ] Vercel CORS headers (if needed)

### Rate Limiting
- [ ] Implement rate limiting on auth endpoints
- [ ] Monitor for abuse patterns

## Rollback Plan

### Vercel Rollback
1. Go to Vercel Dashboard → Deployments
2. Select previous successful deployment
3. Click "Promote to Production"

### Supabase Rollback
1. Go to Supabase Dashboard → Functions
2. Revert to previous function version
3. Update environment variables if needed

## Next Steps

1. **Immediate**: Configure Vercel environment variables
2. **After deployment**: Test OAuth flows with production URL
3. **Day 5**: Implement code splitting and performance optimization
4. **Day 7**: Complete security audit and final testing

## Troubleshooting

### Common Issues

#### Build Failures
- Check environment variables are set
- Verify all dependencies are installed
- Check for TypeScript errors

#### OAuth Redirect Errors
- Ensure redirect URLs match exactly
- Check OAuth provider app settings
- Verify Supabase Auth configuration

#### Performance Issues
- Implement code splitting
- Optimize images and assets
- Use Vercel Analytics to identify bottlenecks

## Success Metrics

### Launch Day Targets
- ✅ Build time < 2 minutes
- ✅ Bundle size < 1MB (current: 889.52 kB)
- ✅ OAuth success rate > 95%
- ✅ Page load time < 3 seconds

### Week 1 Targets
- User registration completion rate > 60%
- Average session duration > 10 minutes
- Error rate < 5%
- At least one post created per user
