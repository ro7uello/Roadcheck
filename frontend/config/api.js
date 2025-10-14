import Constants from 'expo-constants';

// Fallback URLs
const PRODUCTION_URL = 'https://roadcheck.onrender.com';
const DEVELOPMENT_URL = 'http://10.157.121.161:3001';

// Use app.json config, or auto-detect dev/production
export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (__DEV__ ? DEVELOPMENT_URL : PRODUCTION_URL);

export const API_BASE_URL = API_URL;  // Keep in sync

console.log('📡 API_URL configured as:', API_URL);
console.log('📡 Mode:', __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION');