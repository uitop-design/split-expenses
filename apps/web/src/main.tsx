import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <h1 className="p-6 text-2xl font-semibold">Split Expenses</h1>
  </StrictMode>,
);
