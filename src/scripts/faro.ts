import { initInstrumentation } from '../lib/utils/faro';

function initializeFaro() {
  try {
    initInstrumentation();
  } catch (error) {
    console.error('Feil ved initialisering av Faro:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFaro);
} else {
  initializeFaro();
}
