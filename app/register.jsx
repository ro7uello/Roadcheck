import { createClient } from "@supabase/supabase-js";
import { router } from "expo-router";
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

// ✅ Supabase client (replace with your credentials)
const supabase = createClient(
  "https://YOUR_PROJECT_ID.supabase.co",
  "YOUR_PUBLIC_ANON_KEY"
);

export default function AccountCreation() {
  // form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

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

  // ✅ Supabase Register
  const handleConfirm = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required!");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, firstName, lastName }, // extra metadata
      },
    });

    if (error) {
      Alert.alert("Registration Failed", error.message);
    } else {
      Alert.alert("Success", "Account created! Please confirm your email.");
      router.push("/login"); // redirect to login after registration
    }
  };

  const handleLogin = () => router.push("/login");

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
        <Animated.View style={[styles.bgWrapper, { transform: [{ translateX: Animated.add(bgTranslate, width) }] }]}>
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

      {/* Box */}
      <View style={styles.box}>
        <Text style={styles.title}>REGISTER</Text>

        <TextInput value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor="#ccc" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#ccc" secureTextEntry style={styles.input} />
        <TextInput value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor="#ccc" style={styles.input} />
        <TextInput value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor="#ccc" style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#ccc" keyboardType="email-address" style={styles.input} />

        <TouchableOpacity style={styles.button} onPress={handleConfirm} activeOpacity={0.8}>
          <Text style={styles.buttonText}>CONFIRM</Text>
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
  movingBackground: { ...StyleSheet.absoluteFillObject },
  bgWrapper: { position: "absolute", width, height },
  bgImage: { flex: 1, width: "105%", height: "105%" },
  carContainer: { position: "absolute", bottom: 5, left: width * 0.05 },
  car: { width: 250, height: 150 },

  box: {
    position: "absolute",
    top: height * 0.1, // adjust so it doesn’t overlap
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    borderRadius: 10,
    width: "60%",
  },
  title: {
    fontSize: 14,
    color: "white",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 6,
    padding: 8,
    color: "white",
    fontFamily: "pixel",
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 6,
    marginTop: -10,
  },
  buttonText: {
    fontSize: 12,
    color: "white",
    fontFamily: "pixel",
  },
  link: {
    fontSize: 8,
    color: "#4ef5a2",
    fontFamily: "pixel",
    marginTop: -10,
    textAlign: "center",
  },
});
