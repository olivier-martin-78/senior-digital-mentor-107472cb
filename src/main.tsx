console.log('🔥 [MAIN_DEBUG] main.tsx chargé - début');
console.log('🔥 [MAIN_DEBUG] Document ready state:', document.readyState);
console.log('🔥 [MAIN_DEBUG] Root element exists:', !!document.getElementById("root"));

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🔥 [MAIN_DEBUG] Imports terminés');

try {
  const rootElement = document.getElementById("root");
  console.log('🔥 [MAIN_DEBUG] Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('🔥 [MAIN_DEBUG] Création React root...');
  const root = createRoot(rootElement);
  
  console.log('🔥 [MAIN_DEBUG] Render App...');
  root.render(<App />);

  // Charger gptengineer.js uniquement après le rendu et hors iOS
  try {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    if (!isIOS) {
      const s = document.createElement('script');
      s.src = 'https://cdn.gpteng.co/gptengineer.js';
      s.type = 'module';
      s.defer = true;
      s.onerror = (e) => console.warn('gptengineer.js failed to load', e);
      document.head.appendChild(s);
      console.log('🔥 [MAIN_DEBUG] gptengineer.js ajouté (non-iOS)');
    } else {
      console.log('🔥 [MAIN_DEBUG] gptengineer.js ignoré sur iOS');
    }
  } catch (e) {
    console.warn('🔥 [MAIN_DEBUG] Erreur injection gptengineer.js', e);
  }
  
  console.log('🔥 [MAIN_DEBUG] App rendu avec succès');
} catch (error) {
  console.error('🔥 [MAIN_DEBUG] Erreur fatale dans main.tsx:', error);
  
  // Fallback d'urgence
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>Erreur de chargement mobile</h1>
        <p>Erreur: ${error.message}</p>
        <p>User Agent: ${navigator.userAgent}</p>
        <p>URL: ${window.location.href}</p>
      </div>
    `;
  }
}
