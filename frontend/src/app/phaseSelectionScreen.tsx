// src/app/phaseSelectionScreen.tsx
import { useFonts } from 'expo-font';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL as API_BASE_URL } from '../../config/api';
const { width, height } = Dimensions.get('window');
const BACKGROUND_SPEED = 12000;

interface Phase {
  id: number;
  name: string;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
}

export default function PhaseSelectionScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();

  const [fontsLoaded] = useFonts({
    pixel: require('../../assets/fonts/pixel3.ttf'),
  });

  // Database state
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation refs
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const carBounce = useRef(new Animated.Value(0)).current;
  const phaseScales = useRef<Animated.Value[]>([]).current;

  // Initialize animation values for phases
  useEffect(() => {
    if (phases.length > 0 && phaseScales.length !== phases.length) {
      phaseScales.length = 0; // Clear existing
      for (let i = 0; i < phases.length; i++) {
        phaseScales.push(new Animated.Value(1));
      }
    }
  }, [phases]);

  // Fetch phases for the selected category
  useEffect(() => {
    const fetchPhases = async () => {
      if (!categoryId) {
        setError('No category selected');
        setLoading(false);
        return;
      }

      try {
        console.log('=== PHASE FETCH DEBUG ===');
        console.log('categoryId:', categoryId);
        console.log('API_BASE_URL:', API_BASE_URL);

        const url = `${API_BASE_URL}/phases/category/${categoryId}`;
        console.log('Fetching from URL:', url);

        setLoading(true);

        const response = await fetch(url);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Phases response:', data);

        if (data.success) {
          setPhases(data.data);
          console.log('Phases set successfully:', data.data);
        } else {
          setError(data.message || 'Failed to fetch phases');
          console.log('Backend returned error:', data.message);
        }
      } catch (error) {
        console.error('Error fetching phases:', error);
        console.error('Error details:', error.message);
        setError('Failed to connect to server: ' + error.message);
      } finally {
        setLoading(false);
        console.log('=== PHASE FETCH END ===');
      }
    };

    const getPhaseIcon = (phaseId: number, categoryId: string) => {
        let phaseNumber = 1;

        // Same mapping logic as your navigation function
        if (categoryId === '1') {
          phaseNumber = phaseId; // Road Markings: direct mapping
        } else if (categoryId === '2') {
          phaseNumber = phaseId - 3; // Traffic Signs: 4,5,6 → 1,2,3
        } else if (categoryId === '3') {
          phaseNumber = phaseId - 6; // Intersection: 7,8,9 → 1,2,3
        }

        // Return the appropriate icon based on phase number
        switch (phaseNumber) {
          case 1:
            return require('../../assets/icon/1.png');
          case 2:
            return require('../../assets/icon/2.png');
          case 3:
            return require('../../assets/icon/3.png');
          default:
            return require('../../assets/icon/1.png');
        }
      };

    fetchPhases();
  }, [categoryId]);

  // Update user progress when phase is selected
  const updateUserProgress = async (phaseId, phaseName) => {
    try {
      console.log('=== PROGRESS UPDATE DEBUG ===');

      // Get user ID from storage (same way as optionPage)
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log('No user ID found in storage');
        return;
      }

      const progressData = {
        user_id: userId,
        current_category_id: parseInt(categoryId),
        current_phase: phaseId,
        current_scenario_index: 0 // Start at beginning of phase
      };

      console.log('Updating user progress:', progressData);
      console.log('API URL:', `${API_BASE_URL}/user-progress`);

      const response = await fetch(`${API_BASE_URL}/user-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      console.log('Progress response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Progress update error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Progress update result:', result);

      if (result.success) {
        console.log('User progress updated successfully');
      } else {
        console.warn('Failed to update progress:', result.message);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
      console.error('Progress update error details:', error.message);
    }
  };

  const navigateToScenario = (categoryName: string, phaseId: number) => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('categoryName:', categoryName);
    console.log('phaseId:', phaseId);
    console.log('categoryId:', categoryId);

    // Map category ID to proper slug (matching your file structure)
    const categorySlugMap: { [key: string]: string } = {
      '1': 'road-markings',
      '2': 'traffic-signs',
      '3': 'intersection'
    };

    let phaseNumber = 1; // Default

    if (categoryId === '1') {
      // Road Markings - direct mapping (phase ID 1 = phase1, etc.)
      phaseNumber = phaseId;
    } else if (categoryId === '2') {
      // Traffic Signs - phase IDs are 4,5,6 so map to 1,2,3
      phaseNumber = phaseId - 3;
    } else if (categoryId === '3') {
      // Intersection - phase IDs are 7,8,9 so map to 1,2,3
      phaseNumber = phaseId - 6;
    }

    // Ensure phase number is valid (1, 2, or 3)
    if (phaseNumber < 1 || phaseNumber > 3) {
      console.warn('Invalid phase number calculated:', phaseNumber, 'defaulting to 1');
      phaseNumber = 1; // Fallback to phase 1
    }

    const categorySlug = categorySlugMap[categoryId as string];

    console.log('categorySlug:', categorySlug);
    console.log('phaseNumber:', phaseNumber);

    if (!categorySlug || phaseNumber < 1) {
      console.error('Invalid mapping:', { categoryId, phaseId, categorySlug, phaseNumber });
      Alert.alert('Error', `Invalid route mapping for category ${categoryId}, phase ${phaseId}`);
      return;
    }

    // Build route matching your file structure: /scenarios/road-markings/phase1/S1P1
    const route = `/scenarios/${categorySlug}/phase${phaseNumber}/S1P${phaseNumber}`;

    console.log('Final route:', route);
    console.log('=== NAVIGATION END ===');

    router.push(route);
  };

  useEffect(() => {
    if (fontsLoaded && !loading) {
      startBackgroundAnimation();
      startCarAnimation();
    }
    return () => {
      backgroundAnimation.stopAnimation();
      carBounce.stopAnimation();
      phaseScales.forEach(scale => scale.stopAnimation());
    };
  }, [fontsLoaded, loading]);

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

  // Handle phase selection
  const handlePhasePress = async (phase: Phase, index: number) => {
    if (index >= phaseScales.length) return;

    const scaleRef = phaseScales[index];
    
    Animated.sequence([
      Animated.timing(scaleRef, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleRef, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(async () => {
      // Update user progress
      await updateUserProgress(phase.id, phase.name);
      
      // Navigate to appropriate scenario
      navigateToScenario(categoryName as string, phase.id);
    });
  };

  if (!fontsLoaded) return null;

  const backgroundTranslate = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(width - 2)],
  });

  const carVerticalBounce = carBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading phases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View
          style={[styles.backgroundWrapper, { transform: [{ translateX: backgroundTranslate }] }]}
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
            { transform: [{ translateX: Animated.add(backgroundTranslate, width - 2) }] },
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

      {/* Overlay */}
      <View style={styles.skyOverlay} />

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carVerticalBounce }] }]}>
        <Image source={require('../../assets/car/blue-car.png')} style={styles.carImage} resizeMode="contain" />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Image
          source={require('../../assets/icon/backButton.png')}
          style={styles.backButtonImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{categoryName?.toUpperCase()}</Text>
      </View>

      {/* Phase Options */}
      <View style={styles.selectionContainer}>
      {phases.map((phase, index) => {
        // Calculate phase number inline
        let phaseNumber = 1;
        if (categoryId === '1') {
          phaseNumber = phase.id; // Road Markings: direct mapping
        } else if (categoryId === '2') {
          phaseNumber = phase.id - 3; // Traffic Signs: 4,5,6 → 1,2,3
        } else if (categoryId === '3') {
          phaseNumber = phase.id - 6; // Intersection: 7,8,9 → 1,2,3
        }

        // Determine which icon to use
        let iconSource;
        switch (phaseNumber) {
          case 1:
            iconSource = require('../../assets/icon/1.png');
            break;
          case 2:
            iconSource = require('../../assets/icon/2.png');
            break;
          case 3:
            iconSource = require('../../assets/icon/3.png');
            break;
          default:
            iconSource = require('../../assets/icon/1.png');
        }

        return (
          <Animated.View
            key={phase.id}
            style={{ transform: [{ scale: phaseScales[index] || new Animated.Value(1) }] }}
          >
            <TouchableOpacity
              style={styles.optionContainer}
              onPress={() => handlePhasePress(phase, index)}
              activeOpacity={0.8}
            >
              <Image
                source={iconSource}
                style={styles.optionImage}
                resizeMode="contain"
              />
              <Text style={styles.optionLabel}>{phase.name.toUpperCase()}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
      </View>

      {/* No phases message */}
      {phases.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No phases available for this category</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  backgroundWrapper: { position: 'absolute', width: width + 2, height, top: 0, left: 0, overflow: 'hidden' },
  backgroundImage: { width: '102%', height: '102%' },
  backgroundImageStyle: { width: '100%', height: '100%', transform: [{ scale: 1.3 }] },
  skyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0)', zIndex: 0 },
  carContainer: { position: 'absolute', bottom: -25, left: width * 0.05, zIndex: 2 },
  carImage: { width: 400, height: 210},

  // Back button
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
  backButtonImage: { width: 100, height: 30, resizeMode: 'contain', marginBottom:5 },

  // Title
  titleContainer: { marginTop: height * 0.08, alignItems: 'center' },
  title: {
    fontSize: 36,
    fontFamily: 'pixel',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 3,
  },

  // Selection
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
  optionLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    bottom: -5,
  },
  optionImage: {
    width: 150,
    height: 150,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontFamily: 'pixel',
    fontSize: 18,
    marginTop: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontFamily: 'pixel',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: '#666',
  },
  retryButtonText: {
    color: 'white',
    fontFamily: 'pixel',
    fontSize: 14,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Empty state
  emptyContainer: {
    position: 'absolute',
    top: height * 0.5,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontFamily: 'pixel',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});