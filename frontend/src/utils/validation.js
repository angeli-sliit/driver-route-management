import { useState } from 'react';

// Generic validation rules
export const validationRules = {
  required: (value) => ({
    isValid: value !== undefined && value !== null && value !== '',
    message: 'This field is required'
  }),
  
  email: (value) => ({
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address'
  }),
  
  phone: (value) => ({
    isValid: /^\+?[\d\s-]{10,}$/.test(value),
    message: 'Please enter a valid phone number'
  }),
  
  minLength: (min) => (value) => ({
    isValid: value.length >= min,
    message: `Must be at least ${min} characters`
  }),
  
  maxLength: (max) => (value) => ({
    isValid: value.length <= max,
    message: `Must not exceed ${max} characters`
  }),
  
  numeric: (value) => ({
    isValid: /^\d+$/.test(value),
    message: 'Must be a number'
  }),
  
  password: (value) => ({
    isValid: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value),
    message: 'Password must be at least 8 characters with letters and numbers'
  }),
  
  date: (value) => ({
    isValid: !isNaN(Date.parse(value)),
    message: 'Please enter a valid date'
  }),
  
  time: (value) => ({
    isValid: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
    message: 'Please enter a valid time (HH:MM)'
  })
};

// Specific validation rules for leave requests
export const leaveRequestValidationRules = {
  startDate: [
    (value) => !value ? 'Start date is required' : '',
    (value, values) => {
      if (values.type !== 'EMERGENCY') {
        const start = new Date(value);
        const now = new Date();
        if (start < now) return 'Start date must be in the future';
        return '';
      }
      return '';
    },
    (value, values) => {
      if (values.type !== 'EMERGENCY') {
        const start = new Date(value);
        const now = new Date();
        const hoursDiff = (start - now) / (1000 * 60 * 60);
        if (hoursDiff < 24) return 'Leave requests must be made at least 24 hours in advance';
        return '';
      }
      return '';
    }
  ],
  endDate: [
    (value) => !value ? 'End date is required' : '',
    (value, values) => {
      if (!value || !values.startDate) return '';
      const start = new Date(values.startDate);
      const end = new Date(value);
      if (end <= start) return 'End date must be after start date';
      return '';
    },
    (value, values) => {
      if (!value || !values.startDate) return '';
      const start = new Date(values.startDate);
      const end = new Date(value);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return 'Leave duration cannot exceed 30 days';
      return '';
    }
  ],
  reason: [
    (value) => !value ? 'Reason is required' : '',
    (value) => value.length < 10 ? 'Reason must be at least 10 characters long' : '',
    (value) => value.length > 500 ? 'Reason cannot exceed 500 characters' : ''
  ],
  type: [
    (value) => !value ? 'Leave type is required' : '',
    (value) => {
      const validTypes = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY'];
      if (!validTypes.includes(value)) return 'Invalid leave type';
      return '';
    }
  ]
};

// Specific validation rules for pickup confirmations
export const pickupConfirmationValidationRules = {
  weight: [
    (value) => !value ? 'Weight is required' : '',
    (value) => isNaN(value) ? 'Weight must be a number' : '',
    (value) => parseFloat(value) <= 0 ? 'Weight must be greater than 0' : '',
    (value) => parseFloat(value) > 1000 ? 'Weight seems too high. Please verify.' : ''
  ],
  amount: [
    (value) => !value ? 'Amount is required' : '',
    (value) => isNaN(value) ? 'Amount must be a number' : '',
    (value) => parseFloat(value) < 0 ? 'Amount cannot be negative' : '',
    (value) => !Number.isInteger(parseFloat(value)) ? 'Amount must be a whole number' : ''
  ],
  reason: [
    (value) => !value ? 'Reason is required' : '',
    (value) => value.length < 10 ? 'Reason must be at least 10 characters long' : '',
    (value) => value.length > 500 ? 'Reason cannot exceed 500 characters' : ''
  ]
};

// Form validation function for object-based validation rules
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const value = values[fieldName];
    
    for (const rule of fieldRules) {
      const validation = rule(value);
      if (!validation.isValid) {
        errors[fieldName] = validation.message;
        break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Form validation function for array-based validation rules
export const validateFormArray = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const value = values[fieldName];
    
    for (const rule of fieldRules) {
      const errorMessage = rule(value, values);
      if (errorMessage) {
        errors[fieldName] = errorMessage;
        break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Custom hook for form validation with object-based rules
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const validation = validateForm({ [name]: values[name] }, { [name]: validationRules[name] });
    setErrors(prev => ({
      ...prev,
      [name]: validation.errors[name]
    }));
  };
  
  const validate = () => {
    const validation = validateForm(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    setValues
  };
};

// Custom hook for form validation with array-based rules
export const useFormValidationArray = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const validation = validateFormArray({ [name]: values[name] }, { [name]: validationRules[name] });
    setErrors(prev => ({
      ...prev,
      [name]: validation.errors[name]
    }));
  };
  
  const validate = () => {
    const validation = validateFormArray(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    setValues
  };
}; 