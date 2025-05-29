import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import axiosInstance from "../utils/axiosInstance";

const { width, height } = Dimensions.get("window");

const COLORS = {
  PRIMARY: "#4F46E5",
  SECONDARY: "#7C3AED",
  ACCENT: "#2563EB",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
  WARNING: "#F59E0B",
  TEXT_PRIMARY: "#1E293B",
  TEXT_SECONDARY: "#64748B",
  BACKGROUND: "#F8FAFC",
  WHITE: "#FFFFFF",
  CARD_BG: "rgba(255, 255, 255, 0.9)",
  INPUT_BG: "rgba(255, 255, 255, 0.8)",
  BORDER: "#E2E8F0",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const notificationListener = useRef();
  const responseListener = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setupNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (!Device.isDevice) {
      token =
        "emulator-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(7);
      return { token, isEmulator: true };
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return {
          token: null,
          isEmulator: false,
          error: "Permission not granted",
        };
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "4b8f9e5a-3a4f-4f3e-8d8d-1a7f6e2b3c4d",
        })
      ).data;
    } catch (error) {
      token =
        "device-fallback-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(7);
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return { token, isEmulator: false };
  };

  const setupNotifications = async () => {
    try {
      const { token, isEmulator } = await registerForPushNotificationsAsync();
      setPushToken(token);

      const deviceDetails = {
        deviceType: Platform.OS,
        isEmulator,
        deviceName: (await Device.deviceName) || "unknown",
        deviceId: Device.deviceName + "-" + Date.now(),
      };

      setDeviceInfo(deviceDetails);

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
        });
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const startOtpTimer = () => {
    setOtpTimer(30);
    const interval = setInterval(() => {
      setOtpTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/send-otp", { email });
      setIsOtpSent(true);
      startOtpTimer();
      Alert.alert("Success", "OTP has been sent to your email");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/verify-otp", { email, otp });
      if (response.data.success) {
        await handleRegister();
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to verify OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const registrationData = {
        name,
        email,
        password,
        pushToken,
        deviceInfo: {
          ...deviceInfo,
          lastUpdated: new Date(),
        },
      };

      const response = await axiosInstance.post("/register", registrationData);

      await AsyncStorage.multiSet([
        ["name", name],
        ["email", email],
        ["pushToken", pushToken || ""],
        ["deviceInfo", JSON.stringify(deviceInfo)],
      ]);

      Alert.alert(
        "Success",
        "Registration successful! Please login to continue.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.innerContainer}>
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
                  <MaterialIcons
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
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <BlurView intensity={100} style={styles.formBlur}>
                <View style={styles.inputSection}>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                      style={styles.iconContainer}
                    >
                      <MaterialIcons
                        name="person"
                        size={24}
                        color={COLORS.WHITE}
                      />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor={COLORS.TEXT_SECONDARY}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                      style={styles.iconContainer}
                    >
                      <MaterialIcons
                        name="email"
                        size={24}
                        color={COLORS.WHITE}
                      />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={COLORS.TEXT_SECONDARY}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                      style={styles.iconContainer}
                    >
                      <MaterialIcons
                        name="lock"
                        size={24}
                        color={COLORS.WHITE}
                      />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      secureTextEntry={!passwordVisible}
                      value={password}
                      onChangeText={setPassword}
                      placeholderTextColor={COLORS.TEXT_SECONDARY}
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      style={styles.eyeIcon}
                    >
                      <MaterialIcons
                        name={passwordVisible ? "visibility" : "visibility-off"}
                        size={24}
                        color={COLORS.TEXT_SECONDARY}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                      style={styles.iconContainer}
                    >
                      <MaterialIcons
                        name="lock"
                        size={24}
                        color={COLORS.WHITE}
                      />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      secureTextEntry={!confirmPasswordVisible}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholderTextColor={COLORS.TEXT_SECONDARY}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      style={styles.eyeIcon}
                    >
                      <MaterialIcons
                        name={
                          confirmPasswordVisible
                            ? "visibility"
                            : "visibility-off"
                        }
                        size={24}
                        color={COLORS.TEXT_SECONDARY}
                      />
                    </TouchableOpacity>
                  </View>
                  {isOtpSent ? (
                    <>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons
                          name="numeric"
                          size={24}
                          color={COLORS.WHITE}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter OTP"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                          placeholderTextColor={COLORS.TEXT_SECONDARY}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.registerButton}
                        onPress={verifyOtp}
                        disabled={isLoading}
                      >
                        <LinearGradient
                          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                          style={styles.buttonGradient}
                        >
                          {isLoading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator color={COLORS.WHITE} />
                              <Text style={styles.buttonText}>
                                Verifying OTP...
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.buttonText}>Verify OTP</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={sendOtp}
                      disabled={isLoading || otpTimer > 0}
                    >
                      <LinearGradient
                        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                        style={styles.buttonGradient}
                      >
                        {isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color={COLORS.WHITE} />
                            <Text style={styles.buttonText}>
                              Sending OTP...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.buttonText}>
                            {otpTimer > 0
                              ? `Resend OTP in ${otpTimer}s`
                              : "Send OTP"}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>
                      Already have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Login")}
                    >
                      <Text style={styles.link}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
  },
  headerContainer: {
    width: "100%",
    height: height * 0.35,
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerIcon: {
    shadowColor: COLORS.WHITE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.WHITE,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subHeader: {
    fontSize: 16,
    color: COLORS.WHITE,
    opacity: 0.9,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  formContainer: {
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    backgroundColor: COLORS.WHITE,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  formBlur: {
    padding: 20,
  },
  inputSection: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 12,
  },
  eyeIcon: {
    padding: 12,
  },
  registerButton: {
    height: 56,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 16,
    elevation: 4,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.BORDER,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  link: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "700",
    marginLeft: 8,
  },
  testButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  testButtonGradient: {
    padding: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "600",
  },
  inputIcon: {
    padding: 12,
    backgroundColor: COLORS.PRIMARY,
  },
});

export default RegisterScreen;
