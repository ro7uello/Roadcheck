// ===== FIXED app/loadingScreen.jsx =====
import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;
const LOADING_DURATION = 3000;
const PROGRESS_STEPS = 60;

export default function LoadingScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('LOADING');
  
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const textPulse = useRef(new Animated.Value(0)).current;
  const loadingBarAnimation = useRef(new Animated.Value(0)).current;
  const fadeInAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startFadeInAnimation();
    startBackgroundAnimation();
    startCarAnimation();
    startTextAnimation();
    startLoadingAnimation();

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      textPulse.stopAnimation();
      loadingBarAnimation.stopAnimation();
      fadeInAnimation.stopAnimation();
    };
  }, []);

  const startFadeInAnimation = () => {
    Animated.timing(fadeInAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
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
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(carBounce, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const startTextAnimation = () => {
    textPulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(textPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(textPulse, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const updateLoadingText = (progress) => {
    const dots = '.'.repeat((Math.floor(progress / 10) % 4));
    if (progress < 30) {
      setLoadingText(`INITIALIZING${dots}`);
    } else if (progress < 60) {
      setLoadingText(`LOADING ASSETS${dots}`);
    } else if (progress < 99) {
      setLoadingText(`PREPARING GAME${dots}`);
    } else {
      setLoadingText('READY TO PLAY!');
    }
  };

  const startLoadingAnimation = () => {
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        let increment;
        if (currentProgress < 20 || currentProgress > 80) {
          increment = 1;
        } else {
          increment = 2;
        }
        
        const newProgress = Math.min(prev + increment, 100);
        currentProgress = newProgress;
        
        updateLoadingText(newProgress);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            // Navigate to option page
            router.replace('/optionPage');
          }, 800);
          return 100;
        }
        return newProgress;
      });
    }, LOADING_DURATION / PROGRESS_STEPS);

    Animated.timing(loadingBarAnimation, {
      toValue: 1,
      duration: LOADING_DURATION,
      useNativeDriver: false,
    }).start();
  };

  const backgroundTranslate = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const carVerticalBounce = carBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const carHorizontalFloat = carBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  const textScale = textPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const textOpacity = textPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const loadingBarWidth = loadingBarAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundContainer}>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: backgroundTranslate }] }
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
            { transform: [{ translateX: Animated.add(backgroundTranslate, width) }] }
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

      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.carContainer,
          {
            opacity: fadeInAnimation,
            transform: [
              { translateY: carVerticalBounce },
              { translateX: carHorizontalFloat }
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: fadeInAnimation }
        ]}
      >
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ scale: textScale }],
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={styles.title}>R O A D C H E C K</Text>
        </Animated.View>

        <View style={styles.loadingSection}>
          <Text style={styles.loadingText}>{loadingText}</Text>
          
          <View style={styles.loadingBarContainer}>
            <Animated.View
              style={[
                styles.loadingBar,
                { width: loadingBarWidth }
              ]}
            />
            <View
              style={[
                styles.loadingBarShine,
                { 
                  width: `${loadingProgress}%`,
                }
              ]}
            />
          </View>
          
          <Text style={styles.percentageText}>{loadingProgress}%</Text>
        </View>

        <Text style={styles.subtitle}>PREPARING YOUR ADVENTURE...</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundWrapper: {
    position: 'absolute',
    width: width,
    height: height,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.3 }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  carContainer: {
    position: 'absolute',
    bottom: -30,
    left: width * 0.05,
    zIndex: 2,
  },
  carImage: {
    width: 440,
    height: 210,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    paddingHorizontal: 40,
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    fontSize: 54,
    color: '#ffffff',
    fontFamily: 'Pixel3',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 6,
    textAlign: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'Pixel3',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    minHeight: 30,
    textAlign: 'center',
  },
  loadingBarContainer: {
    width: 300,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFD700',
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 7,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingBarShine: {
    height: '100%',
    backgroundColor: '#FFED4E',
    borderRadius: 7,
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.5,
  },
  percentageText: {
    fontSize: 18,
    color: '#FFD700',
    fontFamily: 'Pixel3',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    minWidth: 50,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Pixel3',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});