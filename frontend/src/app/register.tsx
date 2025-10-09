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

const API_URL = process.env.API_URL;

// Password validation regex patterns
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasLowerCase: /[a-z]/,
  hasUpperCase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[./!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
};

// Username validation
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

export default function Register() {
  const router = useRouter();

  // form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation states
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const bgAnim = useRef(new Animated.Value(0)).current;
  const carAnim = useRef(new Animated.Value(0)).current;
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const emailCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Background scroll animation
    Animated.loop(
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: BACKGROUND_SPEED,
        useNativeDriver: true
      })
    ).start();

    // Car bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(carAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        }),
      ])
    ).start();

    // Cleanup function
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
      if (emailCheckTimeout.current) {
        clearTimeout(emailCheckTimeout.current);
      }
    };
  }, [bgAnim, carAnim]);

  const bgTranslate = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const carBounce = carAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  // Validate password in real-time
  const validatePassword = (pwd: string) => {
    const errors: string[] = [];

    if (pwd.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }
    if (!PASSWORD_REQUIREMENTS.hasLowerCase.test(pwd)) {
      errors.push("One lowercase letter");
    }
    if (!PASSWORD_REQUIREMENTS.hasUpperCase.test(pwd)) {
      errors.push("One uppercase letter");
    }
    if (!PASSWORD_REQUIREMENTS.hasNumber.test(pwd)) {
      errors.push("One number");
    }
    if (!PASSWORD_REQUIREMENTS.hasSpecialChar.test(pwd)) {
      errors.push("One special character (./!@#$%^&*...)");
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  // Check username availability with debounce
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError("");
      return;
    }

    // Validate format first
    if (!USERNAME_REGEX.test(username)) {
      setUsernameError("Username: 3-20 chars, letters, numbers, _ or -");
      return;
    }

    setUsernameChecking(true);
    setUsernameError("");

    try {
      const response = await fetch(`${API_URL}/auth/check-username/${username.toLowerCase()}`);
      const data = await response.json();

      if (!data.available) {
        setUsernameError("Username already taken");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Check email availability with debounce
  const checkEmailAvailability = async (email: string) => {
    if (!email || email.length < 3) {
      setEmailError("");
      return;
    }

    // Validate format first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format");
      return;
    }

    setEmailChecking(true);
    setEmailError("");

    try {
      const response = await fetch(`${API_URL}/auth/check-email/${email.toLowerCase()}`);
      const data = await response.json();

      if (!data.available) {
        setEmailError("Email already registered");
      } else {
        setEmailError("");
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setEmailChecking(false);
    }
  };

  // Handle username change with debounce
  const handleUsernameChange = (text: string) => {
    setUsername(text);

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Set new timeout for checking availability
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsernameAvailability(text);
    }, 500);
  };

  // Handle email change with debounce
  const handleEmailChange = (text: string) => {
    setEmail(text);

    // Clear previous timeout
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }

    // Set new timeout for checking availability
    emailCheckTimeout.current = setTimeout(() => {
      checkEmailAvailability(text);
    }, 500);
  };

  // Handle password change
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      validatePassword(text);
      setShowPasswordRequirements(true);
    } else {
      setShowPasswordRequirements(false);
      setPasswordErrors([]);
    }
  };

  // Backend Register
  const handleConfirm = async () => {
    // Client-side validation
    if (!email || !password || !username || !firstName || !lastName) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Check if email has error
    if (emailError) {
      Alert.alert("Error", "Email is already registered or invalid");
      return;
    }

    // Validate username
    if (!USERNAME_REGEX.test(username)) {
      Alert.alert("Error", "Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens");
      return;
    }

    // Check if username has error
    if (usernameError) {
      Alert.alert("Error", "Please choose a different username");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      Alert.alert("Error", "Password does not meet all requirements");
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
          email: email.trim(),
          password,
          username: username.toLowerCase().trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
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
      Alert.alert("Error", "Something went wrong. Please try again.");
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

        {/* Username */}
        <TextInput
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Username"
          placeholderTextColor="#ccc"
          style={[
            styles.input,
            usernameError ? styles.inputError : username.length > 0 && !usernameError && !usernameChecking ? styles.inputSuccess : null
          ]}
          autoCapitalize="none"
        />
        {usernameChecking && <Text style={styles.checkingText}>Checking...</Text>}
        {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
        {username.length > 0 && !usernameError && !usernameChecking && (
          <Text style={styles.successText}>✓ Username available</Text>
        )}

        {/* Password */}
        <TextInput
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          style={[
            styles.input,
            password.length > 0 && passwordErrors.length === 0 ? styles.inputSuccess : null
          ]}
        />

        {/* Password Requirements */}
        {showPasswordRequirements && (
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Password must have:</Text>
            {passwordErrors.map((error, index) => (
              <Text key={index} style={styles.requirementText}>
                • {error}
              </Text>
            ))}
            {passwordErrors.length === 0 && (
              <Text style={styles.successText}>✓ All requirements met!</Text>
            )}
          </View>
        )}

        {/* First Name */}
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor="#ccc"
          style={styles.input}
        />

        {/* Last Name */}
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          placeholderTextColor="#ccc"
          style={styles.input}
        />

        {/* Email */}
        <TextInput
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Email"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[
            styles.input,
            emailError ? styles.inputError : email.length > 0 && !emailError && !emailChecking ? styles.inputSuccess : null
          ]}
        />
        {emailChecking && <Text style={styles.checkingText}>Checking...</Text>}
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}
        {email.length > 0 && !emailError && !emailChecking && (
          <Text style={styles.successText}>✓ Email available</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (loading || usernameChecking || emailChecking || usernameError || emailError || (password.length > 0 && passwordErrors.length > 0)) && styles.buttonDisabled
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={loading || usernameChecking || emailChecking || !!usernameError || !!emailError || (password.length > 0 && passwordErrors.length > 0)}
        >
          <Text style={styles.buttonText}>
            {loading ? "CREATING..." : (usernameChecking || emailChecking) ? "CHECKING..." : "CONFIRM"}
          </Text>
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
    top: height * 0.05,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 25,
    borderRadius: 10,
    width: "60%",
    maxHeight: height * 0.85,
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
  inputError: {
    borderColor: "#ff6b6b",
  },
  inputSuccess: {
    borderColor: "#4ef5a2",
  },
  errorText: {
    fontSize: 9,
    color: "#ff6b6b",
    fontFamily: "pixel",
    marginBottom: 3,
    marginTop: -2,
  },
  successText: {
    fontSize: 9,
    color: "#4ef5a2",
    fontFamily: "pixel",
    marginBottom: 3,
    marginTop: -2,
  },
  checkingText: {
    fontSize: 9,
    color: "#ffd700",
    fontFamily: "pixel",
    marginBottom: 3,
    marginTop: -2,
  },
  requirementsBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 5,
    marginBottom: 4,
  },
  requirementsTitle: {
    fontSize: 9,
    color: "#ffd700",
    fontFamily: "pixel",
    marginBottom: 3,
  },
  requirementText: {
    fontSize: 8,
    color: "#ff6b6b",
    fontFamily: "pixel",
    marginBottom: 2,
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
  buttonDisabled: {
    backgroundColor: "rgba(0,0,0,0.4)",
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