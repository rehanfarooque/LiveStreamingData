import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error handling for the main application
const handleUncaughtError = (error: ErrorEvent) => {
  console.error('Uncaught error:', error);
  // You could send this to an error tracking service
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
  // You could send this to an error tracking service
};

// Set up global error handlers
window.addEventListener('error', handleUncaughtError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Create root and render the app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Clean up error handlers on page unload
window.addEventListener('beforeunload', () => {
  window.removeEventListener('error', handleUncaughtError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
});