// src/app/index.tsx
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
const BACKGROUND_SPEED = 12000;

export default function Home() {
  const scrollAnimation = useRef(new Animated.Value(0)).current;
  const carAnimation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startBackgroundAnimation = () => {
      scrollAnimation.setValue(0);
      Animated.loop(
        Animated.timing(scrollAnimation, {
          toValue: 1,
          duration: BACKGROUND_SPEED,
          useNativeDriver: true,
        })
      ).start();
    };

    const startCarAnimation = () => {
      carAnimation.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(carAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(carAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startBackgroundAnimation();
    startCarAnimation();

    return () => {
      scrollAnimation.stopAnimation();
      carAnimation.stopAnimation();
    };
  }, []);

  // Fixed: Changed outputRange to create seamless loop
  const translateX = scrollAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const carBounce = carAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const handleStartPress = () => {
    router.push('/login');
    console.log('Starting RoadCheck app...');
    console.log('All env vars:', process.env);
    console.log('API_URL specifically:', process.env.API_URL);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleStartPress} activeOpacity={1}>
      <SafeAreaView style={styles.container}>
        <View style={styles.movingBackgroundContainer}>
          {/* First background instance */}
          <Animated.View
            style={[
              styles.backgroundWrapper,
              { transform: [{ translateX: translateX }] }
            ]}
          >
            <ImageBackground
              source={require('../../assets/background/city-background.png')}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Second background instance - positioned exactly at width */}
          <Animated.View
            style={[
              styles.backgroundWrapper,
              {
                transform: [{
                  translateX: Animated.add(translateX, width)
                }]
              }
            ]}
          >
            <ImageBackground
              source={require('../../assets/background/city-background.png')}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        <View style={styles.overlay} />

        <Animated.View
          style={[
            styles.carContainer,
            {
              transform: [{ translateY: carBounce }],
            },
          ]}
        >
          <Image
            source={require('../../assets/car/blue-car.png')}
            style={styles.carImage}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>ROADCHECK</Text>
        </View>

        <View style={styles.contentArea} />

        <View style={styles.startButton}>
          <Text style={styles.startText}>TAP ANYWHERE TO START!</Text>
        </View>
      </SafeAreaView>
    </TouchableOpacity>
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
    overflow: 'hidden', // Added to ensure clean edges
  },
  backgroundWrapper: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: 0,
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
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 60,
    zIndex: 1,
  },
  title: {
    fontSize: 78,
    color: 'white',
    fontFamily: 'Pixel3',
    textShadowOffset: { width: 3, height: 3 },
    textShadowColor: '#000',
    textShadowRadius: 6,
    letterSpacing: 4,
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
    color: '#ffffff',
    fontFamily: 'Pixel3',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
});