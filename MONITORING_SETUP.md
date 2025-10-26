# Monitoring and Analytics Setup Guide

This guide covers the complete monitoring setup for the PubHub application, including error tracking, performance monitoring, and uptime monitoring.

## ✅ Completed Setup

### 1. Sentry Error Tracking
- **Status**: ✅ Configured
- **Features**: Error tracking, performance monitoring, session replay
- **Configuration**: `src/sentry.ts`
- **Environment Variables**: See `SENTRY_SETUP.md`

### 2. Vercel Analytics
- **Status**: ✅ Configured
- **Features**: Web vitals, page views, user behavior
- **Implementation**: Added to `index.html`

## 🔧 Required Setup Steps

### Step 1: Enable Vercel Analytics
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your PubHub project
3. Go to **Settings** → **Analytics**
4. Enable **Web Analytics**
5. Copy the Analytics ID and add to environment variables

### Step 2: Configure Sentry Project
1. Go to [Sentry Dashboard](https://sentry.io)
2. Create a new project (React)
3. Copy the DSN and configuration details
4. Add environment variables (see `SENTRY_SETUP.md`)

### Step 3: Set Up Uptime Monitoring
Choose one of these options:

#### Option A: Vercel Uptime Monitoring (Recommended)
1. Go to Vercel Dashboard → **Functions** → **Monitoring**
2. Enable uptime monitoring
3. Set up alerts for downtime

#### Option B: External Service (UptimeRobot, Pingdom)
1. Sign up for uptime monitoring service
2. Add your production URL
3. Set up alerts (email, Slack, etc.)

## 📊 Monitoring Dashboard

### Key Metrics to Track

#### Performance Metrics
- **Page Load Time**: Target < 3 seconds
- **First Contentful Paint**: Target < 1.5 seconds
- **Largest Contentful Paint**: Target < 2.5 seconds
- **Cumulative Layout Shift**: Target < 0.1

#### User Experience Metrics
- **Bounce Rate**: Target < 40%
- **Session Duration**: Target > 10 minutes
- **Pages per Session**: Target > 3
- **Conversion Rate**: Target > 5% (sign-ups)

#### Technical Metrics
- **Error Rate**: Target < 5%
- **Uptime**: Target > 99.9%
- **API Response Time**: Target < 500ms
- **Bundle Size**: Current 1.3MB (target < 1MB)

### Alert Thresholds

#### Critical Alerts
- **Uptime < 99%**: Immediate notification
- **Error Rate > 10%**: Immediate notification
- **Page Load Time > 5 seconds**: Immediate notification

#### Warning Alerts
- **Error Rate > 5%**: Daily digest
- **Page Load Time > 3 seconds**: Daily digest
- **Bundle Size Increase > 100KB**: Weekly digest

## 🚨 Alert Configuration

### Sentry Alerts
1. Go to Sentry Dashboard → **Alerts**
2. Create alerts for:
   - Error rate spikes
   - Performance degradation
   - New error types

### Vercel Alerts
1. Go to Vercel Dashboard → **Functions** → **Monitoring**
2. Set up alerts for:
   - Function failures
   - High response times
   - Memory usage spikes

## 📈 Analytics Implementation

### Custom Event Tracking
Add custom events to track user behavior:

```typescript
// Track user actions
import { va } from '@vercel/analytics';

// Track button clicks
va.track('button_click', {
  button_name: 'create_post',
  page: 'dashboard'
});

// Track form submissions
va.track('form_submit', {
  form_name: 'signup',
  success: true
});

// Track feature usage
va.track('feature_used', {
  feature: 'oauth_signin',
  provider: 'google'
});
```

### Sentry User Context
Add user context for better error tracking:

```typescript
import * as Sentry from '@sentry/react';

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Add custom tags
Sentry.setTag('user_plan', 'free');
Sentry.setTag('signup_method', 'oauth');
```

## 🔍 Monitoring Checklist

### Pre-Launch
- [ ] Sentry project configured with DSN
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set
- [ ] Custom events implemented
- [ ] User context added to Sentry

### Post-Launch
- [ ] Monitor error rates for first 24 hours
- [ ] Check performance metrics
- [ ] Verify uptime monitoring is working
- [ ] Review user behavior analytics
- [ ] Set up weekly monitoring reports

## 📋 Weekly Monitoring Report Template

### Week 1 Report
```
📊 PubHub Monitoring Report - Week 1

Performance Metrics:
- Average page load time: X.Xs
- Error rate: X.X%
- Uptime: X.X%

User Metrics:
- Total users: XXX
- Sign-up conversion: X.X%
- Average session duration: X min

Top Issues:
- [List top 3 errors from Sentry]
- [List performance bottlenecks]

Recommendations:
- [Action items for next week]
```

## 🛠️ Troubleshooting

### Common Issues

#### Sentry Not Capturing Errors
- Check DSN is correct
- Verify environment variables are set
- Check browser console for Sentry errors

#### Vercel Analytics Not Working
- Ensure script is loaded in production
- Check Analytics ID is correct
- Verify domain is added to Vercel project

#### Uptime Monitoring False Positives
- Check monitoring service configuration
- Verify URL is accessible
- Review alert thresholds

## 📚 Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Performance Monitoring Best Practices](https://web.dev/performance-monitoring/)
