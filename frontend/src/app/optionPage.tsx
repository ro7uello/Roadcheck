// src/app/optionPage.tsx
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ImageBackground, SafeAreaView, Animated, Image, Alert, ScrollView, Linking} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

// Backend API configuration
import { API_URL as API_BASE_URL } from '../../config/api';

export default function OptionPage() {
  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
    'spaceMono': require('../../assets/fonts/SpaceMono-Regular.ttf')
  });

  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);

  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const driverScale = useRef(new Animated.Value(1)).current;
  const pedestrianScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const libraryModalScale = useRef(new Animated.Value(0)).current;
  const [showDriverCategories, setShowDriverCategories] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
      console.log('=== Environment Check ===');
        console.log('API_URL from env:', process.env.API_URL);
        console.log('All env vars:', process.env);
    if (fontsLoaded) {
        testBasicConnection();
      startBackgroundAnimation();
      startCarAnimation();
      loadUserProfile();
    }

    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      driverScale.stopAnimation();
      pedestrianScale.stopAnimation();
      modalScale.stopAnimation();
      libraryModalScale.stopAnimation();
    };
  }, [fontsLoaded]);

  // Load user profile from backend
  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        const driverCategories = data.data.filter(cat => cat.id <= 3);
        setCategories(driverCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Save user progress to backend
  const saveUserProgress = async (selectedMode) => {
    console.log('=== saveUserProgress called ===');
    console.log('selectedMode:', selectedMode);
    console.log('API_BASE_URL:', API_BASE_URL);

    try {
      setIsLoading(true);

      const token = await AsyncStorage.getItem('access_token');
      console.log('Token from storage:', token ? 'exists' : 'null');

      if (!token) {
        console.log('No token found, cannot save progress');
        Alert.alert('Error', 'Please log in again');
        router.replace('/login');
        return false;
      }

      // Get the authenticated user ID - FIXED KEY
      const userId = await AsyncStorage.getItem('userId');
      console.log('User ID from storage:', userId);

      if (!userId) {
        console.log('❌ No authenticated user ID found');
        Alert.alert('Error', 'Session expired. Please log in again');
        router.replace('/login');
        return false;
      }

      console.log(`Making API call to: ${API_BASE_URL}/user-progress`);
      console.log('Request body:', {
        user_id: userId,
        current_category_id: 1,
        current_phase: 1,
        current_scenario_index: 0
      });

      const response = await fetch(`${API_BASE_URL}/user-progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          current_category_id: 1,
          current_phase: 1,
          current_scenario_index: 0
        }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Progress saved successfully:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ Failed to save progress:', response.status, errorText);
      }

      // Store locally as backup
      await AsyncStorage.setItem('selectedMode', selectedMode);
      return true;

    } catch (error) {
      console.error('❌ Error saving progress:', error);
      await AsyncStorage.setItem('selectedMode', selectedMode);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

const handleCategorySelect = (category) => {
  console.log('Selected category:', category);

  // Force navigation to phase selection screen
  router.push('/phaseSelectionScreen?categoryId=' + category.id + '&categoryName=' + category.name);
};

const testBasicConnection = async () => {
  try {
    console.log('Testing basic connection...');
    const response = await fetch(`${process.env.API_URL}/categories`);
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Basic connection test failed:', error);
  }
};

  // Animate library modal in/out
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

  const handleDriverPress = async () => {
    if (isLoading) return;

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
    ]).start(async () => {
      console.log('Driver button pressed');
      const success = await saveUserProgress('driver');
      if (success) {
        console.log('Navigating to categorySelectionScreen...');
        router.push('/categorySelectionScreen');  // ✅ Go to existing category screen
      }
    });
  };

  const handlePedestrianPress = async () => {
    if (isLoading) return;

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
      router.push({
        pathname: '/scenarios/pedestrian/phase1/S1P1',
        params: {
          categoryId: '4',
          phaseId: '10',
          categoryName: 'Pedestrian'
        }
      });
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
      {/* Fixed Background */}
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
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.topRightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
          <Image
            source={require('../../assets/icon/c-trans.png')}
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

      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE</Text>
      </View>

      <View style={styles.selectionContainer}>
        <Animated.View style={[{ transform: [{ scale: driverScale }] }]}>
          <TouchableOpacity
            style={[styles.optionContainer, isLoading && styles.disabledOption]}
            onPress={handleDriverPress}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/steeringwheel.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>DRIVER</Text>
            {isLoading && <Text style={styles.loadingText}>Saving...</Text>}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[{ transform: [{ scale: pedestrianScale }] }]}>
          <TouchableOpacity
            style={[styles.optionContainer, isLoading && styles.disabledOption]}
            onPress={handlePedestrianPress}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icon/commuter.png')}
                style={styles.optionImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.optionLabel}>PEDESTRIAN</Text>
            {isLoading && <Text style={styles.loadingText}>Saving...</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {showDriverCategories && (
        <View style={styles.categoriesOverlay}>
          <View style={styles.categoriesPanel}>
            <Text style={styles.categoriesTitle}>SELECT CATEGORY</Text>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryButton}
                onPress={() => handleDriverCategorySelect(category)}
                disabled={isLoading}
              >
                <Text style={styles.categoryButtonText}>{category.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDriverCategories(false)}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
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
                    <Text style={styles.sectionTitle}>Some Basic Signs and Markings to Remember</Text>
                    
                    <Text style={styles.subsectionTitle}>Traffic Signs</Text>
                    <Text style={styles.referenceText}>
                      • Red Signal - means bring your vehicle to a stop at a marked line.{'\n\n'}
                      • Flashing Red - means bring your vehicle to a STOP and proceed only when it is safe.{'\n\n'}
                      • Yellow Signal - means the red signal is about to appear. Prepare to stop.{'\n\n'}
                      • Flashing Yellow - means slow down and proceed with caution.{'\n\n'}
                      • Green Signal - means you can proceed, yield if needed.{'\n\n'}
                      • Flashing Green - proceed with caution. yield for pedestrian.{'\n'}
                    </Text>
                    
                    <Text style={styles.subsectionTitle}>Road Markings</Text>
                    <Text style={styles.referenceText}>
                      • Solid White line - Crossing is discouraged and requires special care when doing so.{'\n\n'}
                      • Broken White line - Changing of lane is allowed provided with care.{'\n\n'}
                      • Double Solid Yellow line - No overtaking and No crossing{'\n\n'}
                      • Single Solid Yellow line - Crossing is allowed but no overtaking{'\n\n'}
                      • Broken Yellow line - Crossing and overtaking is allowed with necessary care.{'\n\n'}
                      • Edge Line - Used to separate the outside edge of the road from the shoulder.{'\n'}
                    </Text>
                  </View>
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
                    <Text style={styles.sectionTitle}>Basic Pedestrian Safety Tips</Text>
                    <Text style={styles.referenceText}>
                      • Follow the rules of the road and obey signs and signals{'\n\n'}
                      • Walk on sidewalks whenever possible. If there are no sidewalk, walk facing and as far from traffic as possible{'\n\n'}
                      • Cross streets at crosswalks.{'\n\n'}
                      • If a crosswalk is not available, walk at a well lit area where you have the best view of traffic. Wait for a gap in traffic that allows enough time to cross safely but continue to watch for traffic as you cross.{'\n\n'}
                      • Watch for cars entering or exiting driveways or backing up.{'\n\n'}
                      • When crossing the street, stay alert: <Text style={[styles.referenceText, { textDecorationLine: 'underline' }]}>check for signals, signs, and actions of drivers, cyclists, and pedestrians around you</Text>.{'\n\n'}
                      • Do not rely on others to keep you safe.{'\n'}
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
    left: 40,
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
    alignItems: 'center',
    zIndex: 3,
  },
  title: {
    fontSize: 60,
    fontWeight: 'normal',
    color: 'white',
    fontFamily: 'pixel',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'pixel',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 5,
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
  disabledOption: {
    opacity: 0.6,
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
  loadingText: {
    fontSize: 12,
    color: '#87CEEB',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginTop: 5,
  },

  backButtonImage: { width: 100, height: 30, resizeMode: 'contain', marginBottom:5 },

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
    fontSize: 9,
    color: 'black',
    fontFamily: 'spaceMono',
    lineHeight: 14,
    textAlign: 'justify',
  },
  libraryBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'black',
    fontFamily: "Pixel3",
    marginBottom: 10,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 10,
    color: 'black',
    fontFamily: "Pixel3",
    marginTop: 10,
    marginBottom: 5,
    textDecorationLine: 'underline',
  },
  categoriesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  categoriesPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 30,
    width: width * 0.8,
    maxWidth: 400,
    borderWidth: 3,
    borderColor: '#666',
  },
  categoriesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  categoryButton: {
    backgroundColor: 'rgba(135, 206, 235, 0.3)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#87CEEB',
  },
  categoryButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
});