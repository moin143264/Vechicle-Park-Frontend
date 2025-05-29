import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons as Icon,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const ResetPassword = ({ route, navigation }) => {
  const { email } = route.params; // Get email from route params
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // New loading state
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [buttonText, setButtonText] = useState("Reset Password"); // New state for button text

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setButtonText("Updating..."); // Set button text to "Updating..."
    const response = await fetch("https://vehicles-tau.vercel.app/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.text();
    setMessage(data);
    if (response.ok) {
      setButtonText("Updated"); // Change button text to "Updated"
      setTimeout(() => {
        navigation.navigate("Login");
      }, 1000);
    }
    setLoading(false);
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
            <Text style={styles.subHeader}>Enter your new password</Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock"
              size={24}
              color="#1a73e8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>{buttonText}</Text>
          </TouchableOpacity>
          {message && <Text style={styles.message}>{message}</Text>}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
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
  linkButton: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#E1E8FF",
    marginTop: 20,
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

export default ResetPassword;
