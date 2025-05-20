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
      localStorage.removeItem('sb-session-v2'); // New key we're using
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
      sessionStorage.removeItem('sb-session-v2'); // New key we're using
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
      if (typeof window !== 'undefined') {
        // Clear global memory storage
        if ((window as any).__memoryStorage) {
          Object.keys((window as any).__memoryStorage).forEach((key) => {
            if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
              delete (window as any).__memoryStorage[key];
            }
          });
        }
        
        // Also try to clear any indexed DB storage that might be used
        try {
          indexedDB.deleteDatabase('supabase');
        } catch (e) {}
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
  baseDelay: number = 500,
  onAttempt?: (attempt: number) => void
): Promise<T> => {
  let retries = 0;
  
  while (true) {
    try {
      if (onAttempt) onAttempt(retries + 1);
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
 * Get detailed environment information for debugging auth issues
 */
export const getEnvironmentInfo = () => {
  // Device detection
  const isMobile = typeof navigator !== 'undefined' && 
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
  
  // Network information
  let connection = 'unknown';
  let effectiveType = 'unknown';
  let downlink = 'unknown';
  let rtt = 'unknown';
  let saveData = false;
  
  try {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      connection = conn?.type || 'unknown';
      effectiveType = conn?.effectiveType || 'unknown';
      downlink = conn?.downlink || 'unknown';
      rtt = conn?.rtt || 'unknown';
      saveData = conn?.saveData || false;
    }
  } catch (e) {}
  
  // Storage capability testing
  let hasLocalStorage = false;
  let hasSessionStorage = false;
  let hasIndexedDB = false;
  let cookiesEnabled = false;
  
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
  
  try {
    hasIndexedDB = !!window.indexedDB;
  } catch (e) {}
  
  try {
    cookiesEnabled = navigator.cookieEnabled;
  } catch (e) {}
  
  return {
    device: {
      isMobile,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      vendor: typeof navigator !== 'undefined' ? navigator.vendor : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown'
    },
    network: {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connection,
      effectiveType,
      downlink,
      rtt,
      saveData
    },
    storage: {
      localStorage: hasLocalStorage,
      sessionStorage: hasSessionStorage,
      indexedDB: hasIndexedDB,
      cookiesEnabled,
      privateBrowsingLikely: !hasLocalStorage && !hasSessionStorage,
    },
    screen: {
      width: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      height: typeof window !== 'undefined' ? window.innerHeight : 'unknown',
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'unknown'
    }
  };
};

/**
 * Check connection to Supabase
 */
export const checkSupabaseConnection = async (): Promise<SupabaseConnectionResult> => {
  try {
    // Import dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    const start = Date.now();
    // Make a simple request to check connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const duration = Date.now() - start;

    if (error) {
      console.error('Supabase connection check failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return {
        success: false,
        error: error.message,
        duration,
      };
    }

    console.log(`Supabase connection check successful, duration: ${duration}ms`);
    
    return {
      success: true,
      error: null,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Supabase connection check failed:', {
      message: error instanceof Error ? error.message : 'Unknown connection error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection error: Load failed',
      duration,
    };
  }
};
/**
 * Attempts to recover from authentication problems
 */
export const attemptAuthRecovery = async () => {
  // Log detailed environment info
  const env = getEnvironmentInfo();
  console.log('Auth recovery - Environment details:', env);
  
  // Clean up auth state first
  cleanupAuthState();
  
  console.log('Attempting auth recovery...');
  
  // Check connectivity
  const connection = await checkSupabaseConnection();
  console.log('Connection test result:', connection);
  
  // If we have connectivity issues, don't try to reload
  if (!connection.success) {
    return false;
  }
  
  // Reload the page if on mobile (may help with some browser issues)
  if (env.device.isMobile && window.location.pathname !== '/auth') {
    console.log('Redirecting to auth page for recovery...');
    // Add timestamp to avoid caching issues
    window.location.href = '/auth?recovery=' + Date.now();
    return true;
  }
  
  return false;
};

/**
 * Force network activity to clear proxy caches
 */
/**
 * Interface for connectivity probe result
 */
interface ConnectivityResult {
  success: boolean;
  latency: number;
}

/**
 * Interface for Supabase connection result
 */
interface SupabaseConnectionResult {
  success: boolean;
  error: string | null;
  duration: number;
}

/**
 * Force network activity to clear proxy caches
 */
export const probeConnectivity = async (): Promise<ConnectivityResult> => {
  const startTime = Date.now();
  
  try {
    // Use Supabase URL or a reliable public endpoint instead of window.location.origin
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ton-projet.supabase.co';
    const response = await fetch(`${supabaseUrl}/health?nocache=${Date.now()}`, {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const success = response.ok;
    const latency = Date.now() - startTime;

    console.log(`Connectivity probe: ${success ? 'successful' : 'failed'}, latency: ${latency}ms`);
    
    return {
      success,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Connectivity probe failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      latency,
    };
  }
};
