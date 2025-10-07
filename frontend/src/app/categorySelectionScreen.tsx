// src/app/categorySelectionScreen.tsx
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
  ScrollView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Configuration
const BACKGROUND_SPEED = 12000;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.35:3001';

export default function CategorySelectionScreen() {
  // Load font
  const [fontsLoaded] = useFonts({
    'pixel': require('../../assets/fonts/pixel3.ttf'),
  });

  // State
  const [selectedMode, setSelectedMode] = useState('driver');
  const [isLoading, setIsLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [libraryVisible, setLibraryVisible] = useState(false);

  // Animations
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const roadMarkingsScale = useRef(new Animated.Value(1)).current;
  const signsScale = useRef(new Animated.Value(1)).current;
  const intersectionScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const libraryModalScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundAnimation();
      startCarAnimation();
      loadUserData();
    }

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      roadMarkingsScale.stopAnimation();
      signsScale.stopAnimation();
      intersectionScale.stopAnimation();
      modalScale.stopAnimation();
      libraryModalScale.stopAnimation();
    };
  }, [fontsLoaded]);

  const loadUserData = async () => {
    try {
      const mode = await AsyncStorage.getItem('selectedMode');
      setSelectedMode(mode || 'driver');
      await loadUserProgress();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/attempts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const attempts = await response.json();
          setUserProgress(attempts);
        }
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const saveUserProgress = async (categoryId, categoryName, route) => {
    try {
      setIsLoading(true);

      await AsyncStorage.setItem('selectedCategory', JSON.stringify({
        id: categoryId,
        name: categoryName,
        selectedAt: new Date().toISOString()
      }));

      router.push(route);

    } catch (error) {
      console.error('Error saving category progress:', error);
      router.push(route);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Animated.spring(libraryModalScale, {
      toValue: libraryVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [libraryVisible]);

  const startBackgroundAnimation = () => {
    backgroundAnimation.setValue(0);
    Animated.loop(
      Animated.timing(backgroundAnimation, {
        toValue: 1,
        duration: BACKGROUND_SPEED,
        useNativeDriver: true,
      })
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
      ])
    ).start();
  };

  const handleRoadMarkingsPress = () => {
    if (isLoading) return;

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
      saveUserProgress(1, 'Road Markings', '/phaseSelectionScreen?categoryId=1&categoryName=Road Markings&categorySlug=road-markings');
    });
  };

  const handleSignsPress = () => {
    if (isLoading) return;

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
      saveUserProgress(2, 'Traffic Signs', '/phaseSelectionScreen?categoryId=2&categoryName=Traffic Signs&categorySlug=traffic-signs');
    });
  };

  const handleIntersectionPress = () => {
    if (isLoading) return;

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
      saveUserProgress(3, 'Intersection and Others', '/phaseSelectionScreen?categoryId=3&categoryName=Intersection and Others&categorySlug=intersection-and-others');
    });
  };

  const handleSettingsPress = () => {
    router.push('/profile');
  };

  const handleLibraryPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }
    setLibraryVisible(true);
  };

  const goBack = () => {
    router.back();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
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
      {/* Moving Background - FIXED */}
      <View style={styles.backgroundContainer}>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: backgroundTranslate }] }
          ]}
        >
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.backgroundWrapper,
            { transform: [{ translateX: Animated.add(backgroundTranslate, width) }] }
          ]}
        >
          <ImageBackground
            source={require('../../assets/background/city-background.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
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
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Image
          source={require('../../assets/icon/backButton.png')}
          style={styles.backButtonImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Top Right Icons */}
      <View style={styles.topRightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
          <Image
            source={require('../../assets/icon/Settings.png')}
            style={styles.topIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleLibraryPress}>
          <Image
            source={require('../../assets/icon/Library.png')}
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
            style={[styles.optionContainer, isLoading && styles.disabledOption]}
            onPress={handleRoadMarkingsPress}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/roadmarkings.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>ROAD MARKINGS</Text>
            {userProgress.roadMarkings && (
              <View style={styles.progressIndicator}>
                <Text style={styles.progressText}>
                  {userProgress.roadMarkings.percentage || 0}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Signs Option */}
        <Animated.View style={[{ transform: [{ scale: signsScale }] }]}>
          <TouchableOpacity
            style={[styles.optionContainer, isLoading && styles.disabledOption]}
            onPress={handleSignsPress}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/roadsigns.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>SIGNS</Text>
            {userProgress.signs && (
              <View style={styles.progressIndicator}>
                <Text style={styles.progressText}>
                  {userProgress.signs.percentage || 0}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Intersection Option */}
        <Animated.View style={[{ transform: [{ scale: intersectionScale }] }]}>
          <TouchableOpacity
            style={[styles.optionContainer, isLoading && styles.disabledOption]}
            onPress={handleIntersectionPress}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/intersection.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>INTERSECTION</Text>
            {userProgress.intersection && (
              <View style={styles.progressIndicator}>
                <Text style={styles.progressText}>
                  {userProgress.intersection.percentage || 0}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Saving progress...</Text>
        </View>
      )}

      {libraryVisible && (
        <Animated.View
          style={[
            styles.libraryPanel,
            { transform: [{ scale: libraryModalScale }] },
          ]}
        >
          <Image
            source={require('../../assets/background/settings-tab.png')}
            style={styles.settingsTab}
            resizeMode="stretch"
          />

          <Text style={styles.libraryTitle}>REFERENCES</Text>

          <View style={styles.libraryContent}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.referenceContainer}>
                <Text style={styles.referenceText}>
                  Land Transportation Office. (2023). Road and traffic rules, signs, signals, and markings (RO102).{'\n'}
                  <TouchableOpacity onPress={() => Linking.openURL('https://lto.gov.ph/wp-content/uploads/2023/09/RO102_CDE_Road_and_Traffic_Rules_Signs-Signals-Markings.pdf')}>
                    <Text style={[styles.referenceText, styles.linkText]}>
                      https://lto.gov.ph/wp-content/uploads/2023/09/RO102_CDE_Road_and_Traffic_Rules_Signs-Signals-Markings.pdf
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>

              <View style={styles.referenceContainer}>
                <Text style={styles.referenceText}>
                  National Highway Traffic Safety Administration. Pedestrian Safety{'\n'}
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.nhtsa.gov/road-safety/pedestrian-safety')}>
                    <Text style={[styles.referenceText, styles.linkText]}>
                      https://www.nhtsa.gov/road-safety/pedestrian-safety
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.libraryBackButton}
            onPress={() => setLibraryVisible(false)}
          >
            <Image
              source={require('../../assets/background/back.png')}
              style={styles.backButtonImage}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#87CEEB',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
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
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
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
    alignItems: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 50,
    fontWeight: 'normal',
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
    position: 'relative',
  },
  disabledOption: {
    opacity: 0.6,
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
    fontWeight: 'normal',
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    bottom: -40,
  },
  optionImage: {
    width: 150,
    height: 150,
  },
  progressIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 10,
    color: 'white',
    fontFamily: 'pixel',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  backButtonImage: {
    width: 100,
    height: 30,
    resizeMode: 'contain',
    marginBottom: 5
  },
  settingsTab: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  linkText: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  libraryPanel: {
    position: 'absolute',
    top: height * 0.1,
    alignSelf: 'center',
    width: Math.min(width * 0.9, 450),
    height: Math.min(height * 0.75, 500),
    alignItems: 'center',
    zIndex: 10,
  },
  libraryTitle: {
    fontSize: 15,
    color: 'black',
    fontFamily: "Pixel3",
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  libraryContent: {
    flex: 1,
    width: '85%',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  referenceContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  referenceText: {
    fontSize: 10,
    color: 'black',
    fontFamily: "Pixel3",
    lineHeight: 14,
    textAlign: 'justify',
  },
  libraryBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
});