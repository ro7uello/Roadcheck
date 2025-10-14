// src/contexts/CachedApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import CacheManager from './/CacheManager';
import NetworkHelper from './/NetworkHelper';
import { API_URL } from '../../config/api';

class CachedApiService {

  constructor() {
    this.backendReady = false;
    this.initializingBackend = false;
  }

  /**
   * Ensure backend is ready before making requests
   */
  async ensureBackendReady() {
    // If already ready, return immediately
    if (this.backendReady) return true;

    // If already initializing, wait for it
    if (this.initializingBackend) {
      while (this.initializingBackend) {
        await NetworkHelper.delay(100);
      }
      return this.backendReady;
    }

    // Start initialization
    this.initializingBackend = true;

    try {
      console.log('🔄 Checking backend status...');
      const isReachable = await NetworkHelper.checkConnection(API_URL);

      if (isReachable) {
        this.backendReady = true;
        console.log('✅ Backend is ready');
      } else {
        console.log('☕ Backend appears to be sleeping, waking it up...');
        const woken = await NetworkHelper.wakeUpBackend(API_URL);
        this.backendReady = woken;

        if (woken) {
          console.log('✅ Backend is now ready');
        } else {
          console.error('❌ Could not wake backend');
        }
      }
    } catch (error) {
      console.error('❌ Backend initialization failed:', error);
      this.backendReady = false;
    } finally {
      this.initializingBackend = false;
    }

    return this.backendReady;
  }

  // ============================================
  // PROFILE METHODS
  // ============================================

