
// REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
// NOTE: Ensure this is a WEB APP URL (ends in /exec), not a Library URL.
// We prefer the environment variable, but keep the hardcoded one as fallback if env fails locally.
export const API_BASE_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbzpo4kk1I5q7BlyuqOjhmeVtil_29oVdu57O0op8293ZWZFvu1BFzPkz7Lk8DqjHkjr/exec'; 

// Toggle this to false when you have deployed your backend
export const USE_MOCK_DATA = false;

export const CURRENCY_SYMBOL = '$';