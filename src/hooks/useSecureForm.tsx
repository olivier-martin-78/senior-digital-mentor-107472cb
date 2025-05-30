
import { useState } from 'react';
import { sanitizeUserData, isValidEmail, isValidUrl } from '@/utils/securityUtils';

interface UseSecureFormOptions {
  maxLength?: number;
  allowedFields?: string[];
  validateEmail?: boolean;
  validateUrl?: boolean;
}

export const useSecureForm = (options: UseSecureFormOptions = {}) => {
  const {
    maxLength = 1000,
    allowedFields = [],
    validateEmail = false,
    validateUrl = false
  } = options;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any): string | null => {
    // Vérifier si le champ est autorisé
    if (allowedFields.length > 0 && !allowedFields.includes(name)) {
      return 'Champ non autorisé';
    }

    // Vérifier la longueur
    if (typeof value === 'string' && value.length > maxLength) {
      return `La longueur ne doit pas dépasser ${maxLength} caractères`;
    }

    // Validation email
    if (validateEmail && name.toLowerCase().includes('email') && !isValidEmail(value)) {
      return 'Format d\'email invalide';
    }

    // Validation URL
    if (validateUrl && name.toLowerCase().includes('url') && value && !isValidUrl(value)) {
      return 'Format d\'URL invalide';
    }

    return null;
  };

  const validateForm = (data: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {};

    for (const [name, value] of Object.entries(data)) {
      const error = validateField(name, value);
      if (error) {
        newErrors[name] = error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
    return sanitizeUserData(data);
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return errors[fieldName];
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    validateForm,
    sanitizeFormData,
    getFieldError,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
};
