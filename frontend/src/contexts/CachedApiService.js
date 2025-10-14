import AsyncStorage from '@react-native-async-storage/async-storage';
import CacheManager from './CacheManager';
import NetworkHelper from './NetworkHelper';
import { API_URL } from '../../config/api';

class CachedApiService {
  constructor() {
    this.backendReady = false;
    this.initializingBackend = false;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // ======================================================
  // 🔧 Utility Methods
  // ======================================================

  async ensureBackendReady() {
    if (this.backendReady) return true;

    if (this.initializingBackend) {
      while (this.initializingBackend) {
        await NetworkHelper.delay(100);
      }
      return this.backendReady;
    }

    this.initializingBackend = true;

    try {
      console.log('🔄 Checking backend status...');
      const isReachable = await NetworkHelper.checkConnection(API_URL);

      if (isReachable) {
        this.backendReady = true;
        console.log('✅ Backend is ready');
      } else {
        console.log('☕ Backend sleeping, waking it up...');
        const woken = await NetworkHelper.wakeUpBackend(API_URL);
        this.backendReady = woken;
        console.log(woken ? '✅ Backend now ready' : '❌ Failed to wake backend');
      }
    } catch (error) {
      console.error('❌ Backend initialization failed:', error);
      this.backendReady = false;
    } finally {
      this.initializingBackend = false;
    }

    return this.backendReady;
  }

  // Unified request handler (includes caching, 401 handling, and fallback)
  async makeRequest(endpoint, options = {}, cacheKey = null, forceRefresh = false) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };

