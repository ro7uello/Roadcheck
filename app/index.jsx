// app/login.jsx
import { router } from "expo-router";
import { useEffect, useRef } from "react";
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

const { width, height } = Dimensions.get("window");
const BACKGROUND_SPEED = 12000;

export default function LoginPage() {
  const bgAnim = useRef(new Animated.Value(0)).current;
  const carAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background loop
    Animated.loop(
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: BACKGROUND_SPEED,
        useNativeDriver: true,
      })
    ).start();

    // Car bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(carAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const bgTranslate = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  const carBounce = carAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const handleLogin = () => {
    router.push("/home-screen"); // 👈 Redirect after login
  };

  const handleRegister = () => {
    router.push("/register"); // 👈 New route for register page
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.movingBackground}>
        <Animated.View
          style={[styles.bgWrapper, { transform: [{ translateX: bgTranslate }] }]}
        >
          <ImageBackground
            source={require("../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="stretch"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bgWrapper,
            { transform: [{ translateX: Animated.add(bgTranslate, width) }] },
          ]}
        >
          <ImageBackground
            source={require("../assets/background/city-background.png")}
            style={styles.bgImage}
            resizeMode="stretch"
          />
        </Animated.View>
      </View>

      {/* Car */}
      <Animated.View
        style={[styles.carContainer, { transform: [{ translateY: carBounce }] }]}
      >
        <Image
          source={require("../assets/car/blue-car.png")}
          style={styles.car}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Image
          source={require("../assets/background/roadcheck.png")}
          style={styles.title}
          resizeMode="contain"
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {/* Login Button */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.mainButton, { marginTop: 20 }]}
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>REGISTER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  movingBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgWrapper: { position: "absolute", width, height },
  bgImage: { flex: 1, width: "105%", height: "105%" },

  carContainer: { position: "absolute", bottom: 5, left: width * 0.05 },
  car: { width: 300, height: 170 },

  titleContainer: { alignItems: "center", marginTop: 10 },
  title: { width: width * 0.8, height: 180 },

  buttonContainer: {
    position: "absolute",
    bottom: 110,
    alignSelf: "center",
    alignItems: "center",
  },
  mainButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
    bottom: -50,
  },
  buttonText: {
    fontSize: 15,
    color: "white",
    fontFamily: "Pixel3",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
