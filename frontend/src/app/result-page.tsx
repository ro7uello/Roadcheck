// Enhanced result-page.jsx
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

export default function ResultPage() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
  });

  // Get navigation parameters (now includes sessionId and detailed progress)
  const params = useLocalSearchParams();
  const {
    sessionId,
    categoryId,
    phaseId,
    categoryName,
    userAttempts,
    totalTime,
    scenarioCount = 10,
    scenarioProgress // JSON string of detailed scenario progress
  } = params;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const [resultData, setResultData] = useState({
    status: 'CALCULATING...',
    correctActs: 0,
    violations: 0,
    totalTimeSpent: '00:00',
    totalScore: '0%',
    accuracy: 0,
    averageTime: '00:00',
    scenarioDetails: [] // New: detailed scenario results
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

      let attempts = [];
      let detailedProgress = [];

      // Parse data from navigation params
      if (userAttempts) {
        attempts = JSON.parse(userAttempts);
      }
      if (scenarioProgress) {
        detailedProgress = JSON.parse(scenarioProgress);
      }

      // If we have sessionId, fetch latest data from backend
      if (sessionId) {
        await fetchSessionDetails(sessionId);
        return; // fetchSessionDetails will call showResultPanel
      }

      // Fallback to calculate from passed data
      const correctAnswers = attempts.filter(attempt => attempt.is_correct).length;
      const incorrectAnswers = attempts.length - correctAnswers;
      const accuracy = attempts.length > 0 ? Math.round((correctAnswers / attempts.length) * 100) : 0;
      const passingScore = 70;
      const status = accuracy >= passingScore ? 'PASS' : 'FAIL';

      const formattedTime = formatTime(totalTime || 0);
      const averageTimePerScenario = attempts.length > 0 ?
        formatTime(Math.round((totalTime || 0) / attempts.length)) : '00:00';

      // Create scenario details from attempts
      const scenarioDetails = attempts.map((attempt, index) => ({
        scenarioNumber: index + 1,
        scenarioId: attempt.scenario_id || index + 1,
        isAttempted: true,
        isCorrect: attempt.is_correct,
        selectedAnswer: attempt.chosen_option || attempt.selected_answer,
        timeTaken: formatTime(attempt.time_taken || 0),
        status: attempt.is_correct ? 'CORRECT' : 'WRONG'
      }));

      const newResultData = {
        status,
        correctActs: correctAnswers,
        violations: incorrectAnswers,
        totalTimeSpent: formattedTime,
        totalScore: `${accuracy}%`,
        accuracy,
        averageTime: averageTimePerScenario,
        scenarioDetails
      };

      setResultData(newResultData);
      showResultPanel();

    } catch (error) {
      console.error('Error calculating results:', error);
      Alert.alert('Error', 'Failed to calculate results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
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
        const data = await response.json();
        const { session, scenarios, summary } = data.data;

        // Create detailed results from session data
        const scenarioDetails = scenarios.map(scenario => ({
          scenarioNumber: scenario.scenario_number,
          scenarioId: scenario.scenario_id,
          isAttempted: scenario.is_attempted,
          isCorrect: scenario.is_correct,
          selectedAnswer: scenario.selected_answer,
          timeTaken: formatTime(scenario.time_taken_seconds || 0),
          status: scenario.is_attempted
            ? scenario.is_correct ? 'CORRECT' : 'WRONG'
            : 'NOT ATTEMPTED'
        }));

        const passingScore = 70;
        const status = summary.accuracy >= passingScore ? 'PASS' : 'FAIL';

        const newResultData = {
          status,
          correctActs: summary.correct_scenarios,
          violations: summary.attempted_scenarios - summary.correct_scenarios,
          totalTimeSpent: formatTime(summary.total_time_seconds),
          totalScore: `${summary.accuracy}%`,
          accuracy: summary.accuracy,
          averageTime: formatTime(Math.round(summary.total_time_seconds / Math.max(summary.attempted_scenarios, 1))),
          scenarioDetails
        };

        setResultData(newResultData);
        showResultPanel();
      } else {
        console.error('Failed to fetch session details');
        // Fallback to calculate from params
        calculateResults();
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      calculateResults(); // Fallback
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

  const toggleDetailedView = () => {
    setShowDetailedView(!showDetailedView);
  };

  const renderScenarioDetail = ({ item, index }) => (
    <View style={styles.scenarioDetailItem}>
      <View style={styles.scenarioDetailHeader}>
        <Text style={styles.scenarioDetailNumber}>Scenario {item.scenarioNumber}</Text>
        <View style={[
          styles.scenarioStatusBadge,
          {
            backgroundColor:
              item.status === 'CORRECT' ? '#4CAF50' :
              item.status === 'WRONG' ? '#F44336' : '#666'
          }
        ]}>
          <Text style={styles.scenarioStatusText}>{item.status}</Text>
        </View>
      </View>

      {item.isAttempted && (
        <View style={styles.scenarioDetailContent}>
          <Text style={styles.scenarioDetailText}>
            Time: {item.timeTaken}
          </Text>
          {item.selectedAnswer && (
            <Text style={styles.scenarioDetailAnswer}>
              Answer: {item.selectedAnswer}
            </Text>
          )}
        </View>
      )}
    </View>
  );

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
        <Image
          source={require('../../assets/background/settings-tab.png')}
          style={styles.resultTab}
          resizeMode="stretch"
        />

        {!showDetailedView ? (
          // Summary View
          <>
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

            {/* Toggle to detailed view */}
            <TouchableOpacity
              style={styles.detailToggleButton}
              onPress={toggleDetailedView}
            >
              <Text style={styles.detailToggleText}>View Scenario Details</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Detailed View
          <>
            <View style={styles.detailedHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={toggleDetailedView}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.detailedTitle}>Scenario Details</Text>
            </View>

            <ScrollView style={styles.detailedContent} showsVerticalScrollIndicator={false}>
              {resultData.scenarioDetails.map((item, index) => (
                <View key={index}>
                  {renderScenarioDetail({ item, index })}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Saving indicator */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.savingText}>Saving progress...</Text>
          </View>
        )}

        {/* Finish Button */}
        {!showDetailedView && (
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
        )}
      </Animated.View>

      {/* Settings Panel */}
      {settingsVisible && (
        <Animated.View
          style={[
            styles.settingsPanel,
            { transform: [{ scale: modalScale }] },
          ]}
        >
          <Image
            source={require('../../assets/background/settings-tab.png')}
            style={styles.settingsTab}
            resizeMode="stretch"
          />

          <Text style={styles.settingsTitle}>SETTINGS</Text>

          <View style={styles.settingsOptionsColumn}>
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