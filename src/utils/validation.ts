// Comprehensive input validation utilities for PubHub
import type { ValidationResult, ValidationRule, FieldsValidationResult, FileUploadOptions, JsonSchema, RateLimitData } from '../types';

// Common validation patterns
export const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z9]{2,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  hashtag: /^#[a-zA-Z0-9_]{1,100}$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  slug: /^[a-z0-9-]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  noHtml: /^[^<>]*$/,
  noScript: /^(?!.*<script).*$/i,
};

// Common validation rules
export const rules = {
  email: {
    required: true,
    pattern: patterns.email,
    maxLength: 254,
    sanitize: (value: string) => value.toLowerCase().trim(),
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      if (!/(?=.*[@$!%*?&])/.test(value)) return 'Password must contain at least one special character';
      return null;
    },
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: patterns.noHtml,
    sanitize: (value: string) => value.trim().replace(/[<>]/g, ''),
  },
  content: {
    required: true,
    minLength: 1,
    maxLength: 10000,
    pattern: patterns.noScript,
    sanitize: (value: string) => value.trim(),
  },
  url: {
    required: false,
    pattern: patterns.url,
    maxLength: 2048,
    sanitize: (value: string) => value.trim(),
  },
  hashtag: {
    required: false,
    pattern: patterns.hashtag,
    maxLength: 101,
    sanitize: (value: string) => value.trim().toLowerCase(),
  },
  username: {
    required: false,
    pattern: patterns.username,
    sanitize: (value: string) => value.trim().toLowerCase(),
  },
};

// Main validation function
export function validate<T = unknown>(value: T, rule: ValidationRule<T>): ValidationResult<T> {
  const errors: string[] = [];
  let sanitizedValue = value;

  // Required validation
  if (rule.required && (value === null || value === undefined || value === '')) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return { isValid: true, errors: [], sanitizedValue };
  }

  // Sanitize value if sanitizer is provided
  if (rule.sanitize) {
    try {
      sanitizedValue = rule.sanitize(value);
    } catch (error) {
      errors.push('Invalid input format');
    }
  }

  // Type-specific validations
  if (typeof sanitizedValue === 'string') {
    // Length validations
    if (rule.minLength !== undefined && sanitizedValue.length < rule.minLength) {
      errors.push(`Minimum length is ${rule.minLength} characters`);
    }
    if (rule.maxLength !== undefined && sanitizedValue.length > rule.maxLength) {
      errors.push(`Maximum length is ${rule.maxLength} characters`);
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
      errors.push('Invalid format');
    }
  }

  // Custom validation
  if (rule.custom) {
    try {
      const customError = rule.custom(sanitizedValue);
      if (customError) {
        errors.push(customError);
      }
    } catch (error) {
      errors.push('Validation error');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
  };
}

// Validate multiple fields
export function validateFields<T extends Record<string, unknown>>(
  fields: Record<string, { value: unknown; rule: ValidationRule }>
): FieldsValidationResult<T> {
  const errors: Record<string, string[]> = {};
  const sanitizedValues: Record<string, unknown> = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, { value, rule }]) => {
    const result = validate(value, rule);
    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }
    sanitizedValues[fieldName] = result.sanitizedValue;
  });

  return { isValid, errors, sanitizedValues: sanitizedValues as T };
}

