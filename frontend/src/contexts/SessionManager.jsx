// C:\Users\wahoo\Desktop\roadcheck\frontend\src\contexts\SessionManager.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
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

  // Initialize session when component mounts
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Get userId from AsyncStorage - FIXED
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
          user_id: userId,  // Use the userId from AsyncStorage
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
          categoryId: sessionData.category_id, // ADD THIS
          phaseId: sessionData.phase_id, // ADD THIS
          categoryName: 'Traffic Signs', // Or get from sessionData
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
        return null; // This causes the error!
      }
    } catch (error) {
      console.error('Error completing session:', error);
      return null; // This also causes the error!
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
      {children}
    </SessionContext.Provider>
  );
};
