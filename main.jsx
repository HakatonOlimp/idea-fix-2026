import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { sharedState } from './sharedState';

// ЭТА СТРОКА ДОЛЖНА БЫТЬ ДО рендера
sharedState.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
