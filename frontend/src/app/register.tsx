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

import { API_URL } from '../../config/api';

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
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);
  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false);

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
      setUsernameChecking(false);
      return;
    }

    // Validate format first
    if (!USERNAME_REGEX.test(username)) {
      setUsernameError("Username: 3-20 chars, letters, numbers, _ or -");
      setUsernameChecking(false);
      return;
    }

    setUsernameChecking(true);
    setUsernameError("");

    try {
      const response = await fetch(`${API_URL}/auth/check-username/${encodeURIComponent(username.toLowerCase())}`);

      if (!response.ok) {
        throw new Error('Network error');
      }

      const data = await response.json();

      if (!data.available) {
        setUsernameError("Username already taken");
      } else {
        setUsernameError(""); // Valid and available
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Unable to check username");
    } finally {
      setUsernameChecking(false);
    }
  };

  // Check email availability with debounce
  const checkEmailAvailability = async (email: string) => {
    // Validate email format FIRST
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError("");
      setEmailChecking(false);
      return;
    }

    // Don't check availability if format is invalid
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format");
      setEmailChecking(false);
      return;
    }

    // Only check availability if format is valid
    setEmailChecking(true);
    setEmailError("");

    try {
      const response = await fetch(`${API_URL}/auth/check-email/${encodeURIComponent(email.toLowerCase())}`);

      if (!response.ok) {
        throw new Error('Network error');
      }

      const data = await response.json();

      if (!data.available) {
        setEmailError("Email already registered");
      } else {
        setEmailError(""); // Valid and available
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailError("Unable to check email");
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

    // Clear checking state and error if too short
    if (text.length < 3) {
      setUsernameError("");
      setUsernameChecking(false);
      return;
    }

    // Validate format immediately
    if (!USERNAME_REGEX.test(text)) {
      setUsernameError("Username: 3-20 chars, letters, numbers, _ or -");
      setUsernameChecking(false);
      return;
    }

    // Clear error if format is valid
    setUsernameError("");

    // Check availability with debounce
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsernameAvailability(text);
    }, 800);
  };

  // Handle email change with debounce
  const handleEmailChange = (text: string) => {
    setEmail(text);

    // Validate format immediately for user feedback
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Clear previous timeout
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }

    // Show format error immediately if invalid
    if (text.length > 0 && !emailRegex.test(text)) {
      setEmailError("Invalid email format");
      setEmailChecking(false);
      return;
    }

    // Clear error if format is correct
    if (emailRegex.test(text)) {
      setEmailError("");
    }

    // Only check availability if format is valid
    if (emailRegex.test(text)) {
      emailCheckTimeout.current = setTimeout(() => {
        checkEmailAvailability(text);
      }, 800);
    }
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

  const handleTermsScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20; // How close to bottom before enabling button
    const contentFitsInView = contentSize.height <= layoutMeasurement.height + paddingToBottom;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !termsScrolledToBottom || contentFitsInView) {
      setTermsScrolledToBottom(true);
    }
  };

  const handlePrivacyScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const contentFitsInView = contentSize.height <= layoutMeasurement.height + paddingToBottom;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !privacyScrolledToBottom || contentFitsInView) {
      setPrivacyScrolledToBottom(true);
    }
  };

  const handleTermsRead = () => {
    if (termsScrolledToBottom) {
      setHasReadTerms(true);
      setShowTerms(false);
      setTermsScrolledToBottom(false); // Reset for next time
    }
  };

  const handlePrivacyRead = () => {
    if (privacyScrolledToBottom) {
      setHasReadPrivacy(true);
      setShowPrivacy(false);
      setPrivacyScrolledToBottom(false); // Reset for next time
    }
  };

  // Reset scroll states when modals open
  const openTermsModal = () => {
    setTermsScrolledToBottom(false);
    setShowTerms(true);
  };

  const openPrivacyModal = () => {
    setPrivacyScrolledToBottom(false);
    setShowPrivacy(true);
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
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          indicatorStyle="black" // Add this for better visibility
          scrollIndicatorInsets={{right: 1}}
          persistentScrollbar={true}

        >

          {/* Username */}
          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Username"
            placeholderTextColor="#ccc"
            style={[
              styles.input,
              (usernameError || (username.length > 0 && !USERNAME_REGEX.test(username)))
                ? styles.inputError
                : username.length >= 3 && !usernameError && !usernameChecking && USERNAME_REGEX.test(username)
                ? styles.inputSuccess
                : null
            ]}
            autoCapitalize="none"
          />

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
              emailError === "Invalid email format"
                ? styles.inputError
                : emailError === "Email already registered"
                ? styles.inputError
                : email.length > 0 && !emailError && !emailChecking && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? styles.inputSuccess
                : null
            ]}
          />
          {emailError && (
                      <Text style={styles.errorText}>
                        {emailError === "Invalid email format" ? "⚠️ " : "❌ "}{emailError}
                      </Text>
                    )}

                    {usernameError && (
                      <Text style={styles.errorText}>
                        {usernameError.includes("chars") ? "⚠️ " : "❌ "}{usernameError}
                      </Text>
                    )}

          {/* Terms and Privacy Policy Agreement */}
          <View>
            <View style={styles.legalLinksContainer}>
              <TouchableOpacity 
                onPress={openTermsModal}
                style={[styles.legalButton, hasReadTerms && styles.legalButtonRead]}
              >
                <Text style={[styles.legalButtonText, hasReadTerms && styles.legalButtonTextRead]}>
                  {hasReadTerms ? "✓ " : ""}Terms & Conditions
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={openPrivacyModal}
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
            <ScrollView style={styles.modalScrollView}
              onScroll={handleTermsScroll} // Add scroll handler
              scrollEventThrottle={16}>
              <Text style={styles.modalText}>
                Welcome to RoadCheck! By using our application, you agree to the following terms:{'\n\n'}
                
                <Text style={styles.sectionHeader}>ACCEPTANCE OF TERMS{'\n'}</Text>
                By downloading, installing, or using RoadCheck, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application{'\n\n'}

                <Text style={styles.sectionHeader}>ABOUT ROADCHECK{'\n'}</Text>
                RoadCheck is a capstone project application developed for educational and research purposes. This application serves as a prototype to help users learn traffic rules and road safety in accordance with Philippine traffic regulations.{'\n\n'}
                
                <Text style={styles.sectionHeader}>USE OF THE APPLICATION{'\n'}</Text>
                • RoadCheck is designed for educational purposes to help users learn traffic rules and road safety.{'\n'}
                • You must be at least 18 years old to use this application.{'\n'}
                • You are responsible for maintaining the confidentiality of your account.{'\n\n'}
                
                <Text style={styles.sectionHeader}>USER CONDUCT{'\n'}</Text>
                • Use the app responsibly and in accordance with applicable laws.{'\n'}
                • Not use the application for any illegal or unauthorized purpose.{'\n'}
                • Not interfere with or disrupt the application's servers or networks.{'\n'}
                • Not impersonate others or provide false information.{'\n'}
                • Do not attempt to hack, reverse engineer, or misuse the application.{'\n\n'}
                
                 <Text style={styles.sectionHeader}>EDUCATIONAL CONTENT{'\n'}</Text>
                • All content provided is for educational purposes to help you be knowledgeable about the Philippine traffic rules and regulations only and should not replace official driver's education or examination preparation.{'\n'}
                • While we strive for accuracy in presenting traffic rules and regulations, this application is NOT a substitute for:{'\n'}
                {'\u00A0\u00A0\u00A0\u00A0'}• Official LTO (Land Transportation Office) training programs;{'\n'}
                {'\u00A0\u00A0\u00A0\u00A0'}• Professional driving instruction;{'\n'}
                {'\u00A0\u00A0\u00A0\u00A0'}• Official driver's license examinations.{'\n'}
                • RoadCheck does not guarantee passing any official driving tests or examinations.{'\n'}
                • Always refer to official LTO regulations and guidelines for authoritative information.{'\n\n'}
                
                <Text style={styles.sectionHeader}>CHANGES TO TERMS{'\n'}</Text>
                • To the fullest extent permitted by law:{'\n\n'}
                  • RoadCheck and its developers are not liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use or inability to use the application.{'\n'}
                  • This includes but is not limited to: damages for loss of data, failed examinations, or any reliance on information provided by the application.{'\n'}
                  • RoadCheck is provided "as is" without warranties of any kind, either express or implied.{'\n'}
                  • As a capstone/prototype project, the application may contain bugs, errors, or incomplete features.{'\n\n'}
                
                6. CHANGES TO TERMS{'\n'}
                • We reserve the right to modify these terms at any time.{'\n\n'}
                
                For questions, contact us at support@roadcheck.app
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.modalButton,
                  !termsScrolledToBottom && styles.modalButtonDisabled
                ]}
                onPress={handleTermsRead}
                disabled={!termsScrolledToBottom}
              >
                <Text style={[
                  styles.modalButtonText,
                  !termsScrolledToBottom && styles.modalButtonTextDisabled
                ]}>
                  {termsScrolledToBottom ? "I Have Read This" : "Scroll to Continue"}
                </Text>
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
            <ScrollView style={styles.modalScrollView}
              onScroll={handlePrivacyScroll} // Add scroll handler
              scrollEventThrottle={16}
            >
              <Text style={styles.modalText}>
                Your privacy is important to us. This policy explains how we collect and use your information.{'\n\n'}
                
                 <Text style={styles.sectionHeader}>INFORMATION WE COLLECT{'\n'}</Text>
                • Account information: username, email, first name, last name{'\n'}
                • Usage data: game progress, scores, and learning analytics{'\n'}
                • App interaction data: which scenarios you complete and your performance{'\n\n'}
                
                <Text style={styles.sectionHeader}>HOW WE USE YOUR INFORMATION{'\n'}</Text>
                • To provide and improve our services{'\n'}
                • To track your learning progress{'\n'}
                • To send important updates about the app{'\n\n'}
                
                <Text style={styles.sectionHeader}>INFORMATION SHARING{'\n'}</Text>
                • We do not sell or rent your personal information{'\n'}
                • We may share aggregated, anonymized data for research purposes{'\n'}
                • We may disclose information if required by law{'\n\n'}
                
                <Text style={styles.sectionHeader}>DATA SECURITY{'\n'}</Text>
                • We use industry-standard security measures{'\n'}
                • Your password is encrypted and secure{'\n'}
                • We regularly update our security practices{'\n\n'}
                
                <Text style={styles.sectionHeader}>YOUR RIGHTS{'\n'}</Text>
                • You can delete your account{'\n'}
                • You can contact us about any privacy concerns{'\n\n'}

                <Text style={styles.sectionHeader}>DATA RETENTION{'\n'}</Text>
                • We keep your account data as long as your account is active{'\n'}
                • Learning progress data is stored to improve your experience{'\n\n'}
                
                <Text style={styles.sectionHeader}>UNDER 18 PRIVACY{'\n'}</Text>
                • We do not knowingly collect information from user under 18.{'\n\n'}
                
                <Text style={styles.sectionHeader}>CHANGES TO POLICY{'\n'}</Text>
                • We may update this policy and will notify users of significant changes.{'\n\n'}
                
                Contact us at privacy@roadcheck.app for questions about this policy.
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.modalButton,
                  !privacyScrolledToBottom && styles.modalButtonDisabled
                ]}
                onPress={handlePrivacyRead}
                disabled={!privacyScrolledToBottom}
              >
                <Text style={[
                  styles.modalButtonText,
                  !privacyScrolledToBottom && styles.modalButtonTextDisabled
                ]}>
                  {privacyScrolledToBottom ? "I Have Read This" : "Scroll to Continue"}
                </Text>
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
    overflow: 'hidden',
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
    paddingHorizontal: 15,
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
  modalButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  modalButtonTextDisabled: {
    color: '#666666',
  },
  sectionHeader: {
    fontSize: 10,
    color: '#000',
    fontFamily: 'pixel',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});