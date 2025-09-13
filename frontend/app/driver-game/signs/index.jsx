import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
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

export default function Signs() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../../assets/fonts/pixel3.ttf'),
  });

  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const option1Scale = useRef(new Animated.Value(1)).current;
  const option2Scale = useRef(new Animated.Value(1)).current;
  const option3Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
    }
    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      option1Scale.stopAnimation();
      option2Scale.stopAnimation();
      option3Scale.stopAnimation();
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
        Animated.timing(carBounce, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(carBounce, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      { iterations: -1 }
    ).start();
  };

  // handlers for the three options
  const handleOptionPress = (scaleRef, path) => {
    Animated.sequence([
      Animated.timing(scaleRef, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleRef, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      router.push(path);
    });
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
          style={[styles.backgroundWrapper, { transform: [{ translateX: backgroundTranslate }] }]}
        >
          <ImageBackground
            source={require('../../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: Animated.add(backgroundTranslate, width) }] },
          ]}
        >
          <ImageBackground
            source={require('../../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="stretch"
            imageStyle={styles.backgroundImageStyle}
          />
        </Animated.View>
      </View>

      {/* Overlay */}
      <View style={styles.skyOverlay} />

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carVerticalBounce }] }]}>
        <Image source={require('../../../assets/car/blue-car.png')} style={styles.carImage} resizeMode="contain" />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Image
          source={require('../../../assets/icon/backButton.png')}
          style={styles.backButtonImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>ROAD SIGNS</Text>
      </View>

      {/* 3 Options */}
      <View style={styles.selectionContainer}>
        {/* Option 1 */}
        <Animated.View style={{ transform: [{ scale: option1Scale }] }}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={() => handleOptionPress(option1Scale, '/driver-game/signs/chapter-1')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/icon/1.png')} style={styles.optionImage} resizeMode="contain" />
            <Text style={styles.optionLabel}>CHAPTER 1</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Option 2 */}
        <Animated.View style={{ transform: [{ scale: option2Scale }] }}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={() => handleOptionPress(option2Scale, '/driver-game/signs/chapter-2')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/icon/2.png')} style={styles.optionImage} resizeMode="contain" />
            <Text style={styles.optionLabel}>CHAPTER 2</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Option 3 */}
        <Animated.View style={{ transform: [{ scale: option3Scale }] }}>
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={() => handleOptionPress(option3Scale, '/driver-game/signs/chapter-3')}
            activeOpacity={0.8}
          >
            <Image source={require('../../../assets/icon/3.png')} style={styles.optionImage} resizeMode="contain" />
            <Text style={styles.optionLabel}>CHAPTER 3</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backgroundWrapper: { position: 'absolute', width, height },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  backgroundImageStyle: { width: '100%', height: '100%', transform: [{ scale: 1.3 }] },
  skyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0)', zIndex: 0 },
  carContainer: { position: 'absolute', bottom: height * 0.05, left: width * 0.05, zIndex: 2 },
  carImage: { width: 200, height: 200, bottom: -50 },

  titleContainer: { marginTop: -50, alignItems: 'center' },
  title: {
    fontSize: 42,
    fontFamily: 'pixel',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 3,
    marginTop: -50,
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
  },
  optionContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 3,
    borderColor: '#666',
    width: 200,
    height: 200,
    justifyContent: 'center',
  },
  optionImage: { width: 150, height: 150 },
  optionLabel: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});