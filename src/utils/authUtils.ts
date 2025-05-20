
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
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=').map(c => c.trim());
      if (name.startsWith('supabase.auth.') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });

  } catch (e) {
    console.error('Error during auth cleanup:', e);
  }
};

/**
 * Get environment information for debugging auth issues
 */
export const getEnvironmentInfo = () => {
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  
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
    userAgent: navigator.userAgent,
    localStorage: hasLocalStorage,
    sessionStorage: hasSessionStorage,
    cookiesEnabled: navigator.cookieEnabled,
    privateBrowsingLikely: !hasLocalStorage && !hasSessionStorage
  };
};
