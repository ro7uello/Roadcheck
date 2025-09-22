import { useFonts } from 'expo-font';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';

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
        console.log('Fetching phases for category:', categoryId);
        setLoading(true);
        
        const response = await fetch(`http://your-backend-url/phases/category/${categoryId}`);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Phases response:', data);
        
        if (data.success) {
          setPhases(data.data);
        } else {
          setError(data.message || 'Failed to fetch phases');
        }
      } catch (error) {
        console.error('Error fetching phases:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPhases();
  }, [categoryId]);

  // Update user progress when phase is selected
  const updateUserProgress = async (phaseId: number, phaseName: string) => {
    try {
      const progressData = {
        user_id: 1, // Replace with actual user ID from auth
        current_category_id: parseInt(categoryId as string),
        current_phase: phaseId,
        current_scenario_index: 1, // Start with first scenario
        updated_at: new Date().toISOString()
      };

      console.log('Updating user progress:', progressData);
      
      const response = await fetch('http://your-backend-url/user-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      const result = await response.json();
      console.log('Progress update result:', result);
      
      if (result.success) {
        console.log('User progress updated successfully');
      } else {
        console.warn('Failed to update progress:', result.message);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };

  // Route to appropriate scenario based on category and phase
  const navigateToScenario = (categoryName: string, phaseId: number) => {
    const categoryLower = categoryName.toLowerCase();
    
    // Map category names to route patterns
    const routeMapping: { [key: string]: string } = {
      'road signs': '/driver-game/signs',
      'road markings': '/driver-game/markings', 
      'intersections': '/driver-game/intersections',
      'others': '/driver-game/others'
    };

    const baseRoute = routeMapping[categoryLower];
    
    if (baseRoute) {
      // Navigate to the phase-specific route
      const route = `${baseRoute}/phase-${phaseId}`;
      console.log('Navigating to:', route);
      router.push(route);
    } else {
      Alert.alert('Error', `Route not found for category: ${categoryName}`);
    }
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
    outputRange: [0, -width],
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
            { transform: [{ translateX: Animated.add(backgroundTranslate, width) }] },
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
        <Text style={styles.subtitle}>SELECT PHASE</Text>
      </View>

      {/* Phase Options */}
      <View style={styles.selectionContainer}>
        {phases.map((phase, index) => (
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
                source={require('../../assets/icon/1.png')} // You can customize icons per phase
                style={styles.optionImage} 
                resizeMode="contain" 
              />
              <Text style={styles.optionLabel}>{phase.name.toUpperCase()}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
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
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backgroundWrapper: { position: 'absolute', width, height },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  backgroundImageStyle: { width: '100%', height: '100%', transform: [{ scale: 1.3 }] },
  skyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0)', zIndex: 0 },
  carContainer: { position: 'absolute', bottom: height * 0.05, left: width * 0.05, zIndex: 2 },
  carImage: { width: 200, height: 200, bottom: -50 },

  // Back button
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
  backButtonImage: { width: 30, height: 30 },

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
  subtitle: {
    fontSize: 24,
    fontFamily: 'pixel',
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginTop: 10,
  },

  // Selection
  selectionContainer: {
    position: 'absolute',
    top: height * 0.3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    width: 180,
    height: 180,
    justifyContent: 'center',
    margin: 10,
  },
  optionImage: { width: 120, height: 120 },
  optionLabel: {
    fontSize: 11,
    color: 'white',
    fontFamily: 'pixel',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 5,
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