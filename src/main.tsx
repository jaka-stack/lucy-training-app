import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';

import { SetLogger } from './screens/SetLogger';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SetLogger />
  </StrictMode>,
);
