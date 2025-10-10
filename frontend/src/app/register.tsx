import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
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

  // Modal states for legal documents
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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

    if (!hasReadTerms || !hasReadPrivacy || !agreeToTerms) {
      Alert.alert(
        "Terms Required", 
        "You must read the Terms & Conditions and Privacy Policy, then agree to them before creating an account."
      );
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

  const handleTermsRead = () => {
    setHasReadTerms(true);
    setShowTerms(false);
  };

  const handlePrivacyRead = () => {
    setHasReadPrivacy(true);
    setShowPrivacy(false);
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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

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

          {/* Terms and Privacy Policy Agreement */}
          <View>
            <View style={styles.legalLinksContainer}>
              <TouchableOpacity 
                onPress={() => setShowTerms(true)}
                style={[styles.legalButton, hasReadTerms && styles.legalButtonRead]}
              >
                <Text style={[styles.legalButtonText, hasReadTerms && styles.legalButtonTextRead]}>
                  {hasReadTerms ? "✓ " : ""}Terms & Conditions
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setShowPrivacy(true)}
                style={[styles.legalButton, hasReadPrivacy && styles.legalButtonRead]}
              >
                <Text style={[styles.legalButtonText, hasReadPrivacy && styles.legalButtonTextRead]}>
                  {hasReadPrivacy ? "✓ " : ""}Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>

            {/* Agreement checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => {
                if (hasReadTerms && hasReadPrivacy) {
                  setAgreeToTerms(!agreeToTerms);
                } else {
                  Alert.alert("Please Read", "You must read both documents before agreeing.");
                }
              }}
              disabled={!hasReadTerms || !hasReadPrivacy}
            >
              <View style={[
                styles.checkbox, 
                agreeToTerms && styles.checkboxChecked,
                (!hasReadTerms || !hasReadPrivacy) && styles.checkboxDisabled
              ]}>
                {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[
                styles.checkboxText,
                (!hasReadTerms || !hasReadPrivacy) && styles.checkboxTextDisabled
              ]}>
                I agree to the Terms & Conditions and Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || usernameChecking || emailChecking || usernameError || emailError || (password.length > 0 && passwordErrors.length > 0) || !hasReadTerms || !hasReadPrivacy || !agreeToTerms) && styles.buttonDisabled
            ]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={loading || usernameChecking || emailChecking || !!usernameError || !!emailError || (password.length > 0 && passwordErrors.length > 0) || !hasReadTerms || !hasReadPrivacy || !agreeToTerms}
          >
            <Text style={[styles.buttonText, (!hasReadTerms || !hasReadPrivacy || !agreeToTerms)&& styles.buttonTextDisabled]}>
              {loading ? "CREATING..." : (usernameChecking || emailChecking) ? "CHECKING..." : "CONFIRM"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
            <Text style={styles.link}>Already have an account? LOGIN</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTerms}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>
                Welcome to RoadCheck! By using our application, you agree to the following terms:{'\n\n'}
                
                1. ACCEPTANCE OF TERMS{'\n'}
                By downloading, installing, or using RoadCheck, you agree to be bound by these terms.{'\n\n'}
                
                2. USE OF THE APPLICATION{'\n'}
                • RoadCheck is designed for educational purposes to help users learn traffic rules and road safety.{'\n'}
                • You must be at least 18 years old to use this application.{'\n'}
                • You are responsible for maintaining the confidentiality of your account.{'\n\n'}
                
                3. USER CONDUCT{'\n'}
                • Use the app responsibly and in accordance with applicable laws.{'\n'}
                • Do not attempt to hack, reverse engineer, or misuse the application.{'\n\n'}
                
                4. EDUCATIONAL CONTENT{'\n'}
                • The content provided is for educational purposes only.{'\n'}
                • While we strive for accuracy, always refer to official traffic regulations.{'\n\n'}
                
                5. LIMITATION OF LIABILITY{'\n'}
                • RoadCheck is not liable for any damages arising from the use of this application.{'\n\n'}
                
                6. CHANGES TO TERMS{'\n'}
                • We reserve the right to modify these terms at any time.{'\n\n'}
                
                For questions, contact us at support@roadcheck.app
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleTermsRead}
              >
                <Text style={styles.modalButtonText}>I Have Read This</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>
                Your privacy is important to us. This policy explains how we collect and use your information.{'\n\n'}
                
                1. INFORMATION WE COLLECT{'\n'}
                • Account information: username, email, first name, last name{'\n'}
                • Usage data: game progress, scores, and learning analytics{'\n'}
                • App interaction data: which scenarios you complete and your performance{'\n\n'}
                
                2. HOW WE USE YOUR INFORMATION{'\n'}
                • To provide and improve our services{'\n'}
                • To track your learning progress{'\n'}
                • To send important updates about the app{'\n\n'}
                
                3. INFORMATION SHARING{'\n'}
                • We do not sell or rent your personal information{'\n'}
                • We may share aggregated, anonymized data for research purposes{'\n'}
                • We may disclose information if required by law{'\n\n'}
                
                4. DATA SECURITY{'\n'}
                • We use industry-standard security measures{'\n'}
                • Your password is encrypted and secure{'\n'}
                • We regularly update our security practices{'\n\n'}
                
                5. YOUR RIGHTS{'\n'}
                • You can request deletion of your account{'\n'}
                • You can contact us about any privacy concerns{'\n\n'}

                6. DATA RETENTION{'\n'}
                • We keep your account data as long as your account is active{'\n'}
                • Learning progress data is stored to improve your experience{'\n\n'}
                
                7. U18 PRIVACY{'\n'}
                • We do not knowingly collect information from user under 18.{'\n\n'}
                
                8. CHANGES TO POLICY{'\n'}
                • We may update this policy and will notify users of significant changes.{'\n\n'}
                
                Contact us at privacy@roadcheck.app for questions about this policy.
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handlePrivacyRead}
              >
                <Text style={styles.modalButtonText}>I Have Read This</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    height: height * 0.85, // Fixed height for scrolling
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 25,
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
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 3,
    marginBottom: 8,
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
  termsText: {
    fontSize: 9,
    color: "#ccc",
    fontFamily: "pixel",
    textAlign: 'center',
    lineHeight: 2,
  },
  linkText: {
    color: "#4ef5a2",
    textDecorationLine: 'underline',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: width * 0.75,
    maxHeight: height * 0.65,
    paddingBottom: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 12,
    fontFamily: 'pixel',
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalScrollView: {
    padding: 12,
  },
  modalText: {
    fontSize: 9,
    color: '#333',
    lineHeight: 14,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  legalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 0.48,
  },
  legalButtonRead: {
    backgroundColor: 'rgba(78, 245, 162, 0.2)',
    borderColor: '#4ef5a2',
  },
  legalButtonText: {
    fontSize: 8,
    color: '#ccc',
    fontFamily: 'pixel',
    textAlign: 'center',
  },
  legalButtonTextRead: {
    color: '#4ef5a2',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ef5a2',
    borderColor: '#4ef5a2',
  },
  checkboxDisabled: {
    borderColor: '#666',
    backgroundColor: 'rgba(102, 102, 102, 0.3)',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 8,
    color: '#ccc',
    fontFamily: 'pixel',
    flex: 1,
    lineHeight: 12,
  },
  checkboxTextDisabled: {
    color: '#666',
  },
  buttonTextDisabled: {
    color: '#666',
  },
  modalFooter: {
    padding: 2,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    backgroundColor: 'transparent',
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'black',
    fontFamily: 'pixel',
    fontSize: 12,
  },
});