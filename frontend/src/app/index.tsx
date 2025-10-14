// src/app/index.tsx
import React, { useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  ImageBackground,
  ScrollView,
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
  const [disclaimerScrolledToBottom, setDisclaimerScrolledToBottom] = useState(false);

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

  const handleDisclaimerScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Check if content is smaller than container (no scrolling needed)
    const contentFitsInView = contentSize.height <= layoutMeasurement.height + paddingToBottom;
    
    // Check if scrolled to bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (contentFitsInView || isCloseToBottom) {
      setDisclaimerScrolledToBottom(true);
    }
  };

  const handleStartPress = () => {
    setDisclaimerScrolledToBottom(false);
    setShowDisclaimer(true);
    console.log('Starting RoadCheck app...');
    console.log('All env vars:', process.env);
    console.log('API_URL specifically:', process.env.API_URL);
  };

  const handleDisclaimerAccept = () => {
    if (disclaimerScrolledToBottom) {
      setShowDisclaimer(false);
      router.push('scenarios/road-markings/phase1/S5P1');
    }
  };

  React.useEffect(() => {
    if (showDisclaimer) {
      setTimeout(() => {
        // Check if content doesn't need scrolling - for small screens
        const modalHeight = height * 0.80;
        const headerHeight = 60; // Approximate header height
        const buttonHeight = 60; // Approximate button height
        const availableContentHeight = modalHeight - headerHeight - buttonHeight;
        
        // If estimated content height is small, auto-enable
        // This is a fallback for when content fits without scrolling
      }, 500);
    }
  }, [showDisclaimer]);

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
              
              <ScrollView 
                style={styles.disclaimerScrollView}
                contentContainerStyle={styles.disclaimerContent}
                showsVerticalScrollIndicator={true}
                onScroll={handleDisclaimerScroll} // Add scroll handler
                scrollEventThrottle={16} // Smooth scroll tracking
                onContentSizeChange={(contentWidth, contentHeight) => {
                  // Auto-enable if content fits in view
                  const modalScrollViewHeight = height * 0.80 - 120; // Subtract header and button space
                  if (contentHeight <= modalScrollViewHeight) {
                    setDisclaimerScrolledToBottom(true);
                  }
                }}
              >
                <Text style={styles.disclaimerText}>
                  RoadCheck is a driving decision simulator developed for educational purposes only.{'\n\n'}
          
                  <Text style={styles.disclaimerSectionHeader}>IMPORTANT LIMITATIONS:{'\n\n'}</Text>
                  
                  • Road directions, locations, and scenarios presented in this application may not accurately reflect real-world conditions.{'\n\n'}
                  
                  • This application does NOT replace professional driving instruction, official LTO (Land Transportation Office) training programs, or hands-on driving experience.{'\n\n'}
                  
                  • Simulated scenarios are simplified and cannot capture all real-world variables such as weather conditions, traffic density, road quality, vehicle conditions, and other drivers' unpredictable behavior.{'\n\n'}
                  
                  <Text style={styles.disclaimerSectionHeader}>USER RESPONSIBILITY:{'\n\n'}</Text>
                  
                  • Always exercise defensive driving and strictly follow official Philippine traffic rules and regulations.{'\n\n'}
                  
                  • Make driving decisions based on actual road conditions and your judgment, not solely on app simulations.{'\n\n'}
                  
                  • Never use this application while operating a vehicle or motorcycle.{'\n\n'}
                  
                  • Consult with licensed driving instructors and refer to official LTO materials and manuals for authoritative guidance.{'\n\n'}
                  
                  • Practice safe driving habits and remain alert to your surroundings at all times.{'\n\n'}
                  
                  <Text style={styles.disclaimerSectionHeader}>NO LIABILITY:{'\n\n'}</Text>
                  
                  • The developers of RoadCheck assume no responsibility or liability for any accidents, traffic violations, damages, injuries, or losses that may occur from decisions made based on information, scenarios, or simulations provided by this application.{'\n\n'}
                  
                  • By using RoadCheck, you acknowledge and understand that real-world driving requires sound judgment, proper training, practical experience, and strict adherence to local traffic laws. All of which go beyond what any simulation can provide.
                </Text>
              </ScrollView>

              {/* Show scroll prompt if not scrolled to bottom */}

              <TouchableOpacity 
                style={[
                  styles.disclaimerButton,
                  !disclaimerScrolledToBottom && styles.disclaimerButtonDisabled
                ]}
                onPress={handleDisclaimerAccept}
                activeOpacity={disclaimerScrolledToBottom ? 0.8 : 1}
                disabled={!disclaimerScrolledToBottom} // Disable button
              >
                <Text style={[
                  styles.disclaimerButtonText,
                  !disclaimerScrolledToBottom && styles.disclaimerButtonTextDisabled
                ]}>
                  {disclaimerScrolledToBottom ? "I UNDERSTAND" : "SCROLL TO CONTINUE"}
                </Text>
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
    width: width * 0.90, 
    height: height * 0.80,
    overflow: 'hidden',
  },
  disclaimerScrollView: {
    flex: 1,
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
    padding: 20,
    paddingBottom: 10,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily:'spaceMono',
    color: '#333',
    lineHeight: 16,
    textAlign: 'left',
  },
  disclaimerSectionHeader: {
    fontSize: 11,
    color: '#ff4444',
    fontFamily: 'Pixel3',
    fontWeight: 'bold',
    textAlign: 'left',
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
  disclaimerButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  disclaimerButtonTextDisabled: {
    color: '#666666',
  },
});