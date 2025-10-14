// src/utils/CacheManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  USER_PROFILE: 'cache_user_profile',
  USER_STATS: 'cache_user_stats',
  SCENARIOS: 'cache_scenarios',
  CATEGORIES: 'cache_categories',
  PHASES: 'cache_phases',
};

const CACHE_DURATION = {
  PROFILE: 5 * 60 * 1000,      // 5 minutes
  STATS: 2 * 60 * 1000,        // 2 minutes
  SCENARIOS: 60 * 60 * 1000,   // 1 hour (scenarios rarely change)
  CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours
  PHASES: 24 * 60 * 60 * 1000,     // 24 hours
};

class CacheManager {
  constructor() {
    // In-memory cache for fastest access
    this.memoryCache = {
      profile: null,
      stats: null,
      scenarios: {},
      categories: null,
      phases: {},
    };
  }

  // ============================================
  // PROFILE CACHING
  // ============================================

  async cacheProfile(userId, profileData) {
    try {
      const cacheData = {
        data: profileData,
        timestamp: Date.now(),
        userId: userId
      };

      // Store in memory
      this.memoryCache.profile = cacheData;

      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem(
        `${CACHE_KEYS.USER_PROFILE}_${userId}`,
        JSON.stringify(cacheData)
      );

      console.log('✅ Profile cached successfully');
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }

  async getProfile(userId) {
    try {
      // Check memory cache first (fastest)
      if (this.memoryCache.profile &&
          this.memoryCache.profile.userId === userId &&
          !this.isCacheExpired(this.memoryCache.profile.timestamp, CACHE_DURATION.PROFILE)) {
        console.log('📦 Profile loaded from memory cache');
        return this.memoryCache.profile.data;
      }

      // Check AsyncStorage cache
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.USER_PROFILE}_${userId}`);
      if (cached) {
        const cacheData = JSON.parse(cached);

        if (!this.isCacheExpired(cacheData.timestamp, CACHE_DURATION.PROFILE)) {
          // Restore to memory cache
          this.memoryCache.profile = cacheData;
          console.log('📦 Profile loaded from AsyncStorage cache');
          return cacheData.data;
        } else {
          console.log('⏰ Profile cache expired');
        }
      }

      return null; // Cache miss
    } catch (error) {
      console.error('Error getting cached profile:', error);
      return null;
    }
  }

  async invalidateProfile(userId) {
    this.memoryCache.profile = null;
    await AsyncStorage.removeItem(`${CACHE_KEYS.USER_PROFILE}_${userId}`);
    console.log('🗑️ Profile cache invalidated');
  }

  // ============================================
  // STATS CACHING
  // ============================================

  async cacheStats(userId, statsData) {
    try {
      const cacheData = {
        data: statsData,
        timestamp: Date.now(),
        userId: userId
      };

      this.memoryCache.stats = cacheData;
      await AsyncStorage.setItem(
        `${CACHE_KEYS.USER_STATS}_${userId}`,
        JSON.stringify(cacheData)
      );

      console.log('✅ Stats cached successfully');
    } catch (error) {
      console.error('Error caching stats:', error);
    }
  }

  async getStats(userId) {
    try {
      // Check memory cache
      if (this.memoryCache.stats &&
          this.memoryCache.stats.userId === userId &&
          !this.isCacheExpired(this.memoryCache.stats.timestamp, CACHE_DURATION.STATS)) {
        console.log('📦 Stats loaded from memory cache');
        return this.memoryCache.stats.data;
      }

      // Check AsyncStorage
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.USER_STATS}_${userId}`);
      if (cached) {
        const cacheData = JSON.parse(cached);

        if (!this.isCacheExpired(cacheData.timestamp, CACHE_DURATION.STATS)) {
          this.memoryCache.stats = cacheData;
          console.log('📦 Stats loaded from AsyncStorage cache');
          return cacheData.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached stats:', error);
      return null;
    }
  }

  async invalidateStats(userId) {
    this.memoryCache.stats = null;
    await AsyncStorage.removeItem(`${CACHE_KEYS.USER_STATS}_${userId}`);
    console.log('🗑️ Stats cache invalidated');
  }

  // ============================================
  // SCENARIOS CACHING
  // ============================================

  async cacheScenarios(categoryId, phaseId, scenariosData) {
    try {
      const cacheKey = `${categoryId}_${phaseId}`;
      const cacheData = {
        data: scenariosData,
        timestamp: Date.now(),
        categoryId,
        phaseId
      };

      this.memoryCache.scenarios[cacheKey] = cacheData;
      await AsyncStorage.setItem(
        `${CACHE_KEYS.SCENARIOS}_${cacheKey}`,
        JSON.stringify(cacheData)
      );

      console.log(`✅ Scenarios cached for category ${categoryId}, phase ${phaseId}`);
    } catch (error) {
      console.error('Error caching scenarios:', error);
    }
  }

  async getScenarios(categoryId, phaseId) {
    try {
      const cacheKey = `${categoryId}_${phaseId}`;

      // Check memory cache
      if (this.memoryCache.scenarios[cacheKey] &&
          !this.isCacheExpired(
            this.memoryCache.scenarios[cacheKey].timestamp,
            CACHE_DURATION.SCENARIOS
          )) {
        console.log(`📦 Scenarios loaded from memory cache (${cacheKey})`);
        return this.memoryCache.scenarios[cacheKey].data;
      }

      // Check AsyncStorage
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.SCENARIOS}_${cacheKey}`);
      if (cached) {
        const cacheData = JSON.parse(cached);

        if (!this.isCacheExpired(cacheData.timestamp, CACHE_DURATION.SCENARIOS)) {
          this.memoryCache.scenarios[cacheKey] = cacheData;
          console.log(`📦 Scenarios loaded from AsyncStorage cache (${cacheKey})`);
          return cacheData.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached scenarios:', error);
      return null;
    }
  }

  // ============================================
  // CATEGORIES CACHING
  // ============================================

  async cacheCategories(categoriesData) {
    try {
      const cacheData = {
        data: categoriesData,
        timestamp: Date.now()
      };

      this.memoryCache.categories = cacheData;
      await AsyncStorage.setItem(
        CACHE_KEYS.CATEGORIES,
        JSON.stringify(cacheData)
      );

      console.log('✅ Categories cached successfully');
    } catch (error) {
      console.error('Error caching categories:', error);
    }
  }

  async getCategories() {
    try {
      // Check memory cache
      if (this.memoryCache.categories &&
          !this.isCacheExpired(
            this.memoryCache.categories.timestamp,
            CACHE_DURATION.CATEGORIES
          )) {
        console.log('📦 Categories loaded from memory cache');
        return this.memoryCache.categories.data;
      }

      // Check AsyncStorage
      const cached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
      if (cached) {
        const cacheData = JSON.parse(cached);

        if (!this.isCacheExpired(cacheData.timestamp, CACHE_DURATION.CATEGORIES)) {
          this.memoryCache.categories = cacheData;
          console.log('📦 Categories loaded from AsyncStorage cache');
          return cacheData.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached categories:', error);
      return null;
    }
  }

  // ============================================
  // PHASES CACHING
  // ============================================

  async cachePhases(categoryId, phasesData) {
    try {
      const cacheData = {
        data: phasesData,
        timestamp: Date.now(),
        categoryId
      };

      this.memoryCache.phases[categoryId] = cacheData;
      await AsyncStorage.setItem(
        `${CACHE_KEYS.PHASES}_${categoryId}`,
        JSON.stringify(cacheData)
      );

      console.log(`✅ Phases cached for category ${categoryId}`);
    } catch (error) {
      console.error('Error caching phases:', error);
    }
  }

  async getPhases(categoryId) {
    try {
      // Check memory cache
      if (this.memoryCache.phases[categoryId] &&
          !this.isCacheExpired(
            this.memoryCache.phases[categoryId].timestamp,
            CACHE_DURATION.PHASES
          )) {
        console.log(`📦 Phases loaded from memory cache (category ${categoryId})`);
        return this.memoryCache.phases[categoryId].data;
      }

      // Check AsyncStorage
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.PHASES}_${categoryId}`);
      if (cached) {
        const cacheData = JSON.parse(cached);

        if (!this.isCacheExpired(cacheData.timestamp, CACHE_DURATION.PHASES)) {
          this.memoryCache.phases[categoryId] = cacheData;
          console.log(`📦 Phases loaded from AsyncStorage cache (category ${categoryId})`);
          return cacheData.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached phases:', error);
      return null;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  isCacheExpired(timestamp, duration) {
    return (Date.now() - timestamp) > duration;
  }

  async clearAllCache() {
    try {
      // Clear memory cache
      this.memoryCache = {
        profile: null,
        stats: null,
        scenarios: {},
        categories: null,
        phases: {},
      };

      // Clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith('cache_')
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      const info = {
        totalCacheItems: cacheKeys.length,
        memoryCache: {
          hasProfile: !!this.memoryCache.profile,
          hasStats: !!this.memoryCache.stats,
          scenarioCount: Object.keys(this.memoryCache.scenarios).length,
          hasCategories: !!this.memoryCache.categories,
          phaseCount: Object.keys(this.memoryCache.phases).length,
        }
      };

      return info;
    } catch (error) {
      console.error('Error getting cache info:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new CacheManager();