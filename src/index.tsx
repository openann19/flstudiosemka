/**
 * React entry point for FL Studio Web DAW
 * Strict TypeScript implementation
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FLStudioApp } from './components/FLStudioApp';
import { initializeWorkflowSystems } from './utils/integrationHelpers';
import './styles/index.css';

// Initialize workflow systems
initializeWorkflowSystems();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <FLStudioApp />
  </React.StrictMode>
);

