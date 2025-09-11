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
import { useFonts } from 'expo-font';

const { width, height } = Dimensions.get('window');

// Configuration
const BACKGROUND_SPEED = 12000;

export default function DriverPage() {
  // Load font
  const [fontsLoaded] = useFonts({
    'pixel': require('../assets/fonts/pixel3.ttf'),
  });
  
  // Animations
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const roadMarkingsScale = useRef(new Animated.Value(1)).current;
  const signsScale = useRef(new Animated.Value(1)).current;
  const intersectionScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
    }

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      roadMarkingsScale.stopAnimation();
      signsScale.stopAnimation();
      intersectionScale.stopAnimation();
    };
  }, [fontsLoaded]);

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

  const handleRoadMarkingsPress = () => {
    Animated.sequence([
      Animated.timing(roadMarkingsScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(roadMarkingsScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/ScenarioTest');
    });
  };

  const handleSignsPress = () => {
    Animated.sequence([
      Animated.timing(signsScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(signsScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/signDriver');
    });
  };

  const handleIntersectionPress = () => {
    Animated.sequence([
      Animated.timing(intersectionScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(intersectionScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/intersectionDriver');
    });
  };

  const goBack = () => {
    router.back();
  };

  if (!fontsLoaded) {
    return null;
  }

  // Animation interpolations
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


      {/* Sky overlay for better contrast */}
      <View style={styles.skyOverlay} />

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
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Top Right Icons */}
      <View style={styles.topRightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Settings pressed')}>
          <Image
            source={require('../assets/icon/Settings.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Dictionary pressed')}>
          <Image
            source={require('../assets/icon/Library.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE</Text>
      </View>

      {/* Options Selection */}
      <View style={styles.selectionContainer}>
        {/* Road Markings Option */}
        <Animated.View style={[{ transform: [{ scale: roadMarkingsScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleRoadMarkingsPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icon/roadmarkings.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>ROAD MARKINGS</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Signs Option */}
        <Animated.View style={[{ transform: [{ scale: signsScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleSignsPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icon/roadsigns.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>SIGNS</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Intersection Option */}
        <Animated.View style={[{ transform: [{ scale: intersectionScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleIntersectionPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icon/intersection.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>INTERSECTION</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
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
  roadContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    zIndex: 1,
  },
  road: {
    flex: 1,
    backgroundColor: '#333333',
    position: 'relative',
  },
  roadStripe: {
    position: 'absolute',
    top: '40%',
    width: 40,
    height: 4,
    backgroundColor: '#FFFF00',
    left: '12.5%',
  },
  skyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: 'rgba(135, 206, 235, 0.3)',
    zIndex: 0,
  },
  carContainer: {
    position: 'absolute',
    bottom: height * 0.05,
    left: width * 0.05,
    zIndex: 2,
  },
  carImage: {
    width: 200,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  topRightIcons: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    zIndex: 5,
  },
  iconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  topIcon: {
    width: 24,
    height: 24,
  },
  titleContainer: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'pixel',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 4,
  },
  selectionContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 3,
  },
  optionContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 3,
    borderColor: '#666',
    width: 200,
    height: 200,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    bottom:-40,
  },
  optionImage: {
    width: 150,
    height: 150,
  },
});