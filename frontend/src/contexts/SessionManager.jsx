// SessionManager.jsx - WITH CACHE INTEGRATION
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

  const getDisplayPhaseNumber = () => {
    if (categoryId === 1) return phaseId;
    if (categoryId === 2) return phaseId - 3;
    if (categoryId === 3) return phaseId - 6;
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

      // 🚀 Preload scenarios from cache while starting session
      const scenariosPromise = loadScenarios();

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

        await loadSessionProgress(result.data.id);
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

  // 📦 Load scenarios with cache
  const loadScenarios = async () => {
    try {
      console.log(`🚀 Loading scenarios for category ${categoryId}, phase ${phaseId}...`);
      const startTime = Date.now();

      const result = await CachedApiService.getScenariosWithChoices(categoryId, phaseId);

      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Scenarios loaded in ${loadTime}ms ${result.fromCache ? '📦' : '🌐'}`);

      if (result.success && result.data) {
        setScenarios(result.data);
        setScenariosLoaded(true);
        console.log(`✅ Loaded ${result.data.length} scenarios`);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const loadSessionProgress = async (sessionId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/sessions/${sessionId}/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSessionProgress(result.data.scenarios);
        setCurrentScenario(result.data.summary.current_scenario);
      }
    } catch (error) {
      console.error('Error loading session progress:', error);
    }
  };

  const updateScenarioProgress = async (scenarioId, selectedAnswer, isCorrect) => {
    if (!sessionData) return;

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

      // Update session progress
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
        console.log('✅ Scenario progress updated');

        // 🚀 Invalidate stats cache since progress changed
        if (isCorrect) {
          await CachedApiService.refreshStats(userId);
          console.log('🔄 Stats cache refreshed');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update progress:', response.status, errorText);
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

  const completeSession = async () => {
    if (!sessionData) return null;

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

        // 🚀 Invalidate stats cache after session completion
        await CachedApiService.refreshStats(userId);
        console.log('🔄 Stats cache refreshed after session');

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
        console.error('Failed to complete session:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error completing session:', error);
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

  const value = {
    sessionData,
    sessionProgress,
    currentScenario,
    scenarios,
    scenariosLoaded,
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    getCurrentScenarioData,
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

        {/* Progression Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {categoryName} - Phase {displayPhaseNumber}
          </Text>
          <View style={styles.progressRight}>
            <Text style={styles.progressNumber}>
              Scenario {currentScenario} / 10
            </Text>
            {scenariosLoaded && (
              <View style={styles.cacheIndicator}>
                <Text style={styles.cacheText}>📦</Text>
              </View>
            )}
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