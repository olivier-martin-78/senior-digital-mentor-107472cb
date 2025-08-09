// Script de debug mobile ultra-basique qui s'exécute immédiatement
console.log('🔥 [GLOBAL_DEBUG] Script debug mobile chargé - timestamp:', Date.now());
console.log('🔥 [GLOBAL_DEBUG] URL:', window.location.href);
console.log('🔥 [GLOBAL_DEBUG] User Agent:', navigator.userAgent);
console.log('🔥 [GLOBAL_DEBUG] Platform:', navigator.platform);
console.log('🔥 [GLOBAL_DEBUG] Language:', navigator.language);
console.log('🔥 [GLOBAL_DEBUG] Online:', navigator.onLine);
console.log('🔥 [GLOBAL_DEBUG] Cookie enabled:', navigator.cookieEnabled);
console.log('🔥 [GLOBAL_DEBUG] Screen:', screen.width + 'x' + screen.height);
console.log('🔥 [GLOBAL_DEBUG] Viewport:', window.innerWidth + 'x' + window.innerHeight);
console.log('🔥 [GLOBAL_DEBUG] Document ready state:', document.readyState);

// Test si React s'exécute
window.addEventListener('load', () => {
  console.log('🔥 [GLOBAL_DEBUG] Window load event déclenché');
  
  setTimeout(() => {
    console.log('🔥 [GLOBAL_DEBUG] Check React après 1s');
    console.log('🔥 [GLOBAL_DEBUG] React present:', !!window.React);
    console.log('🔥 [GLOBAL_DEBUG] React root present:', !!document.getElementById('root'));
    console.log('🔥 [GLOBAL_DEBUG] React root content:', document.getElementById('root')?.innerHTML.slice(0, 100));
  }, 1000);
  
  setTimeout(() => {
    console.log('🔥 [GLOBAL_DEBUG] Check React après 3s');
    console.log('🔥 [GLOBAL_DEBUG] React root content après 3s:', document.getElementById('root')?.innerHTML.slice(0, 200));
  }, 3000);
});

// Capturer toutes les erreurs
window.addEventListener('error', (e) => {
  console.error('🔥 [GLOBAL_DEBUG] Erreur JS globale:', e.error, e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🔥 [GLOBAL_DEBUG] Promise rejetée:', e.reason);
});

console.log('🔥 [GLOBAL_DEBUG] Script debug mobile terminé');