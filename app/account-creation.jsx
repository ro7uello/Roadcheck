// app/index.jsx
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

export default function Home() {
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

  const handleStart = () => router.push("/account-creation");

  return (
    <TouchableOpacity style={styles.container} onPress={handleStart} activeOpacity={1}>
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
        <Animated.View style={[styles.carContainer, { transform: [{ translateY: carBounce }] }]}>
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

        {/* Start Text */}
        <View style={styles.startContainer}>
          <Text style={styles.startText}>TAP ANYWHERE TO START!</Text>
        </View>
      </SafeAreaView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  movingBackground: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgWrapper: { position: "absolute", width, height },
  bgImage: { flex: 1, width: "105%", height: "105%" },

  carContainer: { position: "absolute", bottom: 20, left: width * 0.05 },
  car: { width: 300, height: 170 },

  titleContainer: { alignItems: "center", marginTop: 60 },
  title: {
    width: width * 0.8, 
    height:180,
    resizeMode:"contain"
  },

  startContainer: { position: "absolute", bottom: 120, alignSelf: "center" },
  startText: {
    fontSize: 20,
    color: "white",
    fontFamily: "Pixel3",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
