import { useState, useCallback, useMemo } from 'react';
import { ValidationResult, ValidationRule, FieldsValidationResult } from '../types';

/**
 * Generic form validation hook with schema support
 *
 * @param initialValues - Initial form values
 * @param schema - Validation schema for each field
 * @returns Form state, errors, and validation functions
 *
 * @example
 * const { values, errors, isValid, handleChange, validate } = useFormValidation(
 *   { email: '', password: '' },
 *   {
 *     email: { required: true, pattern: /^\S+@\S+$/ },
 *     password: { required: true, minLength: 8 }
 *   }
 * );
 */
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  schema: Record<keyof T, ValidationRule>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string[]>>({} as Record<keyof T, string[]>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateField = useCallback(
    (fieldName: keyof T, value: unknown): string[] => {
      const rule = schema[fieldName];
      if (!rule) return [];

      const fieldErrors: string[] = [];

      // Required validation
      if (rule.required && (value === null || value === undefined || value === '')) {
        fieldErrors.push('This field is required');
        return fieldErrors;
      }

      // Skip other validations if empty and not required
      if (!rule.required && (value === null || value === undefined || value === '')) {
        return fieldErrors;
      }

      // Type-specific validations for strings
      if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          fieldErrors.push(`Minimum length is ${rule.minLength} characters`);
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          fieldErrors.push(`Maximum length is ${rule.maxLength} characters`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          fieldErrors.push('Invalid format');
        }
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          fieldErrors.push(customError);
        }
      }

      return fieldErrors;
    },
    [schema]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
    let formIsValid = true;

    (Object.keys(schema) as Array<keyof T>).forEach((fieldName) => {
      const fieldErrors = validateField(fieldName, values[fieldName]);
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    return formIsValid;
  }, [schema, values, validateField]);

  const handleChange = useCallback(
    (fieldName: keyof T, value: unknown) => {
      // Update value
      setValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }));

      // Mark as touched
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      // Validate field if already touched
      if (touched[fieldName]) {
        const fieldErrors = validateField(fieldName, value);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: fieldErrors,
        }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (fieldName: keyof T) => {
      // Mark as touched
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      // Validate field
      const fieldErrors = validateField(fieldName, values[fieldName]);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: fieldErrors,
      }));
    },
    [values, validateField]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string[]>);
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);

  const setFieldValue = useCallback((fieldName: keyof T, value: unknown) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  const setFieldError = useCallback((fieldName: keyof T, error: string[]) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  const isValid = useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  );

  const getFieldError = useCallback(
    (fieldName: keyof T): string | undefined => {
      return errors[fieldName]?.[0];
    },
    [errors]
  );

  const hasFieldError = useCallback(
    (fieldName: keyof T): boolean => {
      return touched[fieldName] && errors[fieldName]?.length > 0;
    },
    [touched, errors]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
    validateField,
    reset,
    setFieldValue,
    setFieldError,
    getFieldError,
    hasFieldError,
  };
}
