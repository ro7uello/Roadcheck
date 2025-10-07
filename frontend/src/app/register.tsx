import { useRouter } from "expo-router";
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

// Use your actual API URL from environment or fallback
const API_URL = process.env.API_URL;

export default function Register() {
  const router = useRouter();

  // form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
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

  // Backend Register
  const handleConfirm = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required!");
      return;
    }

    try {
      setLoading(true);
      console.log("API_URL =>", API_URL);
      console.log("Making request to:", `${API_URL}/auth/signup`);
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          firstName,
          lastName,
        }),
      });
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      if (res.ok) {
        Alert.alert("Success", "Account created! Please confirm your email.");
        router.push("/login");
      } else {
        Alert.alert("Error", data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => router.push("/login");

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.movingBackground}>
        <Animated.View style={[styles.bgWrapper, { transform: [{ translateX: bgTranslate }] }]}>
          <ImageBackground
            source={require("../../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View style={[styles.bgWrapper, { transform: [{ translateX: Animated.add(bgTranslate, width) }] }]}>
          <ImageBackground
            source={require("../../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carBounce }] }]}>
        <Image
          source={require("../../assets/car/blue-car.png")}
          style={styles.car}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Box */}
      <View style={styles.box}>
        <Text style={styles.title}>REGISTER</Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor="#ccc"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor="#ccc"
          style={styles.input}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          placeholderTextColor="#ccc"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "CREATING..." : "CONFIRM"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
          <Text style={styles.link}>Already have an account? LOGIN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  movingBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgWrapper: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
  },
  bgImage: {
    width,
    height,
  },
  carContainer: { position: "absolute", bottom: 5, left: width * 0.05 },
  car: { width: 250, height: 150 },
  box: {
    position: "absolute",
    top: height * 0.08,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 25,
    borderRadius: 10,
    width: "60%",
    maxHeight: height * 0.75,
  },
  title: {
    fontSize: 14,
    color: "white",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    color: "white",
    fontFamily: "pixel",
    marginBottom: 4,
    fontSize: 11,
    height: 28,
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 12,
    color: "white",
    fontFamily: "pixel",
  },
  link: {
    fontSize: 10,
    color: "#4ef5a2",
    fontFamily: "pixel",
    textAlign: "center",
    paddingTop: 2,
  },
});