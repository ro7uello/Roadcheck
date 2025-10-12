// C:\Users\wahoo\Desktop\roadcheck\frontend\src\contexts\SessionManager.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';

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

  // Convert database phase ID to display phase number
  // Road Markings (cat 1): phase IDs 1,2,3 → display 1,2,3
  // Traffic Signs (cat 2): phase IDs 4,5,6 → display 1,2,3
  // Intersection (cat 3): phase IDs 7,8,9 → display 1,2,3
  // Pedestrian (cat 4): phase ID 10 → display 1
  const getDisplayPhaseNumber = () => {
    if (categoryId === 1) return phaseId;           // Road Markings
    if (categoryId === 2) return phaseId - 3;       // Traffic Signs
    if (categoryId === 3) return phaseId - 6;       // Intersection
    if (categoryId === 4) return 1;                 // Pedestrian (always Phase 1)
    return phaseId;
  };

  const displayPhaseNumber = getDisplayPhaseNumber();

  // Initialize session when component mounts
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Get userId from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('access_token');

      if (!userId || !token) {
        console.warn('No user ID or token found');
        return;
      }

      console.log('🔍 Initializing session with userId:', userId);

      // Start a new session
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

      console.log('Session start response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        setSessionData(result.data);
        console.log('Session initialized:', result.status);

        // Load initial progress
        await loadSessionProgress(result.data.id);
      } else {
        const errorText = await response.text();
        console.error('Failed to initialize session:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
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
      const currentTime = Date.now();
      const timeTaken = Math.round((currentTime - scenarioStartTime) / 1000);

      console.log('🔍 API CALL:', {
        url: `${API_URL}/sessions/${sessionData.id}/scenario/${scenarioId}`,
        body: {
          scenario_id: scenarioId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_taken_seconds: timeTaken
        }
      });

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

      const responseText = await response.text();
      console.log('🔍 API RESPONSE:', response.status, responseText);

      if (response.ok) {
        console.log(`Scenario ${currentScenario} progress updated`);
      } else {
        console.error('❌ API ERROR:', response.status, responseText);
      }
    } catch (error) {
      console.error('❌ Error updating scenario progress:', error);
    }
  };

  const moveToNextScenario = () => {
    console.log('Moving from scenario', currentScenario, 'to', currentScenario + 1);
    if (currentScenario < 10) {
      setCurrentScenario(currentScenario + 1);
      setScenarioStartTime(Date.now()); // Reset timer for next scenario
    }
    console.log('New current scenario:', currentScenario + 1);
  };

  const completeSession = async () => {
    if (!sessionData) return null;

    try {
      const token = await AsyncStorage.getItem('access_token');
      const totalTime = Math.round((Date.now() - sessionStartTime) / 1000);
      const correctCount = sessionProgress.filter(s => s.is_correct).length;
      const totalScore = Math.round((correctCount / 10) * 100);

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

        // Return session results for result page
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

  const value = {
    sessionData,
    sessionProgress,
    currentScenario,
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
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
        {/* Progression Indicator - Always visible at bottom */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {categoryName} - Phase {displayPhaseNumber}
          </Text>
          <Text style={styles.progressNumber}>
            Scenario {currentScenario} / 10
          </Text>
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
  progressNumber: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
});