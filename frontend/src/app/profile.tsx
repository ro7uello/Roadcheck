// profile.tsx - WITH CACHING
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, SafeAreaView, Alert, Modal, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CachedApiService from '../contexts/CachedApiService';
import { API_URL } from '../../config/api';

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const [userProgress, setUserProgress] = useState(null);
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
      loadAllData();
    }, []);

    const handleApiError = async (error, router) => {
      console.error('API Error:', error);
      if (error.message?.includes('401') || error.status === 401) {
        await AsyncStorage.multiRemove([
          'access_token',
          'refresh_token',
          'userId',
          'user_email'
        ]);
        Alert.alert(
          'Session Ended',
          'Your session was ended because you logged in on another device. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return true;
      }
      return false;
    };

    // ✅ Single unified loader
    const loadAllData = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) setLoading(true);

        const storedUserId = await AsyncStorage.getItem("userId");
        const userEmail = await AsyncStorage.getItem("user_email");
        const token = await AsyncStorage.getItem("access_token");

        console.log('📋 === PROFILE LOAD DEBUG ===');
        console.log('📋 Stored userId:', storedUserId);
        console.log('📋 Has token:', !!token);
        console.log('📋 Force refresh:', forceRefresh);

        if (!storedUserId || !token) {
          Alert.alert("Session Expired", "Please login again", [
            { text: "OK", onPress: () => router.replace("/login") }
          ]);
          return;
        }

        setUserId(storedUserId);
        const startTime = Date.now();

        // ✅ ENHANCED: Call with proper error handling
        const [profileResult, statsResult] = await Promise.all([
          CachedApiService.getProfile(storedUserId, forceRefresh).catch(err => {
            console.error('❌ Profile fetch error:', err);
            return { success: false, error: err.message };
          }),
          CachedApiService.getStats(storedUserId, forceRefresh).catch(err => {
            console.error('❌ Stats fetch error:', err);
            return { success: false, error: err.message };
          }),
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`⏱️ Profile data loaded in ${loadTime}ms`);

        // ✅ DEBUG: Log the raw results
        console.log('📊 Profile result:', JSON.stringify(profileResult, null, 2));
        console.log('📊 Stats result:', JSON.stringify(statsResult, null, 2));

        const isFromCache = profileResult.fromCache || statsResult.fromCache;
        setFromCache(isFromCache);
        console.log(isFromCache ? '📦 Data loaded from cache!' : '🌐 Data loaded from API');

        // ✅ PROFILE HANDLING
        if (profileResult.success && profileResult.data) {
          console.log('✅ Profile data received:', profileResult.data);
          setProfile({
            username: profileResult.data.username,
            email: userEmail || profileResult.data.email || "N/A"
          });
        } else {
          console.error('❌ Profile failed:', profileResult.error || 'Unknown error');
          Alert.alert("Error", "Unable to load profile");
        }

        // ✅ STATS HANDLING WITH DETAILED LOGGING
        if (statsResult.success && statsResult.data) {
          console.log('✅ Stats data received:', JSON.stringify(statsResult.data, null, 2));

          // Verify stats structure
          const statsKeys = Object.keys(statsResult.data);
          console.log('📊 Stats keys:', statsKeys);

          // Check each category
          statsKeys.forEach(key => {
            console.log(`📊 ${key}:`, statsResult.data[key]);
          });

          setStats(statsResult.data);
        } else {
          console.warn('⚠️ Stats failed, using defaults:', statsResult.error || 'Unknown error');
          const defaultStats = {
            highway_driving: { total_scenarios: 30, completed_scenarios: 0, correct_answers: 0 },
            traffic_signs: { total_scenarios: 30, completed_scenarios: 0, correct_answers: 0 },
            defensive_driving: { total_scenarios: 30, completed_scenarios: 0, correct_answers: 0 },
            pedestrian: { total_scenarios: 10, completed_scenarios: 0, correct_answers: 0 }
          };
          console.log('📊 Setting default stats:', defaultStats);
          setStats(defaultStats);
        }

        console.log('✅ === PROFILE LOAD COMPLETE ===');
      } catch (apiError) {
        console.error('❌ === PROFILE LOAD ERROR ===');
        console.error('Error type:', apiError.constructor.name);
        console.error('Error message:', apiError.message);
        console.error('Error stack:', apiError.stack);

        const wasHandled = await handleApiError(apiError, router);
        if (!wasHandled) {
          console.error("Error loading data:", apiError);
          Alert.alert("Error", "Failed to load profile data. Please try again.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    const onRefresh = async () => {
      setRefreshing(true);
      await loadAllData(true);
    };

  const calculateAccuracy = (categoryKey) => {
    if (!stats || !stats[categoryKey]) return 0;
    const { correct_answers } = stats[categoryKey];

    const totalScenarios = categoryKey === 'pedestrian' ? 10 : 30;

    return Math.round((correct_answers / totalScenarios) * 100);
  };

  const getStatusBadge = (accuracy) => {
    if (accuracy >= 80) return { text: "PASSED", color: "#4ade80" };
    if (accuracy >= 50) return { text: "NEEDS WORK", color: "#fbbf24" };
    return { text: "FAILED", color: "#ef4444" };
  };

  const calculateOverallProgress = () => {
    if (!stats) return 0;

    const roadMarkingsAcc = calculateAccuracy("highway_driving");
    const trafficSignsAcc = calculateAccuracy("traffic_signs");
    const intersectionAcc = calculateAccuracy("defensive_driving");
    const pedestrianAcc = calculateAccuracy("pedestrian");

    const avgAccuracy = (roadMarkingsAcc + trafficSignsAcc + intersectionAcc + pedestrianAcc) / 4;
    return Math.round(avgAccuracy);
  };

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

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);

      const token = await AsyncStorage.getItem('access_token');
      const storedUserId = await AsyncStorage.getItem('userId');

      if (!token || !storedUserId) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/user/delete-account/${storedUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cache before logout
        await CachedApiService.clearAllCache();

        await AsyncStorage.multiRemove([
          'access_token',
          'refresh_token',
          'userId',
          'user_email'
        ]);

        setShowDeleteModal(false);
        Alert.alert(
          'Account Deleted',
          'Your account has been permanently deleted.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

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
            <Text style={styles.modalTitle}>🎯 ROAD SAFETY STATUS</Text>
            <Text style={styles.modalSubtitle}>
              Your status updates based on all categories including Pedestrian!
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
          onPress={() => loadAllData(true)}
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
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={["#000"]}
            tintColor="#000"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>USERNAME:</Text>
            <Text style={styles.value}>{profile.username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>EMAIL:</Text>
            <Text style={[styles.value, styles.emailText]}>{profile.email}</Text>
          </View>

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

          <View style={styles.progressBarContainer}>
            <Text style={styles.progressLabel}>OVERALL PROGRESS: {overallProgress}%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
            </View>
            <Text style={styles.tierText}>Tier {currentStatus.tier}/10</Text>
          </View>
        </View>

        {/* Road Safety Progression */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ROAD SAFETY PROGRESSION:</Text>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>🛣️ HIGHWAY DRIVING:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("highway_driving")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("highway_driving"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>🚦 TRAFFIC SIGNS:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("traffic_signs")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("traffic_signs"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>🔄 DEFENSIVE DRIVING:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("defensive_driving")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("defensive_driving"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressRow}>
              <Text style={styles.categoryName}>🚶 PEDESTRIAN:</Text>
              <Text style={styles.accuracy}>{calculateAccuracy("pedestrian")}% ACCURACY</Text>
            </View>
            {(() => {
              const status = getStatusBadge(calculateAccuracy("pedestrian"));
              return <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>;
            })()}
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DETAILED STATS:</Text>

          {stats && Object.entries(stats)
            .sort(([keyA], [keyB]) => {
              const order = ['highway_driving', 'traffic_signs', 'defensive_driving', 'pedestrian'];
              return order.indexOf(keyA) - order.indexOf(keyB);
            })
            .map(([key, data]) => (
              <View key={key} style={styles.statRow}>
                <Text style={styles.statLabel}>
                  {key === 'pedestrian' ? 'PEDESTRIAN' : key.replace(/_/g, " ").toUpperCase()}:
                </Text>
                <Text style={styles.statValue}>
                  {data.correct_answers || 0}/{key === 'pedestrian' ? 10 : 30} correct
                </Text>
              </View>
            ))}
        </View>

        {/* Delete Account Section */}
        <View style={[styles.card, { borderColor: '#ef4444', backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>DANGER ZONE</Text>
          <Text style={styles.deleteWarningText}>
            Deleting your account is permanent and cannot be undone. All your progress and data will be lost.
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteButtonText}>DELETE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>⚠️ DELETE ACCOUNT</Text>

            <ScrollView
              style={styles.deleteModalScroll}
              contentContainerStyle={styles.deleteModalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.deleteModalText}>
                Are you sure you want to delete your account?
                {'\n\n'}
                This action is permanent and cannot be undone.
                {'\n\n'}
                You will lose:
                {'\n'}• All your progress
                {'\n'}• All your statistics
                {'\n'}• All your completed scenarios
                {'\n\n'}
                Your account cannot be retrieved once deleted.
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                >
                  <Text style={styles.confirmDeleteButtonText}>
                    {deleting ? 'DELETING...' : 'DELETE'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  },
  cacheIndicator: {
    position: 'absolute',
    top: 60,
    left: 100,
    backgroundColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#000',
  },
  cacheText: {
    fontSize: 10,
    fontFamily: 'pixel',
    color: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    paddingLeft: 100,
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
    maxWidth: '85%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingLeft: 100,
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
    fontFamily: 'spaceMono',
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
    fontFamily: 'spaceMono',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'spaceMono',
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
  deleteWarningText: {
    fontSize: 10,
    color: '#991b1b',
    fontFamily: 'pixel',
    marginBottom: 15,
    lineHeight: 16,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#991b1b',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#f5e6d3',
    borderRadius: 15,
    padding: 20,
    width: '95%',
    maxWidth: 550,
    maxHeight: '60%',
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  deleteModalTitle: {
    fontSize: 18,
    color: '#ef4444',
    fontFamily: 'pixel',
    textAlign: 'center',
    marginBottom: 15,
  },
  deleteModalScroll: {
    maxHeight: 250,
  },
  deleteModalScrollContent: {
    paddingVertical: 5,
  },
  deleteModalText: {
    fontSize: 11,
    color: '#000',
    fontFamily: 'pixel',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a5568',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#991b1b',
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
});