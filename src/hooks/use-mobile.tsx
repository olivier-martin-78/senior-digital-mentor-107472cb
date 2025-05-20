
import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Check if the navigator is available (needed for SSR compatibility)
const isNavigatorAvailable = typeof navigator !== 'undefined'

// Detect if the current device is a mobile device based on user agent
export function detectMobileDevice() {
  if (!isNavigatorAvailable) return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
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

// Check if the device is in private browsing mode (approximation)
export function isLikelyInPrivateBrowsing() {
  if (!isNavigatorAvailable) return false;
  
  // If localStorage is restricted but cookies are enabled, it's likely private browsing
  return hasRestrictedStorage() && hasCookiesEnabled();
}

// Hook that returns whether the current viewport is mobile-sized
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return {
    isMobileViewport: !!isMobile,
    isMobileDevice: detectMobileDevice(),
    hasStorageRestrictions: hasRestrictedStorage(),
    isPrivateBrowsing: isLikelyInPrivateBrowsing(),
    hasCookiesEnabled: hasCookiesEnabled()
  }
}
