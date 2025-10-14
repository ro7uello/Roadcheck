// src/app/scenarios/traffic-signs/phase3/S1P3.tsx
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import { Animated, Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef } from 'react';

const { width, height } = Dimensions.get('window');

export default function TrafficSignsPhase3ComingSoon() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../../../../assets/fonts/pixel3.ttf'),
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../../../../assets/background/city-background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Back Button - Same as phase selection */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../../../../assets/icon/backButton.png')}
            style={styles.backButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Construction Icon */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.icon}>🚧</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>COMING SOON</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>TRAFFIC SIGNS</Text>
          <Text style={styles.phase}>PHASE 3</Text>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              This phase is currently under construction.
            </Text>
            <Text style={styles.message}>
              Check back soon for new challenges!
            </Text>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeContainer}>
            <Text style={styles.decorative}>⚠️</Text>
            <Text style={styles.decorative}>🚦</Text>
            <Text style={styles.decorative}>⚠️</Text>
          </View>
        </Animated.View>

        {/* Bottom Button */}
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.returnButtonText}>RETURN TO PHASES</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  // Back button - matching phase selection screen exactly
  backButton: {
    position: 'absolute',
    top: 40,
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  backButtonImage: {
    width: 100,
    height: 30,
    marginBottom: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: Math.min(width * 0.08, 36),
    fontFamily: 'pixel',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: Math.min(width * 0.055, 24),
    fontFamily: 'pixel',
    color: 'white',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginBottom: 5,
  },
  phase: {
    fontSize: Math.min(width * 0.045, 20),
    fontFamily: 'pixel',
    color: '#FFA500',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginBottom: 30,
  },
  messageContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    marginBottom: 25,
    width: width * 0.8,
  },
  message: {
    fontSize: Math.min(width * 0.032, 14),
    fontFamily: 'pixel',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  decorativeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 15,
  },
  decorative: {
    fontSize: 35,
    opacity: 0.8,
  },
  returnButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  returnButtonText: {
    fontSize: Math.min(width * 0.038, 16),
    fontFamily: 'pixel',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 2,
  },
});