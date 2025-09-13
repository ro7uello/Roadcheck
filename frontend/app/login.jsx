import { useRouter } from "expo-router";
import { API_URL } from "@env";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const BACKGROUND_SPEED = 12000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
  }, []);

  const bgTranslate = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const carBounce = carAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  // ✅ Backend login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Example: backend should return a token or user info
        Alert.alert("Success", "Login successful!");
        // 👉 Save token/user in AsyncStorage or Context later
        router.push("/account-creation"); // adjust the route you want to go after login
      } else {
        Alert.alert("Login Failed", data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Login Box */}
      <View style={styles.box}>
        <Text style={styles.title}>LOGIN</Text>

        <TextInput
          placeholder="EMAIL"
          placeholderTextColor="#ccc"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="PASSWORD"
          placeholderTextColor="#ccc"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "LOADING..." : "LOGIN"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={[styles.link, { color: "#4ef5a2" }]}>SIGN UP</Text>
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
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
    borderRadius: 12,
    width: "70%",
  },
  title: {
    fontSize: 26,
    color: "white",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    padding: 10,
    color: "white",
    fontFamily: "pixel",
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonText: { fontSize: 18, color: "white", fontFamily: "pixel" },
  link: { fontSize: 12, color: "white", fontFamily: "pixel", textAlign: "center", marginTop: 8 },
});
