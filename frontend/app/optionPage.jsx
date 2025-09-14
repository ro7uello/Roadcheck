// ===== FIXED app/optionPage.jsx =====
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
const BACKGROUND_SPEED = 12000;

export default function OptionPage() {
  const [fontsLoaded] = useFonts({
    'pixel': require('../assets/fonts/pixel3.ttf'),
  });
  
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const driverScale = useRef(new Animated.Value(1)).current;
  const pedestrianScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
    }

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      driverScale.stopAnimation();
      pedestrianScale.stopAnimation();
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

  const handleDriverPress = () => {
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
    ]).start(() => {
      router.push('/driverGame');
    });
  };

  const handlePedestrianPress = () => {
    Animated.sequence([
      Animated.timing(pedestrianScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pedestrianScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/pedestrianGame');
    });
  };

  const goBack = () => {
    router.back();
  };

  if (!fontsLoaded) {
    return null;
  }

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

      <View style={styles.skyOverlay} />

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

      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

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

      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE</Text>
      </View>

      <View style={styles.selectionContainer}>
        <Animated.View style={[{ transform: [{ scale: driverScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleDriverPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icon/steeringwheel.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>DRIVER</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[{ transform: [{ scale: pedestrianScale }] }]}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handlePedestrianPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../assets/icon/commuter.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>PEDESTRIAN</Text>
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
  skyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: 0,
  },
  carContainer: {
    position: 'absolute',
    bottom: -25,
    left: width * 0.05,
    zIndex: 2,
  },
  carImage: {
    width: 400,
    height: 210,
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
    fontSize: 78,
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
    top: height * 0.3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 80,
    zIndex: 3,
  },
  optionContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 30,
    borderWidth: 3,
    borderColor: '#666',
    minWidth: 120,
  },
  iconContainer: {
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  optionImage: {
    width: 100,
    height: 100,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
