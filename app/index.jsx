import React, { useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  ImageBackground,
  SafeAreaView,
  Animated,
  Image
} from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Configuration for background speed
const BACKGROUND_SPEED = 12000; // Lower number = faster movement (try 8000-20000)

export default function Home() {
  const scrollAnimation = useRef(new Animated.Value(0)).current;
  const carAnimation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Create INFINITE continuous scrolling animation for background
    const startBackgroundAnimation = () => {
      scrollAnimation.setValue(0); // Reset to start
      Animated.loop(
        Animated.timing(scrollAnimation, {
          toValue: 1,
          duration: BACKGROUND_SPEED, // Use configurable speed
          useNativeDriver: true,
        }),
        { iterations: -1 } // Infinite loop
      ).start();
    };

    // Create INFINITE bouncing animation for car
    const startCarAnimation = () => {
      carAnimation.setValue(0); // Reset to start
      Animated.loop(
        Animated.sequence([
          Animated.timing(carAnimation, {
            toValue: 1,
            duration: 1000, // 1 second up
            useNativeDriver: true,
          }),
          Animated.timing(carAnimation, {
            toValue: 0,
            duration: 1000, // 1 second down
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 } // Infinite loop
      ).start();
    };

    // Start both animations
    startBackgroundAnimation();
    startCarAnimation();

    // Cleanup function
    return () => {
      scrollAnimation.stopAnimation();
      carAnimation.stopAnimation();
    };
  }, []); // Empty dependency array - run once on mount

  const translateX = scrollAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width], // Move from right to left
  });

  const carBounce = carAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8], // Bounces up 8 pixels
  });

  const handleStartPress = () => {
    router.push('/loadingScreen'); // Navigate to loadingScreen
    console.log('Starting RoadCheck app...');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Moving Background Container */}
      <View style={styles.movingBackgroundContainer}>
        {/* First Background Image */}
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: translateX }] }
          ]}
        >
          <ImageBackground
            source={require('../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>

        {/* Second Background Image (for seamless loop) */}
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: Animated.add(translateX, width) }] }
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

      {/* Overlay for better text contrast */}
      <View style={styles.overlay} />

      {/* Moving PNG Car */}
      <Animated.View 
        style={[
          styles.carContainer,
          {
            transform: [{ translateY: carBounce }],
          },
        ]}
      >
        <Image
          source={require('../assets/car/blue-car.png')} 
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>
        
      {/* Main Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>ROADCHECK</Text>
        <View style={styles.statsContainer}>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Your main app content can go here */}
      </View>

      {/* Tap to Start Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartPress}>
        <Text style={styles.startText}>TAP ANYWHERE TO START!</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  movingBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    transform: [{ scale: 1.3 }], // Increase this number for more zoom (try 1.2, 1.3, 1.5)
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: 0,
  },
  // PNG CAR STYLES
  carContainer: {
    position: 'absolute',
    bottom: -30,
    left: width * 0.05, // Position car on left side
    zIndex: 2,
  },
  carImage: {
    width: 440,  // Adjust size as needed
    height: 210,  // Adjust size as needed
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 60,
    zIndex: 1,
    
  },
  title: {
    fontSize: 78,
    color: 'white',
    fontFamily: 'Pixel3', // Updated to use Pixel3 font
    textShadowOffset: { width: 3, height: 3 },
    textShadowColor: '#000',
    textShadowRadius: 6,
    letterSpacing: 4,
    
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 30,
  },
  statBox: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    fontFamily: 'Pixel3', // Updated to use Pixel3 font
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  startButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 217, 0, 0)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 0,
    top: 220,
    zIndex: 2,
  },
  startText: {
    fontSize: 20,
    color: '#ffffffff',
    fontFamily: 'Pixel3', // Updated to use Pixel3 font
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
});