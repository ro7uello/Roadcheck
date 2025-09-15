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
} from "react-native";
import { supabase } from "./lib/supabaseClient";

const { width, height } = Dimensions.get("window");
const BACKGROUND_SPEED = 12000;

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  const bgAnim = useRef(new Animated.Value(0)).current;
  const carAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(bgAnim, { toValue: 1, duration: BACKGROUND_SPEED, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(carAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // ✅ Fetch profile data from Supabase
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles") // replace with your table name
        .select("name, email, road_markings, road_signs, intersections")
        .single();

      if (!error) setProfile(data);
    };

    fetchProfile();
  }, []);

  const bgTranslate = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const carBounce = carAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.movingBackground}>
        <Animated.View style={[styles.bgWrapper, { transform: [{ translateX: bgTranslate }] }]}>
          <ImageBackground
            source={require("../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="stretch"
          />
        </Animated.View>
        <Animated.View
          style={[styles.bgWrapper, { transform: [{ translateX: Animated.add(bgTranslate, width) }] }]}
        >
          <ImageBackground
            source={require("../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="stretch"
          />
        </Animated.View>
      </View>

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carBounce }] }]}>
        <Image source={require("../assets/car/blue-car.png")} style={styles.car} resizeMode="contain" />
      </Animated.View>

      {/* Profile Box */}
      <View style={styles.box}>
        <Text style={styles.title}>PROFILE</Text>

        {profile ? (
          <>
            <Text style={styles.label}>NAME: <Text style={styles.value}>{profile.name}</Text></Text>
            <Text style={styles.label}>EMAIL: <Text style={styles.value}>{profile.email}</Text></Text>

            <Text style={[styles.label, { marginTop: 10 }]}>DRIVER PROGRESSION:</Text>
            <View style={styles.progressBox}>
              <Text style={styles.progress}>
                ROAD MARKINGS: {profile.road_markings}% · {profile.road_markings >= 70 ? "PASSED" : "FAILED"}
              </Text>
              <Text style={styles.progress}>
                ROAD SIGNS: {profile.road_signs}% · {profile.road_signs >= 70 ? "PASSED" : "FAILED"}
              </Text>
              <Text style={styles.progress}>
                INTERSECTIONS: {profile.intersections}% · {profile.intersections >= 70 ? "PASSED" : "FAILED"}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.label}>Loading...</Text>
        )}

              <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>X</Text>
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
    top: height * 0.1,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  title: { fontSize: 20, color: "black", fontFamily: "pixel", textAlign: "center", marginBottom: 10 },
  label: { fontSize: 12, color: "black", fontFamily: "pixel", marginBottom: 5 },
  value: { fontWeight: "bold", color: "black" },
  progressBox: { marginTop: 10, backgroundColor: "#333", padding: 10, borderRadius: 6 },
  progress: { fontSize: 12, color: "white", fontFamily: "pixel", marginBottom: 4 },

  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "red",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeText: { color: "white", fontWeight: "bold", fontSize: 12 },
});
