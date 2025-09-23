// ===== app/result-page.jsx =====
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

export default function ResultPage() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
  });

  // Get navigation parameters
  const params = useLocalSearchParams();
  const {
    categoryId,
    phaseId,
    categoryName,
    userAttempts, // JSON string of user attempts for this session
    totalTime, // Total time spent on scenarios
    scenarioCount = 10 // Number of scenarios completed
  } = params;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resultData, setResultData] = useState({
    status: 'CALCULATING...',
    correctActs: 0,
    violations: 0,
    totalTimeSpent: '00:00',
    totalScore: '0%',
    accuracy: 0,
    averageTime: '00:00'
  });

  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const resultPanelScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
      calculateResults();
    }

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      modalScale.stopAnimation();
      resultPanelScale.stopAnimation();
    };
  }, [fontsLoaded]);

  // animate settings tab in/out
  useEffect(() => {
    Animated.spring(modalScale, {
      toValue: settingsVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [settingsVisible]);

  const calculateResults = async () => {
    try {
      setLoading(true);

      // Parse user attempts from navigation params
      let attempts = [];
      if (userAttempts) {
        attempts = JSON.parse(userAttempts);
      }

      console.log('Calculating results for:', {
        categoryId,
        phaseId,
        attemptsCount: attempts.length,
        totalTime
      });

      // Calculate statistics
      const correctAnswers = attempts.filter(attempt => attempt.is_correct).length;
      const incorrectAnswers = attempts.length - correctAnswers;
      const accuracy = attempts.length > 0 ? Math.round((correctAnswers / attempts.length) * 100) : 0;
      const passingScore = 70; // 70% to pass
      const status = accuracy >= passingScore ? 'PASS' : 'FAIL';

      // Format time
      const formattedTime = formatTime(totalTime || 0);
      const averageTimePerScenario = attempts.length > 0 ?
        formatTime(Math.round((totalTime || 0) / attempts.length)) : '00:00';

      const newResultData = {
        status,
        correctActs: correctAnswers,
        violations: incorrectAnswers,
        totalTimeSpent: formattedTime,
        totalScore: `${accuracy}%`,
        accuracy,
        averageTime: averageTimePerScenario
      };

      setResultData(newResultData);

      // Save results to backend
      await saveResultsToBackend(attempts, newResultData);

      // Show result panel after calculation
      showResultPanel();

    } catch (error) {
      console.error('Error calculating results:', error);
      Alert.alert('Error', 'Failed to calculate results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveResultsToBackend = async (attempts, results) => {
    try {
      setSaving(true);

      // Get user data
      const userData = await AsyncStorage.getItem('user_data');
      const token = await AsyncStorage.getItem('access_token');

      if (!userData || !token) {
        console.warn('No user data or token found');
        return;
      }

      const user = JSON.parse(userData);
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('Saving results to backend...');

      // Save each attempt to the backend
      for (const attempt of attempts) {
        try {
          const attemptPayload = {
            user_id: user.id,
            scenario_id: attempt.scenario_id,
            selected_choice_id: attempt.selected_choice_id || null,
            is_correct: attempt.is_correct,
            time_taken: attempt.time_taken || 0,
            category_id: parseInt(categoryId),
            phase_id: parseInt(phaseId)
          };

          const attemptResponse = await fetch(`${API_URL}/attempts`, {
            method: 'POST',
            headers,
            body: JSON.stringify(attemptPayload)
          });

          if (!attemptResponse.ok) {
            console.warn('Failed to save attempt:', attempt.scenario_id);
          }
        } catch (attemptError) {
          console.error('Error saving individual attempt:', attemptError);
        }
      }

      // Update user progress
      try {
        const progressPayload = {
          user_id: user.id,
          current_category_id: parseInt(categoryId),
          current_phase: parseInt(phaseId),
          current_scenario_index: attempts.length, // Last completed scenario
          completed_scenarios: attempts.map(a => a.scenario_id),
          total_score: results.accuracy,
          phase_completed: true,
          session_results: {
            accuracy: results.accuracy,
            total_time: totalTime,
            correct_answers: results.correctActs,
            total_questions: attempts.length,
            category_name: categoryName,
            completed_at: new Date().toISOString()
          }
        };

        const progressResponse = await fetch(`${API_URL}/progress`, {
          method: 'POST',
          headers,
          body: JSON.stringify(progressPayload)
        });

        if (progressResponse.ok) {
          console.log('Progress saved successfully');
        } else {
          console.warn('Failed to save progress');
        }
      } catch (progressError) {
        console.error('Error saving progress:', progressError);
      }

    } catch (error) {
      console.error('Error saving results to backend:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showResultPanel = () => {
    Animated.spring(resultPanelScale, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
      delay: 500,
    }).start();
  };

  const startBackgroundAnimation = () => {
    backgroundAnimation.setValue(0);
    Animated.loop(
      Animated.timing(backgroundAnimation, {
        toValue: 1,
        duration: BACKGROUND_SPEED,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    ).start();
  };

  const startCarAnimation = () => {
    carBounce.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(carBounce, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(carBounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const handleSettingsOptionPress = async (action) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // haptics not available
    }
    action();
  };

  const handleFinishPress = () => {
    // Show confirmation if they want to continue to next phase or go back to category selection
    Alert.alert(
      'Session Complete!',
      `You've completed ${categoryName} Phase ${phaseId} with ${resultData.accuracy}% accuracy.\n\nWhat would you like to do next?`,
      [
        {
          text: 'View Profile',
          onPress: () => router.push('/profile')
        },
        {
          text: 'Continue Learning',
          onPress: () => router.push('/categorySelectionScreen')
        },
        {
          text: 'Back to Menu',
          onPress: () => router.push('/optionPage')
        }
      ]
    );
  };

  if (!fontsLoaded) return null;

  const backgroundTranslate = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const carVerticalBounce = carBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: backgroundTranslate }] },
          ]}
        >
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            {
              transform: [{ translateX: Animated.add(backgroundTranslate, width) }],
            },
          ]}
        >
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
      </View>

      <View style={styles.skyOverlay} />

      {/* Car */}
      <Animated.View
        style={[styles.carContainer, { transform: [{ translateY: carVerticalBounce }] }]}
      >
        <Image
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Top-right Icons */}
      <View style={styles.topRightIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Image
            source={require('../../assets/icon/Settings.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => console.log('Library pressed')}
        >
          <Image
            source={require('../../assets/icon/Library.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Calculating Results...</Text>
        </View>
      )}

      {/* Result Panel */}
      <Animated.View
        style={[
          styles.resultPanel,
          { transform: [{ scale: resultPanelScale }] },
        ]}
      >
        {/* Tab Background */}
        <Image
          source={require('../../assets/background/settings-tab.png')}
          style={styles.resultTab}
          resizeMode="stretch"
        />

        {/* Result Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>RESULT</Text>
          <Text style={styles.categoryText}>{categoryName} - Phase {phaseId}</Text>
          <Text style={[
            styles.resultStatus,
            { color: resultData.status === 'PASS' ? '#4CAF50' : '#F44336' }
          ]}>
            {resultData.status}
          </Text>
        </View>

        {/* Result Stats */}
        <View style={styles.resultStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>CORRECT ACTS:</Text>
            <Text style={[styles.statValue, {color: '#4CAF50'}]}>{resultData.correctActs}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>VIOLATIONS:</Text>
            <Text style={[styles.statValue, {color: '#F44336'}]}>{resultData.violations}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>TOTAL TIME:</Text>
            <Text style={styles.statValue}>{resultData.totalTimeSpent}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>AVG TIME/QUESTION:</Text>
            <Text style={styles.statValue}>{resultData.averageTime}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ACCURACY:</Text>
            <Text style={[
              styles.statValue,
              {color: resultData.accuracy >= 70 ? '#4CAF50' : '#F44336'}
            ]}>
              {resultData.totalScore}
            </Text>
          </View>
        </View>

        {/* Saving indicator */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.savingText}>Saving progress...</Text>
          </View>
        )}

        {/* Finish Button */}
        <TouchableOpacity
          style={[
            styles.finishButton,
            { backgroundColor: resultData.status === 'PASS' ? '#4CAF50' : '#FF9800' }
          ]}
          onPress={handleFinishPress}
          disabled={loading || saving}
        >
          <Text style={styles.finishButtonText}>
            {loading ? 'CALCULATING...' : saving ? 'SAVING...' : 'FINISH'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Settings Panel */}
      {settingsVisible && (
        <Animated.View
          style={[
            styles.settingsPanel,
            { transform: [{ scale: modalScale }] },
          ]}
        >
          {/* Tab Background */}
          <Image
            source={require('../../assets/background/settings-tab.png')}
            style={styles.settingsTab}
            resizeMode="stretch"
          />

          {/* Title */}
          <Text style={styles.settingsTitle}>SETTINGS</Text>

          {/* Options */}
          <View style={styles.settingsOptionsColumn}>
            {/* Profile */}
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => handleSettingsOptionPress(() => {
                setSettingsVisible(false);
                router.push('/profile');
              })}
            >
              <Image
                source={require('../../assets/background/profile.png')}
                style={styles.profileButton}
              />
            </TouchableOpacity>

            {/* Audio */}
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => handleSettingsOptionPress(() => {
                setSettingsVisible(false);
                router.push('/audio');
              })}
            >
              <Image
                source={require('../../assets/background/audio.png')}
                style={styles.audioButton}
              />
            </TouchableOpacity>

            {/* Back */}
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => setSettingsVisible(false)}
            >
              <Image
                source={require('../../assets/background/back.png')}
                style={styles.backButtonImage}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backgroundWrapper: { position: 'absolute', width, height },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  backgroundImageStyle: { width: '100%', height: '100%', transform: [{ scale: 1.3 }] },
  skyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height, backgroundColor: 'rgba(0,0,0,0)', zIndex: 0 },
  carContainer: { position: 'absolute', bottom: -25, left: width * 0.05, zIndex: 2 },
  carImage: { width: 400, height: 210 },
  topRightIcons: { position: 'absolute', top: 40, right: 20, flexDirection: 'row', zIndex: 5 },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  topIcon: { width: 24, height: 24 },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  loadingText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'pixel',
    marginTop: 10,
    textAlign: 'center',
  },

  // Result panel styles
  resultPanel: {
    position: 'absolute',
    top: height * 0.1,
    alignSelf: 'center',
    width: Math.min(width * 0.9, 400),
    height: Math.min(height * 0.75, 500),
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 6,
  },
  resultTab: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  resultHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    color: 'black',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultStatus: {
    fontSize: 16,
    fontFamily: 'pixel',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultStats: {
    width: '85%',
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'pixel',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    color: 'black',
    fontFamily: 'pixel',
    textAlign: 'right',
    minWidth: 60,
    fontWeight: 'bold',
  },

  // Saving indicator
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  savingText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'pixel',
    marginLeft: 8,
  },

  finishButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#45a049',
    minWidth: 120,
  },
  finishButtonText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  // Settings panel styles (kept from original)
  settingsPanel: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    width: Math.min(width * 0.9, 400),
    height: Math.min(height * 0.6, 400),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  settingsTab: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  settingsTitle: {
    fontSize: 15,
    color: 'black',
    fontFamily: 'pixel',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsOptionsColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
  },
  profileButton: { width: 147, height: 50, resizeMode: 'contain', marginBottom: -10, marginTop: 10 },
  audioButton: { width: 120, height: 50, resizeMode: 'contain', marginBottom: -10 },
  backButtonImage: { width: 100, height: 50, resizeMode: 'contain', marginBottom: 30 },
});