import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../utils/axiosInstance";
import { useUserContext } from "../UserContext";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState("user");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const { setUser } = useUserContext();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/login", {
        email,
        password,
        role,
      });

      setUser(data._id, data.token, data.role);
      await AsyncStorage.multiSet([
        ["token", data.token],
        ["name", data.name],
        ["role", data.role],
        ["_id", data._id],
      ]);

      if (data.role === "admin") {
        navigation.replace("AdminPanel");
      } else {
        navigation.replace("Home", { userId: data._id, userEmail: data.email });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Login failed. Please try again.";
      Alert.alert("Login Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <Text style={styles.welcomeSubText}>Your parking space awaits you</Text>
      </View>

      <View style={styles.inputContainer}>
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          style={styles.inputIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon name="email" size={24} color="#FFFFFF" />
        </LinearGradient>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.inputContainer}>
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          style={styles.inputIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon name="lock" size={24} color="#FFFFFF" />
        </LinearGradient>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity
          onPress={() => setPasswordVisible(!passwordVisible)}
          style={styles.eyeIcon}
        >
          <Icon
            name={passwordVisible ? "visibility" : "visibility-off"}
            size={24}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.dropdownWrapper}>
        <DropDownPicker
          open={open}
          value={role}
          items={[
            { label: "User", value: "user" },
            { label: "Admin", value: "admin" },
          ]}
          setOpen={setOpen}
          setValue={setRole}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          textStyle={styles.dropdownText}
          placeholder="Select Role"
          placeholderStyle={styles.dropdownPlaceholder}
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View style={styles.spinnerContainer}>
                <Icon name="sync" size={24} color="#FFF" />
              </Animated.View>
              <Text style={styles.buttonText}>Signing In...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Icon
                name="login"
                size={24}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Sign In</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword")}
        style={styles.forgotPasswordButton}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        <TouchableOpacity style={styles.socialButton}>
          <Icon name="android" size={24} color="#34A853" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Icon name="mail" size={24} color="#1877F2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Icon name="phone-android" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to ParkMaster Pro?</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={styles.registerButton}
        >
          <Text style={styles.link}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <LinearGradient
        colors={["#4F46E5", "#7C3AED", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.headerContainer}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
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
              <Text style={styles.header}>ParkMaster Pro</Text>
              <Text style={styles.subHeader}>
                Smart Solutions for Modern Parking
              </Text>
            </Animated.View>
          </View>

          <FlatList
            data={[{ key: "content" }]}
            renderItem={() => (
              <Animated.View
                style={[
                  styles.formContainer,
                  {
                    transform: [
                      { translateX: slideAnim },
                      { scale: scaleAnim },
                    ],
                    opacity: fadeAnim,
                  },
                ]}
              >
                <BlurView intensity={100} style={styles.blurContainer}>
                  {renderContent()}
                </BlurView>
              </Animated.View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyExtractor={(item) => item.key}
          />
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    height: height * 0.35,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
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
  header: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subHeader: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    marginTop: -30,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  contentContainer: {
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  input: {
    flex: 1,
    height: 60,
    fontSize: 16,
    color: "#1E293B",
    paddingHorizontal: 15,
  },
  eyeIcon: {
    padding: 12,
  },
  dropdownWrapper: {
    marginBottom: 24,
    zIndex: 3000,
  },
  dropdown: {
    borderRadius: 15,
    borderColor: "transparent",
    height: 60,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownContainer: {
    borderColor: "transparent",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownText: {
    fontSize: 16,
    color: "#1E293B",
  },
  dropdownPlaceholder: {
    color: "#94A3B8",
  },
  loginButton: {
    marginBottom: 16,
  },
  gradientButton: {
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinnerContainer: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.3)",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#64748B",
    fontSize: 16,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  forgotPasswordButton: {
    marginTop: 12,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "purple",
    fontSize: 16,
    fontWeight: "600",
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 16,
    color: "#64748B",
  },
  registerButton: {
    marginLeft: 8,
  },
  link: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "700",
  },
});

export default LoginScreen;
