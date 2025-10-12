import Constants from 'expo-constants';

// Get API URL from app.json extra config
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

console.log('📡 API_URL configured as:', API_URL);