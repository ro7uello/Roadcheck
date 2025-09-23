// src/app/optionPage.tsx
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ImageBackground, SafeAreaView, Animated, Image, Alert, } from 'react-native';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

// Backend API configuration
const API_BASE_URL = process.env.API_URL;

export default function OptionPage() {
  const [fontsLoaded] = useFonts({
    'pixel': require('../../assets/fonts/pixel3.ttf'),
  });
  
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const driverScale = useRef(new Animated.Value(1)).current;
  const pedestrianScale = useRef(new Animated.Value(1)).current;

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

  // Save user progress to backend
  const saveUserProgress = async (selectedMode) => {
    console.log('=== saveUserProgress called ===');
    console.log('selectedMode:', selectedMode);
    console.log('API_BASE_URL:', API_BASE_URL);

    try {
      setIsLoading(true);
      console.log('Loading state set to true');

      const token = await AsyncStorage.getItem('access_token');
      console.log('Token from storage:', token ? 'exists' : 'null');

      if (!token) {
        console.log('No token found, proceeding without saving');
        return true;
      }

      // Get or generate user ID
      let userId = await AsyncStorage.getItem('user_id');
      console.log('User ID from storage:', userId);

      if (!userId) {
        userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('user_id', userId);
        console.log('Generated new user ID:', userId);
      }

      console.log('About to make API call to:', `${API_BASE_URL}/user-progress`);
      console.log('Request body:', {
        user_id: userId,
        current_category_id: 1,
        current_phase: 1,
        current_scenario_index: 0
      });

      // Call your backend's PUT /user-progress endpoint
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
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Progress saved successfully:', result);
      } else {
        const errorText = await response.text();
        console.log('Failed to save progress:', response.status, errorText);
      }

      // Store locally as backup
      await AsyncStorage.setItem('selectedMode', selectedMode);
      await AsyncStorage.setItem('lastProgress', JSON.stringify({
        action: 'mode_selection',
        selectedMode,
        timestamp: new Date().toISOString()
      }));

      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      console.log('Full error details:', error.message, error.stack);
      await AsyncStorage.setItem('selectedMode', selectedMode);
      return true;
    } finally {
      console.log('Setting loading to false');
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
      console.log('Animation finished, calling saveUserProgress...');
      const success = await saveUserProgress('driver');
      console.log('saveUserProgress result:', success);
      if (success) {
          console.log('Navigating to categorySelectionScreen...');
        router.push('/categorySelectionScreen'); // Navigate to category selection
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
    ]).start(async () => {
      const success = await saveUserProgress('pedestrian');
      if (success) {
        router.push('/categorySelectionScreen'); // Navigate to category selection
      }
    });
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleLibraryPress = () => {
    router.push('/library');
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
            source={require('../../assets/background/city-background.png')}
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
          source={require('../../assets/car/blue-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

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

      <View style={styles.titleContainer}>
        <Text style={styles.title}>CHOOSE</Text>
        {userProfile && (
          <Text style={styles.welcomeText}>Welcome, {userProfile.name}!</Text>
        )}
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
    alignItems: 'center',
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
});