
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TimelinePlayer } from './TimelinePlayer';
import { TimelineData } from '@/types/timeline';

interface TimelineGamePopupProps {
  timelineData: TimelineData;
}

const TimelineGamePopup: React.FC<TimelineGamePopupProps> = ({ timelineData }) => {
  const handleExit = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <TimelinePlayer timelineData={timelineData} onExit={handleExit} />
    </div>
  );
};

export const openTimelineGamePopup = (timelineData: TimelineData) => {
  const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
  if (!newWindow) return;

  // CSS intégré directement pour assurer la compatibilité
  const inlineCSS = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body, html {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #ffffff;
      color: #000000;
      line-height: 1.5;
    }
    
    .bg-white { background-color: #ffffff !important; }
    .bg-gray-50 { background-color: #f9fafb !important; }
    .bg-gray-100 { background-color: #f3f4f6 !important; }
    .bg-gray-200 { background-color: #e5e7eb !important; }
    .bg-blue-500 { background-color: #3b82f6 !important; }
    .bg-blue-600 { background-color: #2563eb !important; }
    .bg-green-500 { background-color: #10b981 !important; }
    .bg-green-600 { background-color: #059669 !important; }
    .bg-red-500 { background-color: #ef4444 !important; }
    .bg-red-600 { background-color: #dc2626 !important; }
    
    .text-black { color: #000000 !important; }
    .text-white { color: #ffffff !important; }
    .text-gray-600 { color: #4b5563 !important; }
    .text-gray-700 { color: #374151 !important; }
    .text-gray-800 { color: #1f2937 !important; }
    .text-blue-600 { color: #2563eb !important; }
    .text-green-600 { color: #059669 !important; }
    .text-red-600 { color: #dc2626 !important; }
    
    .border { border: 1px solid #e5e7eb !important; }
    .border-gray-300 { border-color: #d1d5db !important; }
    .border-blue-500 { border-color: #3b82f6 !important; }
    .border-dashed { border-style: dashed !important; }
    
    .rounded { border-radius: 0.25rem !important; }
    .rounded-lg { border-radius: 0.5rem !important; }
    .rounded-full { border-radius: 9999px !important; }
    
    .p-2 { padding: 0.5rem !important; }
    .p-4 { padding: 1rem !important; }
    .p-6 { padding: 1.5rem !important; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem !important; }
    .px-4 { padding-left: 1rem; padding-right: 1rem !important; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem !important; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem !important; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem !important; }
    
    .m-2 { margin: 0.5rem !important; }
    .mb-2 { margin-bottom: 0.5rem !important; }
    .mb-3 { margin-bottom: 0.75rem !important; }
    .mb-4 { margin-bottom: 1rem !important; }
    .mb-6 { margin-bottom: 1.5rem !important; }
    .mt-4 { margin-top: 1rem !important; }
    .mt-6 { margin-top: 1.5rem !important; }
    .mx-auto { margin-left: auto; margin-right: auto !important; }
    
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .items-center { align-items: center !important; }
    .justify-center { justify-content: center !important; }
    .justify-between { justify-content: space-between !important; }
    .space-y-2 > * + * { margin-top: 0.5rem !important; }
    .space-y-4 > * + * { margin-top: 1rem !important; }
    .gap-2 { gap: 0.5rem !important; }
    .gap-4 { gap: 1rem !important; }
    
    .w-full { width: 100% !important; }
    .w-64 { width: 16rem !important; }
    .w-4 { width: 1rem !important; }
    .w-8 { width: 2rem !important; }
    .w-16 { width: 4rem !important; }
    .h-4 { height: 1rem !important; }
    .h-8 { height: 2rem !important; }
    .h-16 { height: 4rem !important; }
    .h-32 { height: 8rem !important; }
    .h-screen { height: 100vh !important; }
    .min-h-screen { min-height: 100vh !important; }
    .max-w-md { max-width: 28rem !important; }
    .max-w-4xl { max-width: 56rem !important; }
    
    .font-bold { font-weight: 700 !important; }
    .font-semibold { font-weight: 600 !important; }
    .text-xs { font-size: 0.75rem !important; }
    .text-sm { font-size: 0.875rem !important; }
    .text-lg { font-size: 1.125rem !important; }
    .text-xl { font-size: 1.25rem !important; }
    .text-2xl { font-size: 1.5rem !important; }
    .text-3xl { font-size: 1.875rem !important; }
    
    .cursor-grab { cursor: grab !important; }
    .cursor-pointer { cursor: pointer !important; }
    
    .transition-all { transition: all 0.15s ease-in-out !important; }
    .duration-200 { transition-duration: 200ms !important; }
    .hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
    .hover\\:bg-blue-600:hover { background-color: #2563eb !important; }
    .hover\\:bg-green-600:hover { background-color: #059669 !important; }
    
    .opacity-50 { opacity: 0.5 !important; }
    .scale-95 { transform: scale(0.95) !important; }
    .scale-105 { transform: scale(1.05) !important; }
    
    .object-cover { object-fit: cover !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .inline-block { display: inline-block !important; }
    
    button {
      background-color: #3b82f6;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background-color: #2563eb;
    }
    
    button.secondary {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    button.secondary:hover {
      background-color: #e5e7eb;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #ffffff;
      color: #000000;
      font-size: 1.125rem;
    }
    
    /* Styles pour les dialogs/modales */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .dialog-content {
      background-color: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      max-width: 28rem;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
  `;

  newWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${timelineData.timelineName}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${inlineCSS}</style>
      </head>
      <body>
        <div id="timeline-game-root">
          <div class="loading">Chargement du jeu Timeline...</div>
        </div>
      </body>
    </html>
  `);
  newWindow.document.close();

  // Attendre un court instant puis rendre le composant React
  setTimeout(() => {
    const container = newWindow.document.getElementById('timeline-game-root');
    if (container) {
      const root = createRoot(container);
      root.render(<TimelineGamePopup timelineData={timelineData} />);
    }
  }, 100);
};

export default TimelineGamePopup;
