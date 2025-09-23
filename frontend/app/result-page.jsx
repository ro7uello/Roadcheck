// ===== app/result-page.jsx =====
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

export default function ResultPage() {
  const [fontsLoaded] = useFonts({
    pixel: require('../assets/fonts/pixel3.ttf'),
  });

  const [settingsVisible, setSettingsVisible] = useState(false);

  // Sample result data - you can pass this as props or from navigation params
  const [resultData] = useState({
    status: 'PASS/FAIL', // 'PASS' or 'FAIL'
    correctActs: 8,
    violations: 2,
    totalTimeSpent: '10:00',
    totalScore: '80%'
  });

  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const resultPanelScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
      // Show result panel automatically
      showResultPanel();
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
    router.push('/loadingScreen');
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
            source={require('../assets/background/city-background.png')}
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
            source={require('../assets/background/city-background.png')}
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
          source={require('../assets/car/blue-car.png')}
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
            source={require('../assets/icon/Settings.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => console.log('Library pressed')}
        >
          <Image
            source={require('../assets/icon/Library.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Result Panel */}
      <Animated.View
        style={[
          styles.resultPanel,
          { transform: [{ scale: resultPanelScale }] },
        ]}
      >
        {/* Tab Background */}
        <Image
          source={require('../assets/background/settings-tab.png')}
          style={styles.resultTab}
          resizeMode="stretch"
        />

        {/* Result Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>RESULT</Text>
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
            <Text style={styles.statValue}>{resultData.correctActs}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>VIOLATIONS:</Text>
            <Text style={styles.statValue}>{resultData.violations}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>TOTAL TIME SPENT:</Text>
            <Text style={styles.statValue}>{resultData.totalTimeSpent}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>TOTAL:</Text>
            <Text style={styles.statValue}>{resultData.totalScore}</Text>
          </View>
        </View>

        {/* Finish Button */}
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishPress}
        >
          <Text style={styles.finishButtonText}>FINISH</Text>
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
            source={require('../assets/background/settings-tab.png')}
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
                source={require('../assets/background/profile.png')}
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
                source={require('../assets/background/audio.png')}
                style={styles.audioButton}
              />
            </TouchableOpacity>

            {/* Back */}
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => setSettingsVisible(false)}
            >
              <Image
                source={require('../assets/background/back.png')}
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

  // Result panel styles
  resultPanel: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    width: Math.min(width * 0.9, 400),
    height: Math.min(height * 0.65, 450),
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
    marginBottom: 30,
    bottom:20,
  },
  resultTitle: {
    fontSize: 20,
    color: 'black',
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
    width: '80%',
    flex: 1,
    justifyContent: 'center',
    gap: 11,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
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
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#45a049',
    bottom: -20,
    
  },
  finishButtonText: {
    fontSize: 16,
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