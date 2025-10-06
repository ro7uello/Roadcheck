// frontend/src/app/result-page.tsx
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

  const params = useLocalSearchParams();
  const {
    sessionId,
    categoryId,
    phaseId,
    categoryName,
    userAttempts,
    totalTime,
    scenarioCount = 10,
    scenarioProgress
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
    scenarioDetails: []
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
      console.log('🔍 DEBUG: Starting calculateResults');
      console.log('🔍 DEBUG: Params received:', { sessionId, categoryId, phaseId, categoryName, userAttempts, totalTime, scenarioProgress });

      let attempts = [];
      let detailedProgress = [];

      try {
        if (userAttempts && typeof userAttempts === 'string') {
          attempts = JSON.parse(userAttempts);
          console.log('🔍 DEBUG: Parsed attempts:', attempts);
        } else if (Array.isArray(userAttempts)) {
          attempts = userAttempts;
        }
      } catch (parseError) {
        console.error('❌ Error parsing userAttempts:', parseError);
        attempts = [];
      }

      try {
        if (scenarioProgress && typeof scenarioProgress === 'string') {
          detailedProgress = JSON.parse(scenarioProgress);
          console.log('🔍 DEBUG: Parsed scenarioProgress:', detailedProgress);
        } else if (Array.isArray(scenarioProgress)) {
          detailedProgress = scenarioProgress;
        }
      } catch (parseError) {
        console.error('❌ Error parsing scenarioProgress:', parseError);
        detailedProgress = [];
      }

      if (sessionId) {
        console.log('🔍 DEBUG: Fetching session details for sessionId:', sessionId);
        await fetchSessionDetails(sessionId);
        return;
      }

      console.log('🔍 DEBUG: Calculating from passed data, attempts count:', attempts.length);

      if (attempts.length === 0) {
        console.log('⚠️ No attempts data, creating default results');
        const scenarioDetails = Array.from({ length: parseInt(scenarioCount) || 10 }, (_, index) => ({
          scenarioNumber: index + 1,
          scenarioId: index + 1,
          isAttempted: false,
          isCorrect: false,
          selectedAnswer: null,
          timeTaken: '00:00',
          status: 'NOT ATTEMPTED'
        }));

        const newResultData = {
          status: 'FAIL',
          correctActs: 0,
          violations: 0,
          totalTimeSpent: '00:00',
          totalScore: '0%',
          accuracy: 0,
          averageTime: '00:00',
          scenarioDetails
        };

        setResultData(newResultData);
        showResultPanel();
        return;
      }

      const correctAnswers = attempts.filter(attempt => attempt.is_correct).length;
      const incorrectAnswers = attempts.length - correctAnswers;
      const accuracy = attempts.length > 0 ? Math.round((correctAnswers / attempts.length) * 100) : 0;
      const passingScore = 70;
      const status = accuracy >= passingScore ? 'PASS' : 'FAIL';

      const totalTimeNum = parseInt(totalTime) || 0;
      const formattedTime = formatTime(totalTimeNum);
      const averageTimePerScenario = attempts.length > 0 ?
        formatTime(Math.round(totalTimeNum / attempts.length)) : '00:00';

      console.log('🔍 DEBUG: Calculated results:', { correctAnswers, incorrectAnswers, accuracy, status, totalTimeNum });

      const scenarioDetails = attempts.map((attempt, index) => ({
        scenarioNumber: index + 1,
        scenarioId: attempt.scenario_id || index + 1,
        isAttempted: true,
        isCorrect: attempt.is_correct,
        selectedAnswer: attempt.chosen_option || attempt.selected_answer || attempt.selected_option,
        timeTaken: formatTime(attempt.time_taken_seconds || attempt.time_taken || 0),
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

      console.log('🔍 DEBUG: Final result data:', newResultData);
      setResultData(newResultData);
      showResultPanel();

    } catch (error) {
      console.error('❌ Error calculating results:', error);
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
        calculateResults();
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      calculateResults();
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
    router.push('/optionPage');
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

      <Animated.View
        style={[styles.carContainer, { transform: [{ translateY: carVerticalBounce }] }]}
      >
        <Image
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.topRightIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/profile')}
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

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Calculating Results...</Text>
        </View>
      )}

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

            <TouchableOpacity
              style={styles.detailToggleButton}
              onPress={toggleDetailedView}
            >
              <Text style={styles.detailToggleText}>View Scenario Details</Text>
            </TouchableOpacity>
          </>
        ) : (
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

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.savingText}>Saving progress...</Text>
          </View>
        )}

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
  detailToggleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 15,
  },
  detailToggleText: {
    fontSize: 10,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginTop: 15,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 8,
    color: 'white',
    fontFamily: 'pixel',
  },
  detailedTitle: {
    fontSize: 14,
    color: 'black',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  detailedContent: {
    width: '90%',
    flex: 1,
    marginBottom: 20,
  },
  scenarioDetailItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scenarioDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioDetailNumber: {
    fontSize: 10,
    color: 'black',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  scenarioStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scenarioStatusText: {
    fontSize: 8,
    color: 'white',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  scenarioDetailContent: {
    marginTop: 4,
  },
  scenarioDetailText: {
    fontSize: 8,
    color: '#333',
    fontFamily: 'pixel',
    marginBottom: 2,
  },
  scenarioDetailAnswer: {
    fontSize: 8,
    color: '#555',
    fontFamily: 'pixel',
    fontStyle: 'italic',
  },
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
  settingsOption: {},
  profileButton: { width: 147, height: 50, resizeMode: 'contain', marginBottom: -10, marginTop: 10 },
  audioButton: { width: 120, height: 50, resizeMode: 'contain', marginBottom: -10 },
  backButtonImage: { width: 100, height: 50, resizeMode: 'contain', marginBottom: 30 },
});