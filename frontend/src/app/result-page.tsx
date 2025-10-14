import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Image, ImageBackground, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
  Alert, ScrollView, Linking, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import CachedApiService from '../contexts/CachedApiService';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

// Responsive sizing helpers
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isLargeDevice = width >= 414;

const scale = (size) => {
  if (isSmallDevice) return size * 0.85;
  if (isMediumDevice) return size * 0.95;
  return size;
};

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

      if (sessionId) {
        console.log('📦 Attempting to load session from cache...');
        await fetchSessionDetailsOptimized(sessionId);
        return;
      }

      calculateResultsFromParams();

    } catch (error) {
      console.error('❌ Error calculating results:', error);
      Alert.alert('Error', 'Failed to calculate results. Please try again.');
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

        if (!scenarios || !Array.isArray(scenarios)) {
          console.log('⚠️ No scenarios in cached data, falling back');
          calculateResultsFromParams();
          return;
        }

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
    try {
      console.log('📊 Calculating from params as fallback');

      let attempts = [];

      try {
        if (userAttempts && typeof userAttempts === 'string') {
          attempts = JSON.parse(userAttempts);
        } else if (Array.isArray(userAttempts)) {
          attempts = userAttempts;
        }
      } catch (parseError) {
        console.error('❌ Error parsing userAttempts:', parseError);
        attempts = [];
      }

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
        setLoading(false);
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

      console.log('✅ Calculated results from params:', newResultData);
      setResultData(newResultData);
      showResultPanel();
      setLoading(false);
    } catch (error) {
      console.error('❌ Error in calculateResultsFromParams:', error);
      setLoading(false);
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
      {/* Animated Background */}
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

      {/* Animated Car */}
      <Animated.View
        style={[styles.carContainer, { transform: [{ translateY: carVerticalBounce }] }]}
      >
        <Image
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Top Right Icons */}
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

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Calculating Results...</Text>
          </View>
        </View>
      )}

      {/* Main Result Panel - Pixel Art Style */}
      {!loading && (
        <Animated.View
          style={[
            styles.resultPanel,
            { transform: [{ scale: resultPanelScale }] },
          ]}
        >
          {/* Beige/Tan Container with Pixel Border */}
          <View style={styles.pixelContainer}>
            {/* Top Border Decoration */}
            <View style={styles.topBorder} />

            <ScrollView
              style={styles.scrollableContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {!showDetailedView ? (
                <>
                  {/* Header */}
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>RESULT</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.statusContainer}>
                    <Text style={[
                      styles.resultStatus,
                      { color: resultData.status === 'PASS' ? '#4CAF50' : '#F44336' }
                    ]}>
                      {resultData.status}
                    </Text>
                  </View>

                  {/* Stats Section */}
                  <View style={styles.resultStats}>
                    {/* Correct Acts */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>CORRECT ACTS:</Text>
                      <Text style={[styles.statValue, {color: '#4CAF50'}]}>
                        {resultData.correctActs}
                      </Text>
                    </View>

                    {/* Violations */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>VIOLATIONS:</Text>
                      <Text style={[styles.statValue, {color: '#F44336'}]}>
                        {resultData.violations}
                      </Text>
                    </View>

                    {/* Total Time */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>TOTAL TIME:</Text>
                      <Text style={styles.statValue}>{resultData.totalTimeSpent}</Text>
                    </View>

                    {/* Average Time */}
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>AVG TIME:</Text>
                      <Text style={styles.statValue}>{resultData.averageTime}</Text>
                    </View>

                    {/* Accuracy */}
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

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.detailToggleButton}
                      onPress={toggleDetailedView}
                    >
                      <Text style={styles.detailToggleText}>VIEW{'\n'}DETAILS</Text>
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
                        {loading ? 'LOADING...' : saving ? 'SAVING...' : 'FINISH'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Detailed View Header */}
                  <View style={styles.detailedHeader}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={toggleDetailedView}
                    >
                      <Text style={styles.backButtonText}>← BACK</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailedTitle}>SCENARIO DETAILS</Text>
                  </View>

                  {/* Detailed Scenarios List */}
                  <View style={styles.detailedContentWrapper}>
                    {resultData.scenarioDetails.map((item, index) => (
                      <View key={`scenario-${index}`}>
                        {renderScenarioDetail({ item, index })}
                      </View>
                    ))}
                  </View>
                </>
              )}

              {saving && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.savingText}>Saving progress...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {/* Library Modal with Backdrop */}
      {libraryVisible && (
        <>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setLibraryVisible(false)}
          />
          <Animated.View
            style={[
              styles.libraryPanel,
              { transform: [{ scale: libraryModalScale }] },
            ]}
          >
            <View style={styles.libraryContainer}>
              <View style={styles.topBorder} />

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
                <Text style={styles.libraryBackButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB'
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  backgroundWrapper: {
    position: 'absolute',
    width,
    height
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.3 }]
  },
  skyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 0
  },
  carContainer: {
    position: 'absolute',
    bottom: -25,
    left: width * 0.05,
    zIndex: 2
  },
  carImage: {
    width: scale(400),
    height: scale(210)
  },
  topRightIcons: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    zIndex: 5
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  topIcon: {
    width: scale(24),
    height: scale(24)
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  loadingCard: {
    backgroundColor: '#E8D4A0',
    padding: scale(30),
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#8B7355',
  },
  loadingText: {
    fontSize: scale(14),
    color: '#000',
    fontFamily: 'pixel',
    marginTop: 15,
    textAlign: 'center',
  },

  // Main Result Panel - FIXED
  resultPanel: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    width: isSmallDevice ? width * 0.90 : isMediumDevice ? width * 0.85 : width * 0.82,
    maxWidth: 650,
    maxHeight: height * 0.68,
    zIndex: 6,
  },
  pixelContainer: {
    backgroundColor: '#E8D4A0',
    borderRadius: 5,
    borderWidth: 4,
    borderColor: '#8B7355',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
    paddingBottom: scale(24),
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scale(15),
    backgroundColor: '#D4C090',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    zIndex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: scale(8),
  },
  resultTitle: {
    fontSize: scale(26),
    color: '#000',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: scale(16),
  },
  resultStatus: {
    fontSize: scale(28),
    fontFamily: 'pixel',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  resultStats: {
    width: '100%',
    marginBottom: scale(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: scale(8),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
  },
  statLabel: {
    fontSize: scale(13),
    color: '#000',
    fontFamily: 'pixel',
  },
  statValue: {
    fontSize: scale(16),
    color: '#000',
    fontFamily: 'pixel',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: scale(12),
    gap: scale(10),
  },
  detailToggleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: scale(14),
    paddingVertical: scale(16),
    borderRadius: 8,
    flex: 1,
    borderWidth: 3,
    borderColor: '#1565C0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailToggleText: {
    fontSize: scale(11),
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    lineHeight: scale(16),
  },
  finishButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderRadius: 8,
    flex: 1,
    borderWidth: 3,
    borderColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: scale(14),
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Detailed View Styles
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: scale(16),
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderRadius: 5,
    marginRight: scale(12),
    borderWidth: 2,
    borderColor: '#444',
  },
  backButtonText: {
    fontSize: scale(11),
    color: 'white',
    fontFamily: 'pixel',
  },
  detailedTitle: {
    fontSize: scale(16),
    color: '#000',
    fontFamily: 'pixel',
    fontWeight: 'bold',
    flex: 1,
  },
  detailedContentWrapper: {
    width: '100%',
  },
  scenarioDetailItem: {
    backgroundColor: 'rgba(212, 192, 144, 0.6)',
    borderRadius: 8,
    padding: scale(14),
    marginBottom: scale(12),
    borderWidth: 2,
    borderColor: '#8B7355',
  },
  scenarioDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  scenarioDetailNumber: {
    fontSize: scale(13),
    color: '#000',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  scenarioStatusBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  scenarioStatusText: {
    fontSize: scale(9),
    color: 'white',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  scenarioDetailContent: {
    marginTop: scale(8),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 115, 85, 0.4)',
  },
  scenarioDetailText: {
    fontSize: scale(11),
    color: '#000',
    fontFamily: 'space-mono',
    marginBottom: scale(4),
  },
  scenarioDetailAnswer: {
    fontSize: scale(11),
    color: '#333',
    fontFamily: 'pixel',
    fontStyle: 'italic',
    marginTop: scale(3),
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: 15,
    alignSelf: 'center',
  },
  savingText: {
    fontSize: scale(11),
    color: '#000',
    fontFamily: 'pixel',
    marginLeft: scale(8),
  },

  // Library Modal Styles - FIXED
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9,
  },
  libraryPanel: {
    position: 'absolute',
    top: height * 0.06,
    alignSelf: 'center',
    width: isSmallDevice ? width * 0.92 : isMediumDevice ? width * 0.88 : width * 0.85,
    maxWidth: 700,
    maxHeight: height * 0.85,
    zIndex: 10,
  },
  libraryContainer: {
    backgroundColor: '#E8D4A0',
    borderRadius: 5,
    borderWidth: 4,
    borderColor: '#8B7355',
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: height * 0.85,
    flex: 1,
  },
  libraryTitle: {
    fontSize: scale(22),
    color: '#000',
    fontFamily: "pixel",
    marginBottom: scale(16),
    marginTop: scale(8),
    textAlign: 'center',
    paddingBottom: scale(12),
    borderBottomWidth: 3,
    borderBottomColor: '#8B7355',
  },
  libraryContent: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
  },
  referenceContainer: {
    marginBottom: scale(24),
    paddingHorizontal: scale(8),
  },
  referenceText: {
    fontSize: scale(11),
    color: '#000',
    fontFamily: 'space-mono',
    lineHeight: scale(17),
    textAlign: 'justify',
  },
  libraryBackButton: {
    backgroundColor: '#666',
    paddingVertical: scale(14),
    paddingHorizontal: scale(40),
    borderRadius: 8,
    marginTop: scale(16),
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  libraryBackButtonText: {
    fontSize: scale(15),
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  linkText: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: scale(14),
    color: '#000',
    fontFamily: "pixel",
    marginBottom: scale(12),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subsectionTitle: {
    fontSize: scale(12),
    color: '#000',
    fontFamily: "pixel",
    marginTop: scale(12),
    marginBottom: scale(8),
    textDecorationLine: 'underline',
  },
});