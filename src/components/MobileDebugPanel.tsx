import React, { useEffect, useState } from 'react';

export const MobileDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('🔧 [DEBUG_PANEL] Initialisation du panneau de debug mobile');
    
    // Test basique de JavaScript
    const testJS = () => {
      try {
        console.log('🔧 [DEBUG_PANEL] Test JavaScript basique OK');
        return true;
      } catch (e) {
        console.error('🔧 [DEBUG_PANEL] Test JavaScript échoué:', e);
        return false;
      }
    };

    // Test localStorage/sessionStorage
    const testStorage = () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        console.log('🔧 [DEBUG_PANEL] Test Storage OK');
        return true;
      } catch (e) {
        console.error('🔧 [DEBUG_PANEL] Test Storage échoué:', e);
        return false;
      }
    };

    // Test fetch
    const testFetch = async () => {
      try {
        await fetch('data:text/plain;base64,dGVzdA==');
        console.log('🔧 [DEBUG_PANEL] Test Fetch OK');
        return true;
      } catch (e) {
        console.error('🔧 [DEBUG_PANEL] Test Fetch échoué:', e);
        return false;
      }
    };

    const runTests = async () => {
      const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenSize: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        jsTest: testJS(),
        storageTest: testStorage(),
        fetchTest: await testFetch(),
        location: window.location.href,
        referrer: document.referrer,
        documentReady: document.readyState
      };

      console.log('🔧 [DEBUG_PANEL] Informations complètes:', info);
      setDebugInfo(info);
    };

    runTests();
  }, []);

  // Render minimal pour ne pas interferer
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      zIndex: 9999, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '5px', 
      fontSize: '10px',
      maxWidth: '200px',
      display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
    }}>
      Debug Mobile
      {debugInfo.jsTest === false && <div>❌ JS Error</div>}
      {debugInfo.storageTest === false && <div>❌ Storage Error</div>}
      {debugInfo.fetchTest === false && <div>❌ Fetch Error</div>}
      {debugInfo.onLine === false && <div>❌ Offline</div>}
    </div>
  );
};