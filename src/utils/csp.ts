// Content Security Policy configuration for PubHub
import { logger } from './logger';

export const cspConfig = {
  // Default CSP policy
  default: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for Vite in development
      'https://js.sentry-cdn.com', // Sentry
      'https://browser.sentry-cdn.com', // Sentry
      'https://vercel.live', // Vercel Analytics
      'https://va.vercel-scripts.com', // Vercel Analytics
      'https://clerk.pubhub.dev', // Clerk custom domain
      'https://*.clerk.com', // Clerk default CDN
      'https://*.clerk.accounts.dev', // Clerk accounts
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      'https://fonts.googleapis.com', // Google Fonts
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com', // Google Fonts
      'data:', // Data URIs for fonts
    ],
    'img-src': [
      "'self'",
      'data:', // Data URIs for images
      'blob:', // Blob URLs for file uploads
      'https://*.digitaloceanspaces.com', // DigitalOcean Spaces
      'https://*.cdn.digitaloceanspaces.com', // DigitalOcean Spaces CDN
      'https://*.clerk.accounts.dev', // Clerk user avatars
      'https://img.clerk.com', // Clerk images
      'https://via.placeholder.com', // Placeholder images
      'https://images.unsplash.com', // Unsplash images
      'https://picsum.photos', // Lorem Picsum
    ],
    'media-src': [
      "'self'",
      'blob:', // Blob URLs for media files
      'https://*.digitaloceanspaces.com', // DigitalOcean Spaces
      'https://*.cdn.digitaloceanspaces.com', // DigitalOcean Spaces CDN
    ],
    'connect-src': [
      "'self'",
      'https://*.ondigitalocean.app', // DigitalOcean App Platform API
      'https://*.clerk.accounts.dev', // Clerk API
      'https://*.clerk.com', // Clerk API
      'https://clerk.pubhub.dev', // Clerk custom domain
      'https://o4510074583842816.ingest.us.sentry.io', // Sentry
      'https://vitals.vercel-insights.com', // Vercel Analytics
    ],
    'frame-src': [
      "'self'",
      'https://*.clerk.accounts.dev', // Clerk Auth iframes
      'https://*.clerk.com', // Clerk Auth iframes
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  },

  // Stricter CSP for production
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://js.sentry-cdn.com',
      'https://browser.sentry-cdn.com',
      'https://vercel.live',
      'https://va.vercel-scripts.com',
      'https://clerk.pubhub.dev', // Clerk custom domain
      'https://*.clerk.com', // Clerk default CDN
      'https://*.clerk.accounts.dev', // Clerk accounts
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Still required for Tailwind CSS
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.digitaloceanspaces.com',
      'https://*.cdn.digitaloceanspaces.com',
      'https://*.clerk.accounts.dev',
      'https://img.clerk.com',
    ],
    'media-src': [
      "'self'",
      'blob:',
      'https://*.digitaloceanspaces.com',
      'https://*.cdn.digitaloceanspaces.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.ondigitalocean.app',
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://clerk.pubhub.dev', // Clerk custom domain
      'https://o4510074583842816.ingest.us.sentry.io',
      'https://vitals.vercel-insights.com',
    ],
    'frame-src': [
      "'self'",
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  },

  // Development CSP (more permissive)
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://js.sentry-cdn.com',
      'https://browser.sentry-cdn.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.digitaloceanspaces.com',
      'https://*.cdn.digitaloceanspaces.com',
      'https://*.clerk.accounts.dev',
      'https://img.clerk.com',
      'https://via.placeholder.com',
      'https://images.unsplash.com',
      'https://picsum.photos',
    ],
    'media-src': [
      "'self'",
      'blob:',
      'https://*.digitaloceanspaces.com',
      'https://*.cdn.digitaloceanspaces.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.ondigitalocean.app',
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://o4510074583842816.ingest.us.sentry.io',
    ],
    'frame-src': [
      "'self'",
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }
};

// Helper function to generate CSP header
export function generateCSPHeader(environment: 'development' | 'production' = 'production'): string {
  const policy = environment === 'production' ? cspConfig.production : cspConfig.development;
  
  return Object.entries(policy)
    .map(([directive, sources]) => {
      if (Array.isArray(sources)) {
        return `${directive} ${sources.join(' ')}`;
      }
      return directive;
    })
    .join('; ');
}

// Helper function to validate CSP compliance
export function validateCSPCompliance(): void {
  if (typeof window === 'undefined') return;

  // Check for common CSP violations
  const violations = [];

  // Check for inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  if (inlineScripts.length > 0) {
    violations.push('Inline scripts detected - consider moving to external files');
  }

  // Check for inline styles
  const inlineStyles = document.querySelectorAll('style');
  if (inlineStyles.length > 0) {
    violations.push('Inline styles detected - consider using external stylesheets');
  }

  // Check for eval usage
  if (window.eval) {
    violations.push('eval() usage detected - consider alternatives');
  }

  // Check for external resources
  const externalScripts = document.querySelectorAll('script[src^="http"]');
  const allowedDomains = [
    'js.sentry-cdn.com',
    'browser.sentry-cdn.com',
    'vercel.live',
    'va.vercel-scripts.com'
  ];

  externalScripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && !allowedDomains.some(domain => src.includes(domain))) {
      violations.push(`External script from unauthorized domain: ${src}`);
    }
  });

  if (violations.length > 0) {
    logger.warn('CSP Compliance Issues:', violations);
  } else {
    logger.info('CSP compliance check passed');
  }
}

// CSP violation reporting
export function setupCSPReporting(): void {
  if (typeof window === 'undefined') return;

  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      columnNumber: event.columnNumber,
      lineNumber: event.lineNumber,
      originalPolicy: event.originalPolicy,
      referrer: event.referrer,
      sourceFile: event.sourceFile,
      violatedDirective: event.violatedDirective,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    logger.error('CSP Violation:', violation);

    // Send to monitoring service (Sentry)
    if (typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        message: 'CSP Violation',
        level: 'error',
        data: violation
      });
    }
  });
}

// Initialize CSP validation in development
if (process.env.NODE_ENV === 'development') {
  // Run CSP validation after DOM is loaded
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(validateCSPCompliance, 1000);
      setupCSPReporting();
    });
  }
}
