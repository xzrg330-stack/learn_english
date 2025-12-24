
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminApp } from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      {/* Provide onNavigate to satisfy AppProps requirement and handle view transitions */}
      <AdminApp onNavigate={(view) => {
        if (view === 'reader') {
          window.location.href = '/';
        }
      }} />
    </React.StrictMode>
  );
}