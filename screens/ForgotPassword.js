import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator, // Import ActivityIndicator
} from "react-native";
import {
  MaterialIcons as Icon,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true); // Set loading to true
    const response = await fetch(
      "https://vehicles-tau.vercel.app/api/forgot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    setIsLoading(false); // Set loading to false
    if (!response.ok) {
      const errorText = await response.text();
      setMessage(`Error: ${errorText}`);
      return;
    }
    const data = await response.text();
    setMessage(data);
    if (response.ok) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true); // Set loading to true
    const response = await fetch(
      "https://vehicles-tau.vercel.app/api/verify-otpp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      }
    );
    setIsLoading(false); // Set loading to false
    const data = await response.json();
    setMessage(data.error || data.message);

    if (response.ok) {
      navigation.navigate("ResetPassword", { email });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a73e8" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          style={styles.headerContainer}
        >
          <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.iconBackground}
            >
              <Icon
                name="local-parking"
                size={80}
                color="#FFFFFF"
                style={styles.headerIcon}
              />
            </LinearGradient>
            <Text style={styles.header}>Reset Password</Text>
            <Text style={styles.subHeader}>Enter your email</Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          {!otpSent ? (
            <>
              <View style={styles.inputContainer}>
                <Icon
                  name="email"
                  size={24}
                  color="#1a73e8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleSubmit}
              >
                {isLoading ? ( // Show loading indicator
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Icon
                  name="lock"
                  size={24}
                  color="#1a73e8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleVerifyOtp}
              >
                {isLoading ? ( // Show loading indicator
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.linkText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    height: "35%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 16,
  },
  flashIcon: {
    position: "absolute",
    right: -20,
    top: -10,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subHeader: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E8FF",
    marginBottom: 16,
    height: 56,
    elevation: 2,
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#2D3748",
    paddingLeft: 8,
  },
  resetButton: {
    backgroundColor: "#34a853",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  message: {
    marginTop: 20,
    color: "#FF5722", // Orange color for messages
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  linkButton: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#E1E8FF",
    marginHorizontal: 5,
  },
  linkText: {
    color: "#1a73e8",
    fontSize: 16,
    fontWeight: "600",
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerIcon: {
    transform: [{ rotate: "-10deg" }],
  },
});

export default ForgotPassword;
