import '@fontsource-variable/schibsted-grotesk/wght.css';
import '@fontsource/commit-mono/latin-400.css';
import '@fontsource/commit-mono/latin-500.css';
import '@fontsource/commit-mono/latin-600.css';
import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { THEME_CACHE_KEY } from './domain/models';
import './styles.css';

document.documentElement.dataset.theme = localStorage.getItem(THEME_CACHE_KEY) ?? 'system';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
