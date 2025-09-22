// profile.jsx
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
} from "react-native";

const { width, height } = Dimensions.get("window");
const BACKGROUND_SPEED = 12000;

// TypeScript interfaces
interface CategoryStats {
  total_scenarios: number;
  completed_scenarios: number;
  total_attempts: number;
  correct_answers: number;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface UserProgress {
  user_id: string;
  current_phase: number;
  current_category_id: number;
  current_scenario_index: number;
  completed_scenarios: number;
  phase_scores: number[];
  total_score: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgAnim = useRef(new Animated.Value(0)).current;
  const carAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.loop(
      Animated.timing(bgAnim, { toValue: 1, duration: BACKGROUND_SPEED, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(carAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Fetch profile data from backend
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = 1; // Replace with actual user ID from authentication
      
      // Fetch profile information
      const profileResponse = await fetch(`http://your-backend-url/profiles/${userId}`);
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        setProfile(profileData.data);
        console.log('Profile data:', profileData.data);
      } else {
        throw new Error(profileData.message || 'Failed to fetch profile');
      }

      // Fetch user progress
      const progressResponse = await fetch(`http://your-backend-url/user-progress/${userId}`);
      const progressData = await progressResponse.json();
      
      if (progressData.success) {
        setUserProgress(progressData.data);
        console.log('User progress:', progressData.data);
      } else {
        console.warn('Failed to fetch progress:', progressData.message);
      }

      // Fetch category statistics
      const statsResponse = await fetch(`http://your-backend-url/user-stats/${userId}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setCategoryStats(statsData.data);
        console.log('Category stats:', statsData.data);
      } else {
        console.warn('Failed to fetch stats:', statsData.message);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError(error.message);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage for each category
  const calculateCategoryProgress = (categoryName: string): number => {
    const stats = categoryStats[categoryName];
    if (!stats || !stats.total_scenarios || stats.total_scenarios === 0) return 0;
    
    return Math.round((stats.completed_scenarios / stats.total_scenarios) * 100);
  };

  // Calculate accuracy percentage for each category
  const calculateCategoryAccuracy = (categoryName: string): number => {
    const stats = categoryStats[categoryName];
    if (!stats || !stats.total_attempts || stats.total_attempts === 0) return 0;
    
    return Math.round((stats.correct_answers / stats.total_attempts) * 100);
  };

  // Get overall driver status
  const getDriverStatus = (): string => {
    const categories = ['road_markings', 'road_signs', 'intersections', 'others'];
    const passed = categories.filter(cat => calculateCategoryAccuracy(cat) >= 70).length;
    const total = categories.length;
    
    if (passed === total) return 'LICENSED DRIVER';
    if (passed >= total / 2) return 'LEARNER';
    return 'BEGINNER';
  };

  const bgTranslate = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const carBounce = carAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.movingBackground}>
        <Animated.View style={[styles.bgWrapper, { transform: [{ translateX: bgTranslate }] }]}>
          <ImageBackground
            source={require("../../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="stretch"
          />
        </Animated.View>
        <Animated.View
          style={[styles.bgWrapper, { transform: [{ translateX: Animated.add(bgTranslate, width) }] }]}
        >
          <ImageBackground
            source={require("../../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="stretch"
          />
        </Animated.View>
      </View>

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carBounce }] }]}>
        <Image source={require("../../assets/car/blue-car.png")} style={styles.car} resizeMode="contain" />
      </Animated.View>

      {/* Profile Box */}
      <View style={styles.box}>
        <Text style={styles.title}>PROFILE</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#333" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : profile ? (
          <>
            {/* Basic Information */}
            <Text style={styles.label}>
              NAME: <Text style={styles.value}>{profile.full_name || 'Not set'}</Text>
            </Text>
            
            {/* Driver Status */}
            <Text style={styles.label}>
              STATUS: <Text style={[styles.value, styles.statusText]}>{getDriverStatus()}</Text>
            </Text>

            {/* Current Progress */}
            {userProgress && (
              <View style={styles.currentProgressBox}>
                <Text style={styles.sectionTitle}>CURRENT PROGRESS:</Text>
                <Text style={styles.progressDetail}>
                  Phase: {userProgress.current_phase || 'Not started'}
                </Text>
                <Text style={styles.progressDetail}>
                  Scenario: {userProgress.current_scenario_index || 1}
                </Text>
                <Text style={styles.progressDetail}>
                  Total Score: {userProgress.total_score || 0}
                </Text>
              </View>
            )}

            {/* Category Performance */}
            <Text style={[styles.label, { marginTop: 15 }]}>CATEGORY PERFORMANCE:</Text>
            <View style={styles.progressBox}>
              <View style={styles.categoryRow}>
                <Text style={styles.progress}>
                  ROAD MARKINGS: {calculateCategoryAccuracy('road_markings')}% accuracy
                </Text>
                <Text style={[styles.status, calculateCategoryAccuracy('road_markings') >= 70 ? styles.passed : styles.failed]}>
                  {calculateCategoryAccuracy('road_markings') >= 70 ? "PASSED" : "NEEDS WORK"}
                </Text>
              </View>
              
              <View style={styles.categoryRow}>
                <Text style={styles.progress}>
                  ROAD SIGNS: {calculateCategoryAccuracy('road_signs')}% accuracy
                </Text>
                <Text style={[styles.status, calculateCategoryAccuracy('road_signs') >= 70 ? styles.passed : styles.failed]}>
                  {calculateCategoryAccuracy('road_signs') >= 70 ? "PASSED" : "NEEDS WORK"}
                </Text>
              </View>
              
              <View style={styles.categoryRow}>
                <Text style={styles.progress}>
                  INTERSECTIONS: {calculateCategoryAccuracy('intersections')}% accuracy
                </Text>
                <Text style={[styles.status, calculateCategoryAccuracy('intersections') >= 70 ? styles.passed : styles.failed]}>
                  {calculateCategoryAccuracy('intersections') >= 70 ? "PASSED" : "NEEDS WORK"}
                </Text>
              </View>
              
              <View style={styles.categoryRow}>
                <Text style={styles.progress}>
                  OTHERS: {calculateCategoryAccuracy('others')}% accuracy
                </Text>
                <Text style={[styles.status, calculateCategoryAccuracy('others') >= 70 ? styles.passed : styles.failed]}>
                  {calculateCategoryAccuracy('others') >= 70 ? "PASSED" : "NEEDS WORK"}
                </Text>
              </View>
            </View>

            {/* Detailed Statistics */}
            <View style={styles.statsBox}>
              <Text style={styles.sectionTitle}>DETAILED STATS:</Text>
              {Object.entries(categoryStats).map(([category, stats]) => {
                const safeStats = stats || {};
                const completedScenarios = safeStats.completed_scenarios || 0;
                const totalScenarios = safeStats.total_scenarios || 0;
                const correctAnswers = safeStats.correct_answers || 0;
                const totalAttempts = safeStats.total_attempts || 0;
                
                return (
                  <View key={category} style={styles.statRow}>
                    <Text style={styles.statLabel}>{category.replace('_', ' ').toUpperCase()}:</Text>
                    <Text style={styles.statValue}>
                      {`${completedScenarios}/${totalScenarios} scenarios`}
                    </Text>
                    <Text style={styles.statValue}>
                      {`${correctAnswers}/${totalAttempts} correct`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.label}>No profile data available</Text>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  movingBackground: { ...StyleSheet.absoluteFillObject },
  bgWrapper: { position: "absolute", width, height },
  bgImage: { flex: 1, width: "105%", height: "105%" },
  carContainer: { position: "absolute", bottom: 5, left: width * 0.05 },
  car: { width: 250, height: 150 },

  box: {
    position: "absolute",
    top: height * 0.05,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: height * 0.85,
  },
  title: { 
    fontSize: 20, 
    color: "black", 
    fontFamily: "pixel", 
    textAlign: "center", 
    marginBottom: 15,
    fontWeight: 'bold'
  },
  label: { 
    fontSize: 12, 
    color: "black", 
    fontFamily: "pixel", 
    marginBottom: 5 
  },
  value: { 
    fontWeight: "bold", 
    color: "#2c3e50" 
  },
  statusText: {
    color: "#27ae60",
    fontSize: 13,
  },

  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "pixel",
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 12,
    color: "red",
    fontFamily: "pixel",
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontFamily: "pixel",
    fontSize: 12,
  },

  // Progress Sections
  sectionTitle: {
    fontSize: 12,
    color: "black",
    fontFamily: "pixel",
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentProgressBox: { 
    marginTop: 10, 
    backgroundColor: "#ecf0f1", 
    padding: 10, 
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  progressDetail: {
    fontSize: 11,
    color: "#2c3e50",
    fontFamily: "pixel",
    marginBottom: 3,
  },
  progressBox: { 
    marginTop: 10, 
    backgroundColor: "#2c3e50", 
    padding: 12, 
    borderRadius: 6 
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progress: { 
    fontSize: 11, 
    color: "white", 
    fontFamily: "pixel",
    flex: 1,
  },
  status: {
    fontSize: 10,
    fontFamily: "pixel",
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  passed: {
    backgroundColor: "#27ae60",
    color: "white",
  },
  failed: {
    backgroundColor: "#e74c3c",
    color: "white",
  },

  // Detailed Stats
  statsBox: {
    marginTop: 15,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#2c3e50",
    fontFamily: "pixel",
    flex: 1,
  },
  statValue: {
    fontSize: 10,
    color: "#7f8c8d",
    fontFamily: "pixel",
    marginLeft: 5,
  },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#e74c3c",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { 
    color: "white", 
    fontWeight: "bold", 
    fontSize: 16 
  },
});