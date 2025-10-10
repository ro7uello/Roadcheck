// profile.tsx - WITH DYNAMIC STATUS SYSTEM
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const API_URL = process.env.API_URL;

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      const storedUserId = await AsyncStorage.getItem("userId");
      const userEmail = await AsyncStorage.getItem("user_email");

      console.log("Stored userId:", storedUserId);
      console.log("Stored user_email:", userEmail);

      if (!storedUserId) {
        console.error("No user ID found - redirecting to login");
        Alert.alert("Session Expired", "Please login again", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
        return;
      }

      setUserId(storedUserId);

      // Fetch profile and stats from API
      const [profileRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/profiles/${storedUserId}`),
        fetch(`${API_URL}/user-stats/${storedUserId}`)
      ]);

      console.log("Profile response status:", profileRes.status);
      console.log("Stats response status:", statsRes.status);

      const profileData = await profileRes.json();
      const statsData = await statsRes.json();

      console.log("Profile data:", profileData);
      console.log("Stats data:", statsData);

      if (profileData.success && profileData.data) {
        setProfile({
          username: profileData.data.username,
          email: userEmail || profileData.data.email || "N/A"
        });
      } else {
        console.warn("Failed to fetch profile from API");
        Alert.alert("Error", "Unable to load profile");
      }

      if (statsData.success) {
        setStats(statsData.data);
      } else {
        console.warn("Failed to fetch stats:", statsData);
        // Set empty stats as fallback
        setStats({
          road_markings: { total_scenarios: 30, completed_scenarios: 0, correct_answers: 0 },
          traffic_signs: { total_scenarios: 30, completed_scenarios: 0, correct_answers: 0 },
          intersection_and_others: { total_scenarios: 30, completed_scenarios: 0, correct_answers: 0 }
        });
      }

    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAccuracy = (categoryKey) => {
    if (!stats || !stats[categoryKey]) return 0;
    const { correct_answers } = stats[categoryKey];
    // Calculate percentage out of 30
    return Math.round((correct_answers / 30) * 100);
  };

  const getStatusBadge = (accuracy) => {
    if (accuracy >= 80) return { text: "PASSED", color: "#4ade80" };
    if (accuracy >= 50) return { text: "NEEDS WORK", color: "#fbbf24" };
    return { text: "FAILED", color: "#ef4444" };
  };

  // NEW: Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!stats) return 0;

    const roadMarkingsAcc = calculateAccuracy("road_markings");
    const trafficSignsAcc = calculateAccuracy("traffic_signs");
    const intersectionAcc = calculateAccuracy("intersection_and_others");

    const avgAccuracy = (roadMarkingsAcc + trafficSignsAcc + intersectionAcc) / 3;
    return Math.round(avgAccuracy);
  };

  // NEW: Get dynamic driver status based on progress
  const getDriverStatus = () => {
    const progress = calculateOverallProgress();

    if (progress >= 90) return { title: "Licensed Pro", icon: "👑", tier: 10 };
    if (progress >= 80) return { title: "Road Master", icon: "🏆", tier: 9 };
    if (progress >= 70) return { title: "Advanced Driver", icon: "⭐", tier: 8 };
    if (progress >= 60) return { title: "Skilled Driver", icon: "🎯", tier: 7 };
    if (progress >= 50) return { title: "Confident Driver", icon: "🏁", tier: 6 };
    if (progress >= 40) return { title: "Cautious Driver", icon: "🚗", tier: 5 };
    if (progress >= 30) return { title: "Sign Reader", icon: "🚸", tier: 4 };
    if (progress >= 20) return { title: "Road Learner", icon: "🛣️", tier: 3 };
    if (progress >= 10) return { title: "Student Driver", icon: "🚦", tier: 2 };
    return { title: "Learner's Permit", icon: "🚗", tier: 1 };
  };

  // NEW: Status info modal content
  const StatusInfoModal = () => {
    const statusRanks = [
      { range: "0-10%", title: "Learner's Permit", icon: "🚗" },
      { range: "10-20%", title: "Student Driver", icon: "🚦" },
      { range: "20-30%", title: "Road Learner", icon: "🛣️" },
      { range: "30-40%", title: "Sign Reader", icon: "🚸" },
      { range: "40-50%", title: "Cautious Driver", icon: "🚗" },
      { range: "50-60%", title: "Confident Driver", icon: "🏁" },
      { range: "60-70%", title: "Skilled Driver", icon: "🎯" },
      { range: "70-80%", title: "Advanced Driver", icon: "⭐" },
      { range: "80-90%", title: "Road Master", icon: "🏆" },
      { range: "90-100%", title: "Licensed Pro", icon: "👑" },
    ];

    return (
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎯 DRIVER STATUS RANKS</Text>
            <Text style={styles.modalSubtitle}>
              Your status updates automatically as you complete scenarios!
            </Text>

            <ScrollView style={styles.modalScroll}>
              {statusRanks.map((rank, index) => (
                <View key={index} style={styles.rankItem}>
                  <Text style={styles.rankIcon}>{rank.icon}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankTitle}>{rank.title}</Text>
                    <Text style={styles.rankRange}>{rank.range}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.modalFooter}>
              Complete more scenarios to rank up! 🚀
            </Text>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <Text style={styles.errorText}>Unable to load profile</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadProfileData}
        >
          <Text style={styles.retryButtonText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = getDriverStatus();
  const overallProgress = calculateOverallProgress();

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
        </View>

        {/* User Info Card - WITH DYNAMIC STATUS */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>USERNAME:</Text>
            <Text style={styles.value}>{profile.username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>EMAIL:</Text>
            <Text style={[styles.value, styles.emailText]}>{profile.email}</Text>
          </View>

          {/* NEW: Dynamic Status with Icon and Info Button */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>STATUS:</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusIcon}>{currentStatus.icon}</Text>
              <Text style={styles.statusBadgeDynamic}>{currentStatus.title}</Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={styles.infoButtonText}>!</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NEW: Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>OVERALL PROGRESS: {overallProgress}%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
            </View>
            <Text style={styles.tierText}>Tier {currentStatus.tier}/10</Text>
          </View>
        </View>

        {/* Driver Progression */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DRIVER PROGRESSION:</Text>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>ROAD MARKINGS:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("road_markings")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("road_markings"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>TRAFFIC SIGNS:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("traffic_signs")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("traffic_signs"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>INTERSECTION & OTHERS:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("intersection_and_others")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("intersection_and_others"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DETAILED STATS:</Text>

          {stats && Object.entries(stats)
            .sort(([keyA], [keyB]) => {
              const order = ['road_markings', 'traffic_signs', 'intersection_and_others'];
              return order.indexOf(keyA) - order.indexOf(keyB);
            })
            .map(([key, data]) => (
              <View key={key} style={styles.statRow}>
                <Text style={styles.statLabel}>
                  {key.replace(/_/g, " ").toUpperCase()}:
                </Text>
                <Text style={styles.statValue}>
                  {data.correct_answers || 0}/30 correct
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>

      {/* Status Info Modal */}
      <StatusInfoModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 50,
    textAlign: 'center',
    includeFontPadding: false,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    paddingLeft: 100, // Move content away from camera
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#000',
    fontFamily: 'pixel',
    backgroundColor: '#f4d03f',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  card: {
    backgroundColor: '#f5e6d3',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#000',
    maxWidth: '85%', // Smaller container
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'pixel',
    marginRight: 10,
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'pixel',
  },
  emailText: {
    fontSize: 12,
  },
  // NEW: Status container with icon and info button
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusBadgeDynamic: {
    fontSize: 16,
    color: '#4ade80',
    fontFamily: 'pixel',
    marginRight: 8,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'pixel',
  },
  // NEW: Progress bar styles
  progressBarContainer: {
    marginTop: 15,
  },
  progressLabel: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'pixel',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 20,
    backgroundColor: '#d1d5db',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ade80',
  },
  tierText: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'pixel',
    marginTop: 4,
    textAlign: 'right',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingLeft: 100, // Avoid camera notch
    paddingTop: 0,
    paddingBottom: 0,
  },
  modalContent: {
    backgroundColor: '#f5e6d3',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    borderWidth: 3,
    borderColor: '#000',
  },
  modalTitle: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  modalSubtitle: {
    fontSize: 10,
    color: '#4a5568',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 14,
    paddingHorizontal: 10,
  },
  modalScroll: {
    maxHeight: 320,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#000',
  },
  rankIcon: {
    fontSize: 18,
    marginRight: 8,
    width: 24,
    textAlign: 'center',
  },
  rankInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankTitle: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'pixel',
    flex: 1,
  },
  rankRange: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'pixel',
    marginLeft: 8,
  },
  modalFooter: {
    fontSize: 10,
    color: '#4a5568',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  modalCloseButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'pixel',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'pixel',
    marginBottom: 15,
  },
  progressItem: {
    backgroundColor: '#4a5568',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'pixel',
  },
  accuracy: {
    fontSize: 12,
    color: '#cbd5e0',
    fontFamily: 'pixel',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'pixel',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'pixel',
  },
  statValue: {
    fontSize: 12,
    color: '#4a5568',
    fontFamily: 'pixel',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#000',
    fontFamily: 'pixel',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'pixel',
  },
});