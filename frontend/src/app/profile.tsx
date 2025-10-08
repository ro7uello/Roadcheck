// profile.jsx
// profile.tsx (or wherever your profile screen is)
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

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      const storedUserId = await AsyncStorage.getItem("userId");
      const userData = await AsyncStorage.getItem("user_data");
      const userEmail = await AsyncStorage.getItem("user_email");

      console.log("Stored userId:", storedUserId);
      console.log("Stored user_data:", userData);
      console.log("Stored user_email:", userEmail);

      if (!storedUserId) {
        console.error("No user ID found - redirecting to login");
        Alert.alert("Session Expired", "Please login again", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
        return;
      }

      // Try to use the stored user_data first as fallback
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setProfile({
          full_name: parsedUserData.full_name || parsedUserData.email?.split('@')[0],
          email: parsedUserData.email,
          id: parsedUserData.id
        });
      }

      setUserId(storedUserId);

      // Then fetch from API
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

      if (profileData.success) {
        setProfile({...profileData.data, email: userEmail || profileData.data.email || "N/A"});
      }

      if (statsData.success) {
        setStats(statsData.data);
      }

    } catch (error) {
      console.error("Error loading profile:", error);
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button - NOW PROPERLY POSITIONED */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>NAME:</Text>
            <Text style={styles.value}>{profile?.full_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>EMAIL:</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>STATUS:</Text>
            <Text style={styles.statusBadge}>BEGINNER</Text>
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

          {stats && Object.entries(stats).map(([key, data]) => (
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
    top: 20,
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
    fontSize: 24,
    fontFamily: 'pixel',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    padding: 20,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#000',
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
  statusBadge: {
    fontSize: 16,
    color: '#4ade80',
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
  badgeContainer: {
    alignItems: 'flex-end',
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
});