  async getProfile(userId, forceRefresh = false) {
    try {
      // Try cache first unless force refresh
      if (!forceRefresh) {
        const cached = await CacheManager.getProfile(userId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      // Fetch from API
      console.log('🌐 Fetching profile from API...');
      const response = await fetch(`${API_URL}/profiles/${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Cache the result
        await CacheManager.cacheProfile(userId, result.data);
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting profile:', error);

      // Try to return stale cache on error
      const cached = await CacheManager.getProfile(userId);
      if (cached) {
        console.log('⚠️ Returning stale cache due to error');
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  async updateProfile(userId, updates) {
    try {
      // Update via API
      const response = await fetch(`${API_URL}/profiles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('access_token')}`
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        // Invalidate cache so next fetch gets fresh data
        await CacheManager.invalidateProfile(userId);
      }

      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // ============================================
  // STATS METHODS
  // ============================================

  async getStats(userId, forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await CacheManager.getStats(userId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log('🌐 Fetching stats from API...');
      const response = await fetch(`${API_URL}/user-stats/${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        await CacheManager.cacheStats(userId, result.data);
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting stats:', error);

      const cached = await CacheManager.getStats(userId);
      if (cached) {
        console.log('⚠️ Returning stale stats cache due to error');
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  async refreshStats(userId) {
    // Force refresh and invalidate cache
    await CacheManager.invalidateStats(userId);
    return this.getStats(userId, true);
  }

  // ============================================
  // SCENARIO METHODS
  // ============================================

  async getScenarios(categoryId, phaseId, forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await CacheManager.getScenarios(categoryId, phaseId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log(`🌐 Fetching scenarios for category ${categoryId}, phase ${phaseId}...`);

      // Calculate scenario ID range based on category and phase
      const startId = this.calculateStartScenarioId(categoryId, phaseId);
      const endId = startId + 9; // 10 scenarios per phase

      const response = await fetch(
        `${API_URL}/api/scenarios?start_id=${startId}&end_id=${endId}`
      );
      const scenarios = await response.json();

      if (scenarios && scenarios.length > 0) {
        await CacheManager.cacheScenarios(categoryId, phaseId, scenarios);
        return { success: true, data: scenarios, fromCache: false };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Error getting scenarios:', error);

      const cached = await CacheManager.getScenarios(categoryId, phaseId);
      if (cached) {
        console.log('⚠️ Returning stale scenarios cache due to error');
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  async getScenariosWithChoices(categoryId, phaseId, forceRefresh = false) {
    try {
      const cacheKey = `${categoryId}_${phaseId}_choices`;

      if (!forceRefresh) {
        const cached = await CacheManager.getScenarios(categoryId, phaseId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log(`🌐 Fetching scenarios with choices...`);

      const startId = this.calculateStartScenarioId(categoryId, phaseId);
      const endId = startId + 9;

      const response = await fetch(
        `${API_URL}/api/scenarios-with-choices?scenario_start=${startId}&scenario_end=${endId}`
      );
      const scenarios = await response.json();

      if (scenarios && scenarios.length > 0) {
        await CacheManager.cacheScenarios(categoryId, phaseId, scenarios);
        return { success: true, data: scenarios, fromCache: false };
      }

      return { success: false, data: [] };
    } catch (error) {
      console.error('Error getting scenarios with choices:', error);
      throw error;
    }
  }

  calculateStartScenarioId(categoryId, phaseId) {
    // Road Markings (cat 1): phases 1,2,3 → scenarios 1-30
    // Traffic Signs (cat 2): phases 4,5,6 → scenarios 31-60
    // Intersection (cat 3): phases 7,8,9 → scenarios 61-90
    // Pedestrian (cat 4): phase 10 → scenarios 91-100

    if (categoryId === 1) return (phaseId - 1) * 10 + 1;
    if (categoryId === 2) return (phaseId - 4) * 10 + 31;
    if (categoryId === 3) return (phaseId - 7) * 10 + 61;
    if (categoryId === 4) return 91; // Pedestrian always starts at 91

    return 1;
  }

  // ============================================
  // CATEGORIES & PHASES METHODS
  // ============================================

  async getCategories(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await CacheManager.getCategories();
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log('🌐 Fetching categories from API...');
      const response = await fetch(`${API_URL}/categories`);
      const result = await response.json();

      if (result.success && result.data) {
        await CacheManager.cacheCategories(result.data);
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting categories:', error);

      const cached = await CacheManager.getCategories();
      if (cached) {
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  async getPhases(categoryId, forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await CacheManager.getPhases(categoryId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log(`🌐 Fetching phases for category ${categoryId}...`);
      const response = await fetch(`${API_URL}/phases/category/${categoryId}`);
      const result = await response.json();

      if (result.success && result.data) {
        await CacheManager.cachePhases(categoryId, result.data);
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting phases:', error);

      const cached = await CacheManager.getPhases(categoryId);
      if (cached) {
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  // ============================================
  // USER PROGRESS METHODS
  // ============================================

  async getUserProgress(userId) {
    try {
      const response = await fetch(`${API_URL}/user-progress/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async updateUserProgress(progressData) {
    try {
      const response = await fetch(`${API_URL}/user-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });

      const result = await response.json();

      if (result.success) {
        // Invalidate stats cache since progress updated
        await CacheManager.invalidateStats(progressData.user_id);
      }

      return result;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // ============================================
  // 🆕 ENHANCED USER PROGRESS METHODS WITH CACHING
  // ============================================

  async getUserProgress(userId, forceRefresh = false) {
    try {
      // Try cache first unless force refresh
      if (!forceRefresh) {
        const cached = await CacheManager.getProgress(userId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log('🌐 Fetching user progress from API...');
      const response = await fetch(`${API_URL}/user-progress/${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Cache the result
        await CacheManager.cacheProgress(userId, result.data);
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting user progress:', error);

      // Try to return stale cache on error
      const cached = await CacheManager.getProgress(userId);
      if (cached) {
        console.log('⚠️ Returning stale progress cache due to error');
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  async updateUserProgress(progressData) {
    try {
      const response = await fetch(`${API_URL}/user-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });

      const result = await response.json();

      if (result.success) {
        // 🆕 Invalidate related caches
        await Promise.all([
          CacheManager.invalidateProgress(progressData.user_id),
          CacheManager.invalidateStats(progressData.user_id),
          // Also invalidate attempts cache for the specific category/phase
          CacheManager.invalidateAttempts(
            progressData.user_id,
            progressData.current_category_id,
            progressData.current_phase
          )
        ]);
      }

      return result;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // ============================================
  // 🆕 USER ATTEMPTS METHODS WITH CACHING
  // ============================================

  async getUserAttempts(userId, categoryId = null, phaseId = null, forceRefresh = false) {
    try {
      // If specific category/phase provided, try cache
      if (categoryId && phaseId && !forceRefresh) {
        const cached = await CacheManager.getAttempts(userId, categoryId, phaseId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log(`🌐 Fetching user attempts from API...`);

      // Build query params
      let url = `${API_URL}/user-attempts/${userId}`;
      const params = [];
      if (categoryId) params.push(`category_id=${categoryId}`);
      if (phaseId) params.push(`phase_id=${phaseId}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        // Cache if specific category/phase
        if (categoryId && phaseId) {
          await CacheManager.cacheAttempts(userId, categoryId, phaseId, result.data);
        }
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting user attempts:', error);

      // Try stale cache on error
      if (categoryId && phaseId) {
        const cached = await CacheManager.getAttempts(userId, categoryId, phaseId);
        if (cached) {
          console.log('⚠️ Returning stale attempts cache due to error');
          return { success: true, data: cached, fromCache: true, stale: true };
        }
      }

      throw error;
    }
  }

  // ============================================
  // 🆕 SESSION PROGRESS METHODS WITH CACHING
  // ============================================

  async getSessionProgress(sessionId, forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await CacheManager.getSessionProgress(sessionId);
        if (cached) {
          return { success: true, data: cached, fromCache: true };
        }
      }

      console.log(`🌐 Fetching session progress from API...`);
      const response = await fetch(`${API_URL}/sessions/${sessionId}/progress`);
      const result = await response.json();

      if (result.success && result.data) {
        await CacheManager.cacheSessionProgress(sessionId, result.data);
        return { ...result, fromCache: false };
      }

      return result;
    } catch (error) {
      console.error('Error getting session progress:', error);

      const cached = await CacheManager.getSessionProgress(sessionId);
      if (cached) {
        console.log('⚠️ Returning stale session cache due to error');
        return { success: true, data: cached, fromCache: true, stale: true };
      }

      throw error;
    }
  }

  // ============================================
  // 🆕 ENHANCED SCENARIO COMPLETION WITH CACHE INVALIDATION
  // ============================================

  async submitScenarioAttempt(userId, scenarioId, selectedAnswer, isCorrect) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/user-progress/scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          scenario_id: scenarioId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        })
      });

      const result = await response.json();

      if (result.success) {
        // 🆕 Invalidate all related caches
        await Promise.all([
          CacheManager.invalidateStats(userId),
          CacheManager.invalidateProgress(userId),
          // Invalidate attempts cache for all categories (since we don't know which one)
          CacheManager.invalidateAttempts(userId)
        ]);
      }

      return result;
    } catch (error) {
      console.error('Error submitting scenario attempt:', error);
      throw error;
    }
  }

  // ============================================
  // 🆕 ENHANCED PRELOAD WITH NEW CACHE TYPES
  // ============================================

  async preloadData(userId, categoryId = null, phaseId = null) {
    try {
      console.log('🚀 Preloading data...');

      const preloadPromises = [
        this.getCategories(),
        this.getProfile(userId),
        this.getStats(userId),
        this.getUserProgress(userId),  // 🆕 Preload progress
      ];

      // If category/phase provided, preload those too
      if (categoryId) {
        preloadPromises.push(this.getPhases(categoryId));

        if (phaseId) {
          preloadPromises.push(
            this.getScenarios(categoryId, phaseId),
            this.getUserAttempts(userId, categoryId, phaseId)  // 🆕 Preload attempts
          );
        }
      }

      await Promise.all(preloadPromises);

      console.log('✅ Preload complete');
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }

  // ============================================
  // 🆕 CACHE WARMING (Call this on app start or login)
  // ============================================

  async warmCache(userId) {
    try {
      console.log('🔥 Warming cache for user:', userId);

      // Warm essential caches in background
      await this.preloadData(userId);

      console.log('✅ Cache warming complete');
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }

  // ============================================
  // 🆕 SMART CACHE REFRESH (Refresh only expired items)
  // ============================================

  async refreshExpiredCaches(userId) {
    try {
      console.log('🔄 Checking for expired caches...');

      const refreshPromises = [];

      // Check and refresh each cache type
      const cachedProfile = await CacheManager.getProfile(userId);
      if (!cachedProfile) {
        refreshPromises.push(this.getProfile(userId, true));
      }

      const cachedStats = await CacheManager.getStats(userId);
      if (!cachedStats) {
        refreshPromises.push(this.getStats(userId, true));
      }

      const cachedProgress = await CacheManager.getProgress(userId);
      if (!cachedProgress) {
        refreshPromises.push(this.getUserProgress(userId, true));
      }

      if (refreshPromises.length > 0) {
        await Promise.all(refreshPromises);
        console.log(`✅ Refreshed ${refreshPromises.length} expired caches`);
      } else {
        console.log('✅ All caches are fresh');
      }
    } catch (error) {
      console.error('Error refreshing expired caches:', error);
    }
  }

  // ============================================
  // SCENARIO COMPLETION
  // ============================================

  async submitScenarioAttempt(userId, scenarioId, selectedAnswer, isCorrect) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/user-progress/scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          scenario_id: scenarioId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        })
      });

      const result = await response.json();

      if (result.success) {
        // Invalidate stats cache since new attempt was recorded
        await CacheManager.invalidateStats(userId);
      }

      return result;
    } catch (error) {
      console.error('Error submitting scenario attempt:', error);
      throw error;
    }
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  async clearAllCache() {
    await CacheManager.clearAllCache();
  }

  async getCacheInfo() {
    return await CacheManager.getCacheInfo();
  }

  async preloadData(userId) {
    try {
      console.log('🚀 Preloading data...');

      // Preload categories and profile in parallel
      await Promise.all([
        this.getCategories(),
        this.getProfile(userId),
        this.getStats(userId)
      ]);

      console.log('✅ Preload complete');
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }
}

export default new CachedApiService();