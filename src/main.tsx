import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handlers to silently catch Firestore internal assertions 
// and quota errors to prevent the app from crashing.
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('FIRESTORE') || e.message.includes('Quota'))) {
    console.warn('Suppressed global error:', e.message);
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes('FIRESTORE') || e.reason.message.includes('Quota'))) {
    console.warn('Suppressed global rejection:', e.reason.message);
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
