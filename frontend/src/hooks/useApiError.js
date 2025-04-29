import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const useApiError = () => {
  const [error, setError] = useState(null);
  
  const handleError = useCallback((err) => {
    const errorMsg = err.response?.data?.error || err.message || 'An unexpected error occurred';
    toast.error(errorMsg);
    setError(errorMsg);
    return errorMsg;
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

export default useApiError; 