// Sanitize HTML content
export function sanitizeHtml(html: string): string {
  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove data: URLs that might be malicious
    .replace(/data:(?!image\/[png|jpeg|gif|webp|svg])/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object and embed tags
    .replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove form tags
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    // Remove input tags
    .replace(/<input\b[^>]*>/gi, '')
    // Remove button tags
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    // Remove link tags with javascript or data URLs
    .replace(/<a\b[^>]*href\s*=\s*["'](javascript:|data:)[^"']*["'][^>]*>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove link tags with stylesheets
    .replace(/<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi, '')
    // Remove meta tags
    .replace(/<meta\b[^>]*>/gi, '')
    // Remove base tags
    .replace(/<base\b[^>]*>/gi, '')
    // Remove title tags
    .replace(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi, '')
    // Remove head tags
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
    // Remove body tags
    .replace(/<body\b[^<]*(?:(?!<\/body>)<[^<]*)*<\/body>/gi, '')
    // Remove html tags
    .replace(/<html\b[^<]*(?:(?!<\/html>)<[^<]*)*<\/html>/gi, '')
    // Remove any remaining script-like content
    .replace(/<[^>]*script[^>]*>/gi, '')
    // Remove any remaining javascript-like content
    .replace(/javascript:/gi, '')
    // Remove any remaining data URLs that might be malicious
    .replace(/data:(?!image\/[png|jpeg|gif|webp|svg])/gi, '')
    // Trim whitespace
    .trim();
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string {
  return fileName
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    // Remove special characters that might be problematic
    .replace(/[<>:"/\\|?*]/g, '_')
    // Remove control characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    // Remove leading/trailing dots and spaces
    .replace(/^[.\s]+|[.\s]+$/g, '')
    // Limit length
    .substring(0, 255)
    // Ensure it's not empty
    || 'file';
}

// Validate file upload
export function validateFileUpload(file: File, options: FileUploadOptions = {}): ValidationResult<File> {
  const errors: string[] = [];
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`);
  }

  // Check for suspicious file names
  const sanitizedName = sanitizeFileName(file.name);
  if (sanitizedName !== file.name) {
    errors.push('File name contains invalid characters');
  }

  // Check for empty files
  if (file.size === 0) {
    errors.push('File cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: {
      ...file,
      name: sanitizedName
    }
  };
}

// Validate JSON input
export function validateJson(jsonString: string, schema?: JsonSchema): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(jsonString);
    
    // Basic JSON validation
    if (typeof parsed !== 'object' || parsed === null) {
      errors.push('JSON must be an object');
    }

    // Schema validation (basic implementation)
    if (schema) {
      // This is a simplified schema validation
      // In production, use a proper JSON schema validator like ajv
      Object.keys(schema).forEach(key => {
        if (schema[key].required && !(key in parsed)) {
          errors.push(`Required field '${key}' is missing`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: parsed
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid JSON format'],
    };
  }
}

// Validate URL parameters
export function validateUrlParams(params: Record<string, string>, rules: Record<string, ValidationRule>): ValidationResult<Record<string, unknown>> {
  const errors: string[] = [];
  const sanitizedParams: Record<string, unknown> = {};

  Object.entries(rules).forEach(([paramName, rule]) => {
    const value = params[paramName];
    const result = validate(value, rule);
    
    if (!result.isValid) {
      errors.push(...result.errors.map(error => `${paramName}: ${error}`));
    }
    
    sanitizedParams[paramName] = result.sanitizedValue;
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedParams
  };
}

// Rate limiting validation
export function validateRateLimit(identifier: string, limit: number, windowMs: number): ValidationResult<RateLimitData> {
  // This is a simplified rate limiting validation
  // In production, use Redis or similar for distributed rate limiting
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get current count from storage (localStorage for client-side, Redis for server-side)
  const stored = typeof window !== 'undefined' ? 
    localStorage.getItem(key) : 
    null;
  
  const data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
  
  // Reset if window has passed
  if (data.resetTime < now) {
    data.count = 0;
    data.resetTime = now + windowMs;
  }

  // Increment count
  data.count++;

  // Store updated data
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }

  if (data.count > limit) {
    return {
      isValid: false,
      errors: [`Rate limit exceeded. Limit: ${limit} requests per ${windowMs / 1000} seconds`],
    };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedValue: { count: data.count, resetTime: data.resetTime }
  };
}

// Export commonly used validation functions
export const validators = {
  email: (value: string) => validate(value, rules.email),
  password: (value: string) => validate(value, rules.password),
  name: (value: string) => validate(value, rules.name),
  content: (value: string) => validate(value, rules.content),
  url: (value: string) => validate(value, rules.url),
  hashtag: (value: string) => validate(value, rules.hashtag),
  username: (value: string) => validate(value, rules.username),
  file: (file: File, options?: FileUploadOptions) => validateFileUpload(file, options),
  json: (jsonString: string, schema?: JsonSchema) => validateJson(jsonString, schema),
  urlParams: (params: Record<string, string>, rules: Record<string, ValidationRule>) => validateUrlParams(params, rules),
  rateLimit: (identifier: string, limit: number, windowMs: number) => validateRateLimit(identifier, limit, windowMs),
};

// Utility functions
export const sanitizers = {
  html: sanitizeHtml,
  fileName: sanitizeFileName,
  text: (text: string) => text.trim().replace(/[<>]/g, ''),
  email: (email: string) => email.toLowerCase().trim(),
  url: (url: string) => url.trim(),
  hashtag: (hashtag: string) => hashtag.trim().toLowerCase(),
  username: (username: string) => username.trim().toLowerCase(),
};
