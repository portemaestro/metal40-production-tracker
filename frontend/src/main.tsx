import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update when new version is available
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App pronta per uso offline');
  },
  onRegisteredSW(_swUrl, registration) {
    // Check for updates every hour
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
