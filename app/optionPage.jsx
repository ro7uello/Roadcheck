import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Configuration
const BACKGROUND_SPEED = 12000; // Same speed as other screens

export default function OptionPage() {
  const [selectedOption, setSelectedOption] = useState(null); // 'driver' or 'passenger'
  
  // Animations
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const titlePulse = useRef(new Animated.Value(0)).current;
  const driverScale = useRef(new Animated.Value(1)).current;
  const passengerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start all animations
    startBackgroundAnimation();
    startCarAnimation();
    startTitleAnimation();

    // Cleanup function
    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      titlePulse.stopAnimation();
      driverScale.stopAnimation();
      passengerScale.stopAnimation();
    };
  }, []);

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

  const startTitleAnimation = () => {
    titlePulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(titlePulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start();
  };

  const handleDriverPress = () => {
    setSelectedOption('driver');
    // Animate button press
    Animated.sequence([
      Animated.timing(driverScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(driverScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    setTimeout(() => {
      router.push('/driverGame'); // Create this screen later
    }, 300);
  };

  const handlePassengerPress = () => {
    setSelectedOption('passenger');
    // Animate button press
    Animated.sequence([
      Animated.timing(passengerScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(passengerScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    setTimeout(() => {
      router.push('/passengerGame'); // Create this screen later
    }, 300);
  };

  const goBack = () => {
    router.back();
  };

  // Animation interpolations
  const backgroundTranslate = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const carVerticalBounce = carBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const titleScale = titlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const titleOpacity = titlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Moving Background */}
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

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Animated Car */}
      <Animated.View
        style={[
          styles.carContainer,
          {
            transform: [{ translateY: carVerticalBounce }],
          },
        ]}
      >
        <Image
          source={require('../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backButtonText}>← BACK</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ scale: titleScale }],
              opacity: titleOpacity,
            },
          ]}
        >
          <Text style={styles.title}>CHOOSE YOUR ROLE</Text>
          <Text style={styles.subtitle}>SELECT HOW YOU WANT TO PLAY</Text>
        </Animated.View>

        {/* Options Container */}
        <View style={styles.optionsContainer}>
          
          {/* Driver Option */}
          <Animated.View
            style={[
              styles.optionWrapper,
              { transform: [{ scale: driverScale }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'driver' && styles.selectedOption
              ]}
              onPress={handleDriverPress}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={require('../assets/icon/steering-wheel.png')} // Your driving wheel PNG
                  style={styles.optionIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.optionTitle}>DRIVER</Text>
              <Text style={styles.optionDescription}>
                Take control and drive the car
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Passenger Option */}
          <Animated.View
            style={[
              styles.optionWrapper,
              { transform: [{ scale: passengerScale }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'passenger' && styles.selectedOption
              ]}
              onPress={handlePassengerPress}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={require('../assets/icon/commuter.png')} // Your passenger PNG
                  style={styles.optionIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.optionTitle}>PASSENGER</Text>
              <Text style={styles.optionDescription}>
                Sit back and enjoy the ride
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </View>

        {/* Instructions */}
        <Text style={styles.instructionText}>
          TAP AN OPTION TO CONTINUE
        </Text>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 30,
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontFamily: 'Pixel3',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    paddingHorizontal: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Pixel3',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Pixel3',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
    gap: 40,
  },
  optionWrapper: {
    flex: 1,
    maxWidth: 200,
  },
  optionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FF6B35',
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  optionIcon: {
    width: 60,
    height: 60,
  },
  optionTitle: {
    fontSize: 24,
    color: '#FFD700',
    fontFamily: 'Pixel3',
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Pixel3',
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Pixel3',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});