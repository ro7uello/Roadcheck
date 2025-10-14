// src/utils/NetworkHelper.js - Add retry logic and better error handling

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class NetworkHelper {
  /**
   * Fetch with automatic retry on network errors
   */
  static async fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    try {
      console.log(`🌐 Fetching: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ Success: ${url}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Fetch failed: ${url}`, error.message);
      
      // Check if it's a network error and we have retries left
      if (error.message.includes('Network request failed') || 
          error.message.includes('Failed to fetch') ||
          error.name === 'AbortError') {
        
        if (retries > 0) {
          console.log(`🔄 Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
          await this.delay(RETRY_DELAY);
          return this.fetchWithRetry(url, options, retries - 1);
        } else {
          console.error('❌ All retries exhausted');
          throw new Error('Network connection failed. Please check your internet and try again.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if backend is reachable
   */
  static async checkConnection(apiUrl) {
    try {
      console.log('🔍 Testing backend connection...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${apiUrl}/categories`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Backend is reachable');
        return true;
      } else {
        console.warn('⚠️ Backend responded but with error:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Backend connection failed:', error.message);
      return false;
    }
  }

  /**
   * Wake up backend if it's sleeping (for services like Render, Railway, etc.)
   */
  static async wakeUpBackend(apiUrl) {
    try {
      console.log('☕ Waking up backend...');
      
      // Make a simple request to wake up the server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for cold start
      
      await fetch(`${apiUrl}/categories`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('✅ Backend is awake');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to wake backend:', error.message);
      return false;
    }
  }

  /**
   * Helper delay function
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error) {
    return error.message.includes('Network request failed') ||
           error.message.includes('Failed to fetch') ||
           error.name === 'AbortError' ||
           error.message.includes('timeout');
  }
}

export default NetworkHelper;