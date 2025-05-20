
import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Detect if the current device is a mobile device based on user agent
export function detectMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

// Check if the current environment has restricted storage capabilities
export function hasRestrictedStorage() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return false;
  } catch (e) {
    return true;
  }
}

// Hook that returns whether the current viewport is mobile-sized
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
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
    hasStorageRestrictions: hasRestrictedStorage()
  }
}
