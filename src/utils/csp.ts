// Content Security Policy configuration for PubHub
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
      'https://*.supabase.co', // Supabase storage
      'https://*.supabase.in', // Supabase storage (alternative domain)
      'https://via.placeholder.com', // Placeholder images
      'https://images.unsplash.com', // Unsplash images
      'https://picsum.photos', // Lorem Picsum
    ],
    'media-src': [
      "'self'",
      'blob:', // Blob URLs for media files
      'https://*.supabase.co', // Supabase storage
      'https://*.supabase.in', // Supabase storage (alternative domain)
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co', // Supabase API
      'https://*.supabase.in', // Supabase API (alternative domain)
      'https://o4510074583842816.ingest.us.sentry.io', // Sentry
      'https://vitals.vercel-insights.com', // Vercel Analytics
      'wss://*.supabase.co', // Supabase WebSocket
      'wss://*.supabase.in', // Supabase WebSocket (alternative domain)
    ],
    'frame-src': [
      "'self'",
      'https://*.supabase.co', // Supabase Auth iframes
      'https://*.supabase.in', // Supabase Auth iframes (alternative domain)
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
      'https://*.supabase.co',
      'https://*.supabase.in',
    ],
    'media-src': [
      "'self'",
      'blob:',
      'https://*.supabase.co',
      'https://*.supabase.in',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
      'https://o4510074583842816.ingest.us.sentry.io',
      'https://vitals.vercel-insights.com',
      'wss://*.supabase.co',
      'wss://*.supabase.in',
    ],
    'frame-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
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
      'https://*.supabase.co',
      'https://*.supabase.in',
      'https://via.placeholder.com',
      'https://images.unsplash.com',
      'https://picsum.photos',
    ],
    'media-src': [
      "'self'",
      'blob:',
      'https://*.supabase.co',
      'https://*.supabase.in',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
      'https://o4510074583842816.ingest.us.sentry.io',
      'wss://*.supabase.co',
      'wss://*.supabase.in',
    ],
    'frame-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
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
    console.warn('CSP Compliance Issues:', violations);
  } else {
    console.log('CSP compliance check passed');
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

    console.error('CSP Violation:', violation);

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
