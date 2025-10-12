// src/app/resetPassword.tsx
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Dimensions, ImageBackground, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { API_URL } from '../../config/api';

const { width, height } = Dimensions.get("window");

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      Alert.alert("Error", "Invalid reset link");
      router.replace('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-token/${token}`);
      const data = await response.json();

      if (response.ok) {
        setTokenValid(true);
        setUserEmail(data.email || '');
      } else {
        Alert.alert(
          "Invalid Link",
          data.message || "This reset link is invalid or has expired.",
          [{ text: "OK", onPress: () => router.replace('/login') }]
        );
      }
    } catch (error) {
      console.error("Token verification error:", error);
      Alert.alert(
        "Error",
        "Failed to verify reset link. Please try again.",
        [{ text: "OK", onPress: () => router.replace('/login') }]
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please enter both password fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      Alert.alert(
        "Success",
        "Your password has been reset successfully!",
        [
          {
            text: "Login",
            onPress: () => router.replace('/login')
          }
        ]
      );

    } catch (error: any) {
      console.error("Reset password error:", error);
      Alert.alert("Error", error?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageBackground
          source={require("../../assets/background/city-background.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4ef5a2" />
            <Text style={styles.loadingText}>Verifying reset link...</Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../../assets/background/city-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.box}>
          <Text style={styles.title}>RESET PASSWORD</Text>
          
          {userEmail && (
            <Text style={styles.emailText}>For: {userEmail}</Text>
          )}

          <TextInput
            placeholder="NEW PASSWORD"
            placeholderTextColor="#ccc"
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!loading}
            autoCorrect={false}
          />

          <TextInput
            placeholder="CONFIRM PASSWORD"
            placeholderTextColor="#ccc"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
            autoCorrect={false}
          />

          <Text style={styles.hint}>
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character
          </Text>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.replace('/login')}
            disabled={loading}
            style={styles.cancelContainer}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: "white",
    fontFamily: "pixel",
    marginTop: 16,
  },
  box: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 24,
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    color: "white",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 16,
  },
  emailText: {
    fontSize: 12,
    color: "#4ef5a2",
    fontFamily: "pixel",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontFamily: "pixel",
    marginBottom: 12,
    fontSize: 14,
  },
  hint: {
    fontSize: 10,
    color: "#999",
    fontFamily: "pixel",
    marginBottom: 16,
    lineHeight: 14,
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
  cancelContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 12,
    color: "#999",
    fontFamily: "pixel",
  },
});