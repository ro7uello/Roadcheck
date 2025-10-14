import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Image, ImageBackground, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
  Alert, ScrollView, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import CachedApiService from '../contexts/CachedApiService';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

export default function ResultPage() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
    'space-mono': require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const params = useLocalSearchParams();
  const {
    sessionId,
    categoryId,
    phaseId,
    categoryName,
    userAttempts,
    totalTime = '0',
    scenarioCount = '10',
    scenarioProgress
  } = params;

  const [sessionData, setSessionData] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);

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
  const libraryModalScale = useRef(new Animated.Value(0)).current;

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
      libraryModalScale.stopAnimation();
    };
  }, [fontsLoaded]);

  useEffect(() => {
    Animated.spring(libraryModalScale, {
      toValue: libraryVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [libraryVisible]);

  const calculateResults = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG: Starting calculateResults');
      console.log('🔍 DEBUG: Params received:', {
        sessionId, categoryId, phaseId, categoryName,
        userAttempts, totalTime, scenarioProgress
      });

      if (sessionId) {
        console.log('📦 Attempting to load session from cache...');
        await fetchSessionDetailsOptimized(sessionId);
        return;
      }

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

      console.log('🔍 DEBUG: Calculated results:', {
        correctAnswers, incorrectAnswers, accuracy, status, totalTimeNum
      });

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

  const fetchSessionDetailsOptimized = async (sessionId) => {
    try {
      console.log('🚀 Fetching session details with caching...');

      const result = await CachedApiService.getSessionProgress(sessionId);

      if (result.fromCache) {
        console.log('⚡ Loaded from cache - INSTANT!');
      } else {
        console.log('🌐 Loaded from API');
      }

      if (result.success && result.data) {
        const { session, scenarios, summary } = result.data;

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
        console.log('⚠️ No session data, falling back to calculation');
        calculateResultsFromParams();
      }
    } catch (error) {
      console.error('❌ Error fetching session details:', error);
      calculateResultsFromParams();
    } finally {
      setLoading(false);
    }
  };

  const calculateResultsFromParams = () => {
    console.log('📊 Calculating from params as fallback');
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
      })
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

  const handleSettingsPress = () => {
    router.push('/profile');
  };

  const handleLibraryPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }
    setLibraryVisible(true);
  };

  const goBack = () => {
    router.back();
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
        <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
          <Image
            source={require('../../assets/icon/c-trans.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleLibraryPress}>
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
        {/* Custom Container replacing settings-tab.png */}
        <View style={styles.customContainer}>
          <View style={styles.containerBorder} />
        </View>

        {!showDetailedView ? (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>RESULT</Text>
            </View>

            <View style={styles.statusContainer}>
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
                <Text style={styles.statLabel}>AVG TIME:</Text>
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.detailToggleButton}
                onPress={toggleDetailedView}
              >
                <Text style={styles.detailToggleText}>VIEW SCENARIO DETAILS</Text>
              </TouchableOpacity>

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
            </View>
          </>
        ) : (
          <>
            <View style={styles.detailedHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={toggleDetailedView}
              >
                <Text style={styles.backButtonText}>← BACK</Text>
              </TouchableOpacity>
              <Text style={styles.detailedTitle}>SCENARIO DETAILS</Text>
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
      </Animated.View>

      {libraryVisible && (
        <Animated.View
          style={[
            styles.libraryPanel,
            { transform: [{ scale: libraryModalScale }] },
          ]}
        >
          {/* Custom Container for Library */}
          <View style={styles.customContainer}>
            <View style={styles.containerBorder} />
          </View>

          <Text style={styles.libraryTitle}>REFERENCES</Text>

          <View style={styles.libraryContent}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.referenceContainer}>
                <Text style={styles.sectionTitle}>Some Basic Signs and Markings to Remember</Text>

                <Text style={styles.subsectionTitle}>Traffic Signs</Text>
                <Text style={styles.referenceText}>
                  • Red Signal - means bring your vehicle to a stop at a marked line.{'\n\n'}
                  • Flashing Red - means bring your vehicle to a STOP and proceed only when it is safe.{'\n\n'}
                  • Yellow Signal - means the red signal is about to appear. Prepare to stop.{'\n\n'}
                  • Flashing Yellow - means slow down and proceed with caution.{'\n\n'}
                  • Green Signal - means you can proceed, yield if needed.{'\n\n'}
                  • Flashing Green - proceed with caution. yield for pedestrian.{'\n'}
                </Text>

                <Text style={styles.subsectionTitle}>Road Markings</Text>
                <Text style={styles.referenceText}>
                  • Solid White line - Crossing is discouraged and requires special care when doing so.{'\n\n'}
                  • Broken White line - Changing of lane is allowed provided with care.{'\n\n'}
                  • Double Solid Yellow line - No overtaking and No crossing{'\n\n'}
                  • Single Solid Yellow line - Crossing is allowed but no overtaking{'\n\n'}
                  • Broken Yellow line - Crossing and overtaking is allowed with necessary care.{'\n\n'}
                  • Edge Line - Used to separate the outside edge of the road from the shoulder.{'\n'}
                </Text>
              </View>
              <View style={styles.referenceContainer}>
                <Text style={styles.referenceText}>
                  Land Transportation Office. (2023). Road and traffic rules, signs, signals, and markings (RO102).{'\n'}
                  <TouchableOpacity onPress={() => Linking.openURL('https://lto.gov.ph/wp-content/uploads/2023/09/RO102_CDE_Road_and_Traffic_Rules_Signs-Signals-Markings.pdf')}>
                    <Text style={[styles.referenceText, styles.linkText]}>
                      https://lto.gov.ph/wp-content/uploads/2023/09/RO102_CDE_Road_and_Traffic_Rules_Signs-Signals-Markings.pdf
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>

              <View style={styles.referenceContainer}>
                <Text style={styles.sectionTitle}>Basic Pedestrian Safety Tips</Text>
                <Text style={styles.referenceText}>
                  • Follow the rules of the road and obey signs and signals{'\n\n'}
                  • Walk on sidewalks whenever possible. If there are no sidewalk, walk facing and as far from traffic as possible{'\n'}
                  • Cross streets at crosswalks.{'\n\n'}
                  • If a crosswalk is not available, walk at a well lit area where you have the best view of traffic. Wait for a gap in traffic that allows enough time to cross safely but continue to watch for traffic as you cross.{'\n\n'}
                  • Watch for cars entering or exiting driveways or backing up.{'\n\n'}
                  • When crossing the street, stay alert: <Text style={[styles.referenceText, { textDecorationLine: 'underline' }]}>check for signals, signs, and actions of drivers, cyclists, and pedestrians around you</Text>.{'\n\n'}
                  • Do not rely on others to keep you safe.{'\n'}
                </Text>
              </View>

              <View style={styles.referenceContainer}>
                <Text style={styles.referenceText}>
                  National Highway Traffic Safety Administration. Pedestrian Safety{'\n'}
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.nhtsa.gov/road-safety/pedestrian-safety')}>
                    <Text style={[styles.referenceText, styles.linkText]}>
                      https://www.nhtsa.gov/road-safety/pedestrian-safety
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.libraryBackButton}
            onPress={() => setLibraryVisible(false)}
          >
            <Image
              source={require('../../assets/background/back.png')}
              style={styles.backButtonImage}
            />
          </TouchableOpacity>
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
    top: height * 0.12,
    alignSelf: 'center',
    width: Math.min(width * 0.82, 400),
    height: Math.min(height * 0.65, 460),
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 6,
  },
  // NEW: Custom Container Styles
  customContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  containerBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#34495e',
  },
  resultHeader: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 26,
    color: '#2c3e50',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  resultStatus: {
    fontSize: 22,
    fontFamily: 'pixel',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resultStats: {
    width: '85%',
    paddingVertical: 10,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: 'rgba(52, 73, 94, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#2c3e50',
    fontFamily: 'pixel',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: 'pixel',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '88%',
    marginTop: 22,
    marginBottom: 20,
    gap: 10,
  },
  detailToggleButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailToggleText: {
    fontSize: 10,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  finishButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 0,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  finishButtonText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginTop: 25,
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: '#7f8c8d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 10,
    color: 'white',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  detailedTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  detailedContent: {
    width: '90%',
    flex: 1,
    marginBottom: 20,
  },
  scenarioDetailItem: {
    backgroundColor: 'rgba(52, 73, 94, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scenarioDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioDetailNumber: {
    fontSize: 12,
    color: '#2c3e50',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  scenarioStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  scenarioStatusText: {
    fontSize: 9,
    color: 'white',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  scenarioDetailContent: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#dfe6e9',
  },
  scenarioDetailText: {
    fontSize: 10,
    color: '#2c3e50',
    fontFamily: 'space-mono',
    marginBottom: 3,
  },
  scenarioDetailAnswer: {
    fontSize: 10,
    color: '#34495e',
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
    color: '#7f8c8d',
    fontFamily: 'pixel',
    marginLeft: 8,
  },
  backButtonImage: {
    width: 100,
    height: 30,
    resizeMode: 'contain',
    marginBottom: 5
  },
  linkText: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  libraryPanel: {
    position: 'absolute',
    top: height * 0.1,
    alignSelf: 'center',
    width: Math.min(width * 0.9, 450),
    height: Math.min(height * 0.75, 500),
    alignItems: 'center',
    zIndex: 10,
  },
  libraryTitle: {
    fontSize: 18,
    color: '#2c3e50',
    fontFamily: "pixel",
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  libraryContent: {
    flex: 1,
    width: '85%',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  referenceContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  referenceText: {
    fontSize: 11,
    color: '#2c3e50',
    fontFamily: 'space-mono',
    lineHeight: 16,
    textAlign: 'justify',
  },
  libraryBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#2c3e50',
    fontFamily: "pixel",
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subsectionTitle: {
    fontSize: 11,
    color: '#34495e',
    fontFamily: "pixel",
    marginTop: 10,
    marginBottom: 5,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});