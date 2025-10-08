// src/app/login.tsx
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from '@env';

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
    // Check if user is already logged in
    checkExistingLogin();

    // Start animations
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

  // Check if user is already logged in
  const checkExistingLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        console.log('🔍 Existing token found, verifying...');
        // Optional: Verify token with backend
        const isValid = await verifyToken(token);
        if (isValid) {
          console.log('✅ Token valid, navigating to optionPage');
          router.replace('/optionPage');
        } else {
          console.log('❌ Token invalid, clearing storage');
          await AsyncStorage.clear();
        }
      }
    } catch (error) {
      console.log('❌ Error checking existing login:', error);
    }
  };

  // Verify token with backend
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch (error) {
      console.log('Token verification failed:', error);
      return false;
    }
  };

  const bgTranslate = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const carBounce = carAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const handleLogin = async () => {
    // Input validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Starting login for:', email);
      console.log('API_URL:', API_URL);
      console.log('Calling:', `${API_URL}/auth/login`);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(async () => {
          const textData = await response.text();
          return { message: textData || 'Network error' };
        });

        console.log('❌ Login failed. Status:', response.status, 'Error:', errorData);

        // Better error messages based on status
        let errorMessage = 'Login failed';
        if (response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (response.status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Login response received');

      // Validate response structure
      if (!data.access_token) {
        console.log('❌ No access token in response');
        throw new Error('No access token received from server');
      }

      if (!data.user?.id) {
        console.log('⚠️ No user ID in response');
      }

      console.log('✅ Login successful!');

      // Save authentication data - FIXED: Use 'userId' instead of 'user_id'
      const authData: [string, string][] = [
        ['access_token', data.access_token],
        ['userId', String(data.user?.id || '')], // CHANGED THIS LINE
        ['user_email', data.user?.email || email.trim().toLowerCase()],
        ['login_timestamp', new Date().toISOString()]
      ];

      await AsyncStorage.multiSet(authData);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      console.log('💾 Authentication data saved');

      // Verify token was saved
      const savedToken = await AsyncStorage.getItem('access_token');
      const savedUserId = await AsyncStorage.getItem('userId'); // VERIFY THIS TOO

      if (!savedToken) {
        throw new Error('Failed to save authentication token');
      }

      console.log('🔍 Token verification: ✅ SAVED');
      console.log('🔍 User ID saved:', savedUserId);
      console.log('🚀 Navigating to optionPage...');

      // Use replace to prevent going back to login screen
      router.replace('/optionPage');

    } catch (error: any) {
      console.error("❌ Login error:", error);

      if (error.name === 'AbortError') {
        Alert.alert("Timeout", "Login request timed out. Please check your connection and try again.");
      } else {
        Alert.alert("Login Failed", error?.message || "An unexpected error occurred");
      }
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

      {/* Car */}
      <Animated.View style={[styles.carContainer, { transform: [{ translateY: carBounce }] }]}>
        <Image 
          source={require("../../assets/car/blue-car.png")}
          style={styles.car} 
          resizeMode="contain" 
        />
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
          editable={!loading}
          autoCorrect={false}
        />
        <TextInput
          placeholder="PASSWORD"
          placeholderTextColor="#ccc"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("/register")}
          disabled={loading}
        >
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
  buttonDisabled: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  buttonText: { 
    fontSize: 18, 
    color: "white", 
    fontFamily: "pixel" 
  },
  link: { 
    fontSize: 12, 
    color: "white", 
    fontFamily: "pixel", 
    textAlign: "center", 
    marginTop: 8 
  },
});