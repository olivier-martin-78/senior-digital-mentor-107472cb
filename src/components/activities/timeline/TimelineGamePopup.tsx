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
    <div className="min-h-screen bg-background">
      <TimelinePlayer timelineData={timelineData} onExit={handleExit} />
    </div>
  );
};

export const openTimelineGamePopup = (timelineData: TimelineData) => {
  const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
  if (!newWindow) return;

  newWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${timelineData.timelineName}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body, html { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="timeline-game-root">
          <div class="loading">Chargement du jeu...</div>
        </div>
      </body>
    </html>
  `);
  newWindow.document.close();

  // Import styles and create React app in the new window
  const linkElement = newWindow.document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = '/src/index.css';
  newWindow.document.head.appendChild(linkElement);

  // Wait for styles to load then render React component
  linkElement.onload = () => {
    const container = newWindow.document.getElementById('timeline-game-root');
    if (container) {
      const root = createRoot(container);
      root.render(<TimelineGamePopup timelineData={timelineData} />);
    }
  };
};

export default TimelineGamePopup;