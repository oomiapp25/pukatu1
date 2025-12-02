
// REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
// NOTE: Ensure this is a WEB APP URL (ends in /exec), not a Library URL.

// Helper seguro para leer variables de entorno sin romper la app
const getEnvVar = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Ignorar errores en entornos antiguos
  }
  return fallback;
};

// URL de respaldo por si falla la variable de entorno
const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbzpo4kk1I5q7BlyuqOjhmeVtil_29oVdu57O0op8293ZWZFvu1BFzPkz7Lk8DqjHkjr/exec';

export const API_BASE_URL = getEnvVar('VITE_GAS_URL', DEFAULT_URL); 

// Toggle this to false when you have deployed your backend
export const USE_MOCK_DATA = false;

export const CURRENCY_SYMBOL = '$';
