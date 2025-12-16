// RENTHIVE/client/src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
// You will create an App.jsx file in the same directory for routing
import App from './App'; 

// Get the root element from public/index.html
const container = document.getElementById('root');
const root = createRoot(container);

// Render your main application component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);