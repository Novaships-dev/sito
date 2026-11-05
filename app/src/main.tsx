import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { choisirDonnees } from './donnees';
import './style.css';

const donnees = choisirDonnees();

createRoot(document.getElementById('app')!).render(
  <StrictMode><App donnees={donnees} /></StrictMode>,
);

// Hors ligne et mises à jour : la nouvelle version s'installe toute seule.
if (import.meta.env.PROD) registerSW({ immediate: true });
