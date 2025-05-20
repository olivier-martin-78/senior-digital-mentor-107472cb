
import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Check if the navigator is available (needed for SSR compatibility)
const isNavigatorAvailable = typeof navigator !== 'undefined'

// More comprehensive mobile detection including tablets and specific browsers
export function detectMobileDevice() {
  if (!isNavigatorAvailable) return false;
  
  // Expanded detection covering more devices and browsers
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile|Tablet/i.test(navigator.userAgent);
}

// Check if the current environment has restricted storage capabilities
export function hasRestrictedStorage() {
  if (!isNavigatorAvailable) return false;
  
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return false;
  } catch (e) {
    return true;
  }
}

// Check if the device has cookies enabled
export function hasCookiesEnabled() {
  if (!isNavigatorAvailable) return true;
  return navigator.cookieEnabled;
}

// More robust detection of private browsing mode
export function isLikelyInPrivateBrowsing() {
  if (!isNavigatorAvailable) return false;
  
  // If localStorage is restricted but cookies are enabled, it's likely private browsing
  if (hasRestrictedStorage() && hasCookiesEnabled()) return true;
  
  // Safari-specific detection
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  if (isSafari) {
    try {
      // Safari in private mode has a quota of ~120KB
      const storage = window.localStorage;
      const data = '0'.repeat(100000); // ~100KB
      storage.setItem('__private_test__', data);
      storage.removeItem('__private_test__');
      return false;
    } catch (e) {
      return true;
    }
  }
  
  return false;
}

// Check connection quality/type if available
export function getConnectionInfo() {
  if (!isNavigatorAvailable) return { online: true, type: 'unknown', effectiveType: 'unknown' };
  
  const online = navigator.onLine;
  let type = 'unknown';
  let effectiveType = 'unknown';
  
  // Check connection API (available in some browsers)
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      type = conn.type || 'unknown';
      effectiveType = conn.effectiveType || 'unknown';
    }
  }
  
  return { online, type, effectiveType };
}

// Hook that returns whether the current viewport is mobile-sized
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [connectionInfo, setConnectionInfo] = React.useState(() => getConnectionInfo())

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Handle online/offline events
    const handleOnlineStatus = () => {
      setConnectionInfo(getConnectionInfo());
    };
    
    // Event listeners
    mql.addEventListener("change", onChange)
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Initial setup
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setConnectionInfo(getConnectionInfo());
    
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    }
  }, [])

  return {
    isMobileViewport: !!isMobile,
    isMobileDevice: detectMobileDevice(),
    hasStorageRestrictions: hasRestrictedStorage(),
    isPrivateBrowsing: isLikelyInPrivateBrowsing(),
    hasCookiesEnabled: hasCookiesEnabled(),
    connectionInfo: connectionInfo
  }
}
