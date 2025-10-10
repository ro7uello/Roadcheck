// src/app/index.tsx
import React, { useRef, useState } from 'react';
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
  Modal
} from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

export default function Home() {
  const scrollAnimation = useRef(new Animated.Value(0)).current;
  const carAnimation = useRef(new Animated.Value(0)).current;
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
    setShowDisclaimer(true);
    console.log('Starting RoadCheck app...');
    console.log('All env vars:', process.env);
    console.log('API_URL specifically:', process.env.API_URL);
  };

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    router.push('scenarios/intersection/phase1/S10P1');
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

        {/* Disclaimer Modal */}
        <Modal
          visible={showDisclaimer}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}} // Prevent closing without accepting
        >
          <View style={styles.modalOverlay}>
            <View style={styles.disclaimerModal}>
              <View style={styles.disclaimerHeader}>
                <Text style={styles.disclaimerTitle}>IMPORTANT DISCLAIMER</Text>
              </View>
              
              <View style={styles.disclaimerContent}>
                <Text style={styles.disclaimerText}>
                  RoadCheck is a driving decision simulator. It only simulates scenarios that may or may not be encountered by the user on the road.{'\n\n'}
                  
                  Road directions and locations may not be accurate in real life.{'\n\n'}
                  
                  Please exercise defensive driving and adjust accordingly when you encounter these scenarios in real life.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.disclaimerButton}
                onPress={handleDisclaimerAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.disclaimerButtonText}>I UNDERSTAND</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: width * 0.85,
    maxHeight: height * 0.75, 
    minHeight: height * 0.65,
    overflow: 'hidden',
  },
  disclaimerHeader: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontFamily: 'Pixel3',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  disclaimerContent: {
    flex: 1, // Added flex to take available space
    padding: 20,
    paddingBottom: 10,
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#333',
    lineHeight: 16,
    fontFamily: 'Pixel3',
    textAlign: 'center',
  },
  disclaimerButton: {
    backgroundColor: '#4ef5a2',
    marginHorizontal: 20,
    marginBottom: 20, // Increased bottom margin
    marginTop: 5, // Added top margin
    paddingVertical: 10, // Increased padding for better visibility
    borderRadius: 8,
    alignItems: 'center',
  },
  disclaimerButtonText: {
    color: 'white',
    fontFamily: 'Pixel3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});