      // Try cache first (unless force refresh)
      if (cacheKey && !forceRefresh) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log(`📦 Using cached data for ${endpoint}`);
          return { success: true, data: cached, fromCache: true };
        }
      }

      // Ensure backend is ready
      await this.ensureBackendReady();

      console.log(`🌐 Fetching: ${API_URL}${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // Handle unauthorized
      if (response.status === 401) {
        const errorData = await response.json();
        const err = new Error(errorData.message || 'Unauthorized');
        err.status = 401;
        err.code = errorData.code;
        throw err;
      }

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();

      // Cache the successful result
      if (cacheKey && result?.data) {
        await CacheManager.set(cacheKey, result.data, this.CACHE_DURATION);
      }

      return { ...result, fromCache: false };
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error);

      // Return stale cache if available
      if (cacheKey) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log(`⚠️ Using stale cache for ${endpoint}`);
          return { success: true, data: cached, fromCache: true, stale: true };
        }
      }

      throw error;
    }
  }

  // ======================================================
  // 👤 Profile Methods
  // ======================================================

  async getProfile(userId, forceRefresh = false) {
    return this.makeRequest(`/profiles/${userId}`, {}, `profile_${userId}`, forceRefresh);
  }

  async updateProfile(userId, updates) {
    const result = await this.makeRequest(
      `/profiles/${userId}`,
      { method: 'PUT', body: updates },
      null,
      true
    );

    if (result.success) await CacheManager.invalidateProfile(userId);
    return result;
  }

  // ======================================================
  // 📊 Stats Methods
  // ======================================================

  async getStats(userId, forceRefresh = false) {
    return this.makeRequest(`/user-stats/${userId}`, {}, `stats_${userId}`, forceRefresh);
  }

  async refreshStats(userId) {
    await CacheManager.invalidateStats(userId);
    return this.getStats(userId, true);
  }

  // ======================================================
  // 🧭 Scenario Methods
  // ======================================================

  calculateStartScenarioId(categoryId, phaseId) {
    if (categoryId === 1) return (phaseId - 1) * 10 + 1;
    if (categoryId === 2) return (phaseId - 4) * 10 + 31;
    if (categoryId === 3) return (phaseId - 7) * 10 + 61;
    if (categoryId === 4) return 91;
    return 1;
  }

  async getScenarios(categoryId, phaseId, forceRefresh = false) {
    const startId = this.calculateStartScenarioId(categoryId, phaseId);
    const endId = startId + 9;
    const cacheKey = `scenarios_${categoryId}_${phaseId}`;

    return this.makeRequest(
      `/api/scenarios?start_id=${startId}&end_id=${endId}`,
      {},
      cacheKey,
      forceRefresh
    );
  }

  async getScenariosWithChoices(categoryId, phaseId, forceRefresh = false) {
    const startId = this.calculateStartScenarioId(categoryId, phaseId);
    const endId = startId + 9;
    const cacheKey = `scenarios_choices_${categoryId}_${phaseId}`;

    return this.makeRequest(
      `/api/scenarios-with-choices?scenario_start=${startId}&scenario_end=${endId}`,
      {},
      cacheKey,
      forceRefresh
    );
  }

  // ======================================================
  // 🧩 Categories & Phases
  // ======================================================

  async getCategories(forceRefresh = false) {
    return this.makeRequest('/categories', {}, 'categories', forceRefresh);
  }

  async getPhases(categoryId, forceRefresh = false) {
    return this.makeRequest(`/phases/category/${categoryId}`, {}, `phases_${categoryId}`, forceRefresh);
  }

  // ======================================================
  // 🧠 User Progress & Attempts
  // ======================================================

  async getUserProgress(userId, forceRefresh = false) {
    return this.makeRequest(`/user-progress/${userId}`, {}, `progress_${userId}`, forceRefresh);
  }

  async updateUserProgress(progressData) {
    const result = await this.makeRequest(
      '/user-progress',
      { method: 'PUT', body: progressData },
      null,
      true
    );

    if (result.success) {
      await Promise.all([
        CacheManager.invalidateProgress(progressData.user_id),
        CacheManager.invalidateStats(progressData.user_id),
        CacheManager.invalidateAttempts(progressData.user_id)
      ]);
    }

    return result;
  }

  async getUserAttempts(userId, categoryId, phaseId, forceRefresh = false) {
    const cacheKey = `attempts_${userId}_${categoryId}_${phaseId}`;
    const query = [];
    if (categoryId) query.push(`category_id=${categoryId}`);
    if (phaseId) query.push(`phase_id=${phaseId}`);

    const endpoint = `/user-attempts/${userId}${query.length ? `?${query.join('&')}` : ''}`;

    return this.makeRequest(endpoint, {}, cacheKey, forceRefresh);
  }

  async submitScenarioAttempt(userId, scenarioId, selectedAnswer, isCorrect) {
    const result = await this.makeRequest(
      '/user-progress/scenario',
      {
        method: 'POST',
        body: {
          user_id: userId,
          scenario_id: scenarioId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        }
      },
      null,
      true
    );

    if (result.success) {
      await Promise.all([
        CacheManager.invalidateStats(userId),
        CacheManager.invalidateProgress(userId),
        CacheManager.invalidateAttempts(userId)
      ]);
    }

    return result;
  }

  // ======================================================
  // 🧭 Session Progress
  // ======================================================

  async getSessionProgress(sessionId, forceRefresh = false) {
    return this.makeRequest(
      `/sessions/${sessionId}/progress`,
      {},
      `session_progress_${sessionId}`,
      forceRefresh
    );
  }

  // ======================================================
  // 🚀 Preloading / Warming
  // ======================================================

  async preloadData(userId, categoryId = null, phaseId = null) {
    try {
      console.log('🚀 Preloading data...');
      const promises = [
        this.getCategories(),
        this.getProfile(userId),
        this.getStats(userId),
        this.getUserProgress(userId),
      ];

      if (categoryId) {
        promises.push(this.getPhases(categoryId));
        if (phaseId) {
          promises.push(
            this.getScenarios(categoryId, phaseId),
            this.getUserAttempts(userId, categoryId, phaseId)
          );
        }
      }

      await Promise.all(promises);
      console.log('✅ Preload complete');
    } catch (error) {
      console.error('Preload failed:', error);
    }
  }

  async warmCache(userId) {
    console.log('🔥 Warming cache...');
    await this.preloadData(userId);
  }

  async refreshExpiredCaches(userId) {
    try {
      console.log('🔄 Checking expired caches...');
      const refreshTasks = [];

      const profile = await CacheManager.getProfile(userId);
      if (!profile) refreshTasks.push(this.getProfile(userId, true));

      const stats = await CacheManager.getStats(userId);
      if (!stats) refreshTasks.push(this.getStats(userId, true));

      const progress = await CacheManager.getProgress(userId);
      if (!progress) refreshTasks.push(this.getUserProgress(userId, true));

      if (refreshTasks.length > 0) {
        await Promise.all(refreshTasks);
        console.log(`✅ Refreshed ${refreshTasks.length} expired caches`);
      } else {
        console.log('✅ All caches fresh');
      }
    } catch (error) {
      console.error('Error refreshing caches:', error);
    }
  }

  // ======================================================
  // 🧹 Cache Management
  // ======================================================

  async clearAllCache() {
    await CacheManager.clearAllCache();
  }

  async getCacheInfo() {
    return CacheManager.getCacheInfo();
  }
}

export default new CachedApiService();
