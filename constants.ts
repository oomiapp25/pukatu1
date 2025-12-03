
// Helper seguro para leer variables de entorno sin romper la app
const getEnvVar = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key] || fallback;
    }
  } catch (e) {
    return fallback;
  }
  return fallback;
};

// URL DE RESPALDO (HARDCODED) - ACTUALIZADA CON TU NUEVO SCRIPT
const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbx0AVjCaO-d45BBEZ4Hfdeqk0EfYE_eewwny0njIwQ21FRRL8EN92WoqVbmeezEjhQn/exec';

// Intentamos leer de Vercel, si no existe (porque falló la config), usamos la DEFAULT_URL
export const API_BASE_URL = getEnvVar('VITE_GAS_URL', DEFAULT_URL); 

// URL DEL WEBHOOK DE ZAPIER (Opcional)
// Puedes configurar esto en Vercel como VITE_ZAPIER_WEBHOOK_URL
export const ZAPIER_WEBHOOK_URL = getEnvVar('VITE_ZAPIER_WEBHOOK_URL', '');

// Toggle this to false when you have deployed your backend
export const USE_MOCK_DATA = false;

export const CURRENCY_SYMBOL = '$';
