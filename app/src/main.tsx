import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { choisirDonnees, modeAndroid } from './donnees';
import './style.css';

const donnees = choisirDonnees();
const android = modeAndroid();
document.documentElement.dataset.mode = android ? 'android' : 'web';

createRoot(document.getElementById('app')!).render(
  <StrictMode><App donnees={donnees} android={android} /></StrictMode>,
);

// Hors ligne et mises à jour : la nouvelle version s'installe toute seule.
if (import.meta.env.PROD) registerSW({ immediate: true });
