
/**
 * Utility functions for authentication
 */

/**
 * Cleans up authentication state in local/session storage
 * Prevents auth "limbo" states when logging in/out
 */
export const cleanupAuthState = () => {
  console.log('Cleaning up auth state');

  try {
    // Try to use localStorage
    try {
      // Remove standard auth tokens
      localStorage.removeItem('supabase.auth.token');
      // Remove all Supabase auth keys from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cannot access localStorage:', e);
    }

    // Try to use sessionStorage as fallback
    try {
      // Remove from sessionStorage if in use
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cannot access sessionStorage:', e);
    }

    // Try to use cookies as a last resort (needs server-side handling)
    try {
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=').map(c => c.trim());
        if (name.startsWith('supabase.auth.') || name.includes('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
    } catch (e) {
      console.warn('Cannot access cookies:', e);
    }

    // Clear memory storage fallback if it exists
    try {
      if (typeof window !== 'undefined' && (window as any).__memoryStorage) {
        Object.keys((window as any).__memoryStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            delete (window as any).__memoryStorage[key];
          }
        });
      }
    } catch (e) {
      console.warn('Cannot access memory storage:', e);
    }

  } catch (e) {
    console.error('Error during auth cleanup:', e);
  }
};

/**
 * Retries an auth operation with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> => {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, retries);
      console.log(`Auth operation failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
};

/**
 * Get environment information for debugging auth issues
 */
export const getEnvironmentInfo = () => {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  
  // Test storage availability
  let hasLocalStorage = false;
  let hasSessionStorage = false;
  
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    hasLocalStorage = true;
  } catch (e) {}
  
  try {
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    hasSessionStorage = true;
  } catch (e) {}
  
  return {
    isMobile,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    localStorage: hasLocalStorage,
    sessionStorage: hasSessionStorage,
    cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    privateBrowsingLikely: !hasLocalStorage && !hasSessionStorage,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 'unknown',
    connectionType: typeof navigator !== 'undefined' && 'connection' in navigator ? 
      (navigator as any).connection?.effectiveType : 'unknown'
  };
};

/**
 * Attempts to recover from authentication problems
 */
export const attemptAuthRecovery = async () => {
  // Clean up auth state first
  cleanupAuthState();
  
  console.log('Attempting auth recovery...');
  const env = getEnvironmentInfo();
  console.log('Environment:', env);
  
  // Reload the page if on mobile (may help with some browser issues)
  if (env.isMobile && window.location.pathname !== '/auth') {
    console.log('Redirecting to auth page for recovery...');
    window.location.href = '/auth';
    return true;
  }
  
  return false;
};
