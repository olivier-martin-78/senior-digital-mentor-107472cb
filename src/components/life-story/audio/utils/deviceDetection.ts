
export const detectDevice = () => {
  // Détecter spécifiquement iPad (différent d'iPhone)
  const isIPad = /iPad/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Détecter spécifiquement iPhone
  const isIPhone = /iPhone/.test(navigator.userAgent);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  return { isIPad, isIPhone, isIOS };
};

export const getTimeoutDuration = (isIPad: boolean, isIPhone: boolean, isIOS: boolean): number => {
  return isIPad ? 2000 : (isIPhone ? 2000 : (isIOS ? 3000 : 8000));
};
