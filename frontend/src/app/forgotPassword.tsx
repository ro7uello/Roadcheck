// src/app/forgotPassword.tsx
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, ImageBackground, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from '../../config/api';

const { width, height } = Dimensions.get("window");
const BACKGROUND_SPEED = 12000;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start background animation
    Animated.loop(
      Animated.timing(bgAnim, { 
        toValue: 1, 
        duration: BACKGROUND_SPEED, 
        useNativeDriver: true 
      })
    ).start();
  }, []);

  const bgTranslate = bgAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0, -width] 
  });

  const handleResetRequest = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Requesting password reset for:', email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      console.log('✅ Reset email sent');

      Alert.alert(
        "Email Sent",
        "If an account exists with this email, you will receive a password reset link shortly. Please check your inbox.",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );

    } catch (error: any) {
      console.error("❌ Forgot password error:", error);

      if (error.name === 'AbortError') {
        Alert.alert("Timeout", "Request timed out. Please check your connection and try again.");
      } else {
        Alert.alert("Error", error?.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Moving Background */}
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

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>← BACK</Text>
      </TouchableOpacity>

      {/* Reset Box */}
      <View style={styles.box}>
        <Text style={styles.title}>FORGOT PASSWORD</Text>
        
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <TextInput
          placeholder="EMAIL"
          placeholderTextColor="#ccc"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.back()}
          disabled={loading}
          style={styles.loginLinkContainer}
        >
          <Text style={styles.loginLink}>Remember your password? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  movingBackground: { 
    ...StyleSheet.absoluteFillObject 
  },
  bgWrapper: { 
    position: "absolute", 
    width, 
    height 
  },
  bgImage: { 
    flex: 1, 
    width: "105%", 
    height: "105%" 
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4ef5a2",
    fontFamily: "pixel",
  },
  box: {
    position: "absolute",
    top: height * 0.15,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 24,
    borderRadius: 12,
    width: "70%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    color: "white",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    color: "#ccc",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontFamily: "pixel",
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#4ef5a2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonDisabled: {
    backgroundColor: "#2a8a5f",
    opacity: 0.6,
  },
  buttonText: { 
    fontSize: 16, 
    color: "black", 
    fontFamily: "pixel",
    fontWeight: "bold",
  },
  loginLinkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLink: {
    fontSize: 12,
    color: "#4ef5a2",
    fontFamily: "pixel",
  },
});