// src/app/login.tsx
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Image, ImageBackground, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from '../../config/api';
import { supabase } from '../../supabaseClient';
import CachedApiService from '../contexts/CachedApiService';

const { width, height } = Dimensions.get("window");
const BACKGROUND_SPEED = 12000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const bgTranslate = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -(width - 2)] });
  const carBounce = carAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login for:', email);
      console.log('API URL:', API_URL);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();
      console.log('Login response status:', response.status);
      console.log('Login response data:', data);

      // ============================================
      // 🆕 HANDLE "ALREADY LOGGED IN" CASE
      // ============================================
      if (response.status === 409) {
        setLoading(false);
        Alert.alert(
          'Already Logged In',
          'You are already logged in on another device. Would you like to logout from the other device and login here?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Logout Other Device',
              onPress: () => handleForceLogout()
            }
          ]
        );
        return;
      }

      // Handle other error responses
      if (!response.ok) {
        setLoading(false);
        Alert.alert('Login Failed', data.message || 'Invalid email or password');
        return;
      }

      // ============================================
      // SUCCESSFUL LOGIN
      // ============================================
      console.log('✅ Login successful');

      // Save tokens to AsyncStorage
      await AsyncStorage.setItem('access_token', data.access_token);
      await AsyncStorage.setItem('refresh_token', data.refresh_token);

      // Save user data
      await AsyncStorage.setItem('user_id', data.user.id);
      await AsyncStorage.setItem('user_email', data.user.email);

      console.log('✅ Tokens and user data saved to storage');

      setLoading(false);

      // Navigate to home and reset navigation stack
      router.replace('/optionPage');

    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    }
  };

  // ============================================
  // 🆕 FORCE LOGOUT FROM OTHER DEVICES
  // ============================================
  const handleForceLogout = async () => {
    setLoading(true);

    try {
      console.log('Force logout requested for:', email);

      const response = await fetch(`${API_URL}/auth/force-logout-others`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();
      console.log('Force logout response:', data);

      if (!response.ok) {
        setLoading(false);
        Alert.alert('Error', data.message || 'Failed to logout other devices');
        return;
      }

      // Save tokens to AsyncStorage
      await AsyncStorage.setItem('access_token', data.access_token);
      await AsyncStorage.setItem('refresh_token', data.refresh_token);

      // Save user data
      await AsyncStorage.setItem('user_id', data.user.id);
      await AsyncStorage.setItem('user_email', data.user.email);

      console.log('✅ Other device logged out, new session created');

      setLoading(false);

      // Show success message
      Alert.alert(
        'Success',
        'Other device has been logged out. You are now logged in.',
        [{ text: 'OK', onPress: () => router.replace('/optionPage') }]
      );

    } catch (error) {
      setLoading(false);
      console.error('Force logout error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please try again.'
      );
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
          style={[styles.bgWrapper, { transform: [{ translateX: Animated.add(bgTranslate, width - 2) }] }]}
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

        {/* Password Input with Eye Icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="PASSWORD"
            placeholderTextColor="#ccc"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={loading}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/forgotPassword")}
          disabled={loading}
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

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
  bgWrapper: { position: "absolute", width: width + 2, height, overflow: "hidden" },
  bgImage: { flex: 1, width: "102%", height: "102%" },
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
    fontFamily: 'spaceMono',
    marginBottom: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    color: "white",
    fontFamily: 'spaceMono',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#4ef5a2",
    fontFamily: "pixel",
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