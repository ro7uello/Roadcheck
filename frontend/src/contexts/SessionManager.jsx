// SessionManager.jsx - FULLY OPTIMIZED WITH CACHING - FIXED
import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import CachedApiService from './CachedApiService';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children, categoryId, phaseId, categoryName }) => {
  const [sessionData, setSessionData] = useState(null);
  const [sessionProgress, setSessionProgress] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [scenarioStartTime, setScenarioStartTime] = useState(Date.now());
  const [scenarios, setScenarios] = useState([]);
  const [scenariosLoaded, setScenariosLoaded] = useState(false);
  const [cacheStatus, setCacheStatus] = useState({ scenarios: false, session: false });

  const getDisplayPhaseNumber = () => {
    if (categoryId === 1) return phaseId;
    if (categoryId === 2) return phaseId - 3;
    if (categoryId === 3) return phaseId - 9;
    if (categoryId === 4) return 1;
    return phaseId;
  };

  const displayPhaseNumber = getDisplayPhaseNumber();

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');

      if (!userId || !token) {
        console.warn('No user ID or token found');
        return;
      }

      console.log('🔍 Initializing session with userId:', userId);

      // 🚀 Load scenarios from cache first (parallel with session creation)
      const scenariosPromise = loadScenariosOptimized();

      // Start session
      const response = await fetch(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          category_id: categoryId,
          phase_id: phaseId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSessionData(result.data);
        console.log('✅ Session initialized:', result.data.id);

        // 🔥 CRITICAL: Immediately warm the session cache for result page
        // This runs in background, doesn't block UI
        CachedApiService.getSessionProgress(result.data.id)
          .then(() => {
            console.log('📦 Session cache warmed up');
            setCacheStatus(prev => ({ ...prev, session: true }));
          })
          .catch(err => console.log('⚠️ Session cache warm failed (non-critical):', err));

        // Load current session progress
        await loadSessionProgressOptimized(result.data.id);
      } else {
        const errorText = await response.text();
        console.error('Failed to initialize session:', response.status, errorText);
      }

      // Wait for scenarios to load
      await scenariosPromise;

    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  // ✅ FIXED: Load scenarios with better caching
  const loadScenariosOptimized = async () => {
    try {
      console.log(`🚀 Loading scenarios for category ${categoryId}, phase ${phaseId}...`);
      const startTime = Date.now();

      // Try to get scenarios with choices (cached)
      const result = await CachedApiService.getScenariosWithChoices(categoryId, phaseId);

      const loadTime = Date.now() - startTime;

      if (result.fromCache) {
        console.log(`⚡ INSTANT! Scenarios loaded from cache in ${loadTime}ms`);
        setCacheStatus(prev => ({ ...prev, scenarios: true }));
      } else {
        console.log(`🌐 Scenarios loaded from API in ${loadTime}ms`);
        setCacheStatus(prev => ({ ...prev, scenarios: false }));
      }

      if (result.success && result.data && result.data.length > 0) {
        setScenarios(result.data);
        setScenariosLoaded(true);
        console.log(`✅ Loaded ${result.data.length} scenarios`);
        return true;
      } else {
        // Check if it's actually an error or just empty data
        if (result.success && result.data && result.data.length === 0) {
          console.log('ℹ️ No scenarios available for this category yet');
        } else {
          console.error('❌ Failed to load scenarios');
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error loading scenarios:', error);
      setCacheStatus(prev => ({ ...prev, scenarios: false }));
      return false;
    }
  };

  // 🆕 OPTIMIZED: Load session progress with caching
  const loadSessionProgressOptimized = async (sessionId) => {
    try {
      console.log('📊 Loading session progress...');
      const startTime = Date.now();

      // Use cached API service
      const result = await CachedApiService.getSessionProgress(sessionId);

      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Session progress loaded in ${loadTime}ms ${result.fromCache ? '📦' : '🌐'}`);

      if (result.success && result.data) {
        setSessionProgress(result.data.scenarios || []);
        setCurrentScenario(result.data.summary?.current_scenario || 1);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error loading session progress:', error);
      return false;
    }
  };

  // 🆕 OPTIMIZED: Update scenario progress with cache management
  const updateScenarioProgress = async (scenarioId, selectedAnswer, isCorrect) => {
    if (!sessionData) {
      console.warn('⚠️ No session data available');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');
      const currentTime = Date.now();
      const timeTaken = Math.round((currentTime - scenarioStartTime) / 1000);

      console.log('📝 Updating scenario progress:', {
        sessionId: sessionData.id,
        scenarioId,
        selectedAnswer,
        isCorrect,
        timeTaken
      });

      // 1️⃣ Submit attempt using cached API (auto-invalidates caches)
      await CachedApiService.submitScenarioAttempt(
        userId,
        scenarioId,
        selectedAnswer,
        isCorrect
      );
      console.log('✅ Attempt submitted via CachedApiService');

      // 2️⃣ Update session scenario progress
      const response = await fetch(
        `${API_URL}/sessions/${sessionData.id}/scenario/${scenarioId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scenario_id: scenarioId,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            time_taken_seconds: timeTaken
          })
        }
      );

      if (response.ok) {
        console.log('✅ Session scenario progress updated');

        // 3️⃣ 🔥 CRITICAL: Refresh session cache in background for result page
        // This ensures result page will load instantly when user finishes
        CachedApiService.getSessionProgress(sessionData.id, true)
          .then(() => {
            console.log('🔄 Session cache refreshed for result page');
          })
          .catch(err => {
            console.warn('⚠️ Session cache refresh failed (non-critical):', err);
          });

        // 4️⃣ Update local state
        const updatedProgress = [...sessionProgress];
        const progressIndex = updatedProgress.findIndex(
          p => p.scenario_id === scenarioId || p.scenario_number === currentScenario
        );

        if (progressIndex >= 0) {
          updatedProgress[progressIndex] = {
            ...updatedProgress[progressIndex],
            is_attempted: true,
            is_correct: isCorrect,
            selected_answer: selectedAnswer,
            time_taken_seconds: timeTaken
          };
        } else {
          updatedProgress.push({
            scenario_id: scenarioId,
            scenario_number: currentScenario,
            is_attempted: true,
            is_correct: isCorrect,
            selected_answer: selectedAnswer,
            time_taken_seconds: timeTaken
          });
        }

        setSessionProgress(updatedProgress);

      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update session progress:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error updating scenario progress:', error);
    }
  };

  const moveToNextScenario = () => {
    console.log('➡️ Moving from scenario', currentScenario, 'to', currentScenario + 1);
    if (currentScenario < 10) {
      setCurrentScenario(currentScenario + 1);
      setScenarioStartTime(Date.now());
    }
  };

  // 🆕 OPTIMIZED: Complete session with cache refresh
  const completeSession = async () => {
    if (!sessionData) {
      console.warn('⚠️ No session data available');
      return null;
    }

    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('userId');
      const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);
      const correctCount = sessionProgress.filter(s => s.is_correct).length;
      const totalScore = Math.round((correctCount / 10) * 100);

      console.log('🏁 Completing session:', {
        sessionId: sessionData.id,
        totalTime,
        totalScore,
        correctCount
      });

      const response = await fetch(`${API_URL}/sessions/${sessionData.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          total_time_seconds: totalTime,
          total_score: totalScore
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Session completed successfully');

        // 🔥 CRITICAL: Final cache refresh before going to result page
        // This ensures result page has the absolute latest data
        await CachedApiService.getSessionProgress(sessionData.id, true);
        console.log('📦 Final session cache refresh complete');

        // Also refresh user stats and progress
        await Promise.all([
          CachedApiService.getUserProgress(userId, true),
          CachedApiService.refreshStats(userId)
        ]);
        console.log('🔄 User progress and stats refreshed');

        return {
          sessionId: sessionData.id,
          categoryId: sessionData.category_id,
          phaseId: sessionData.phase_id,
          categoryName: categoryName,
          totalTime,
          totalScore,
          correctCount,
          scenarioProgress: JSON.stringify(sessionProgress),
          attempts: sessionProgress.map(s => ({
            scenario_id: s.scenario_id,
            is_correct: s.is_correct,
            selected_answer: s.selected_answer,
            time_taken: s.time_taken_seconds
          }))
        };
      } else {
        console.error('❌ Failed to complete session:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error completing session:', error);
      return null;
    }
  };

  // Get current scenario data
  const getCurrentScenarioData = () => {
    if (!scenariosLoaded || scenarios.length === 0) {
      return null;
    }
    return scenarios[currentScenario - 1] || null;
  };

  // 🆕 Get cache performance info
  const getCacheInfo = () => {
    return cacheStatus;
  };

  const value = {
    sessionData,
    sessionProgress,
    currentScenario,
    scenarios,
    scenariosLoaded,
    cacheStatus,
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    getCurrentScenarioData,
    getCacheInfo,
    getScenarioProgress: (scenarioNum) => {
      return sessionProgress.find(s => s.scenario_number === scenarioNum) || {
        is_attempted: false,
        is_correct: false
      };
    }
  };

  return (
    <SessionContext.Provider value={value}>
      <View style={styles.container}>
        {children}

        {/* Progression Indicator with Cache Status */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {categoryName} - Phase {displayPhaseNumber}
          </Text>
          <View style={styles.progressRight}>
            <Text style={styles.progressNumber}>
              Scenario {currentScenario} / 10
            </Text>
            {/* Cache indicators */}
            <View style={styles.cacheIndicators}>
              {scenariosLoaded && cacheStatus.scenarios && (
                <View style={styles.cacheIndicator}>
                  <Text style={styles.cacheText}>📦</Text>
                </View>
              )}
              {cacheStatus.session && (
                <View style={[styles.cacheIndicator, { backgroundColor: '#60a5fa' }]}>
                  <Text style={styles.cacheText}>⚡</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </SessionContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressNumber: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cacheIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  cacheIndicator: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  cacheText: {
    fontSize: 10,
  },
});