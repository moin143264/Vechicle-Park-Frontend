import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../utils/axiosInstance";

const COLORS = {
  PRIMARY: "#4F46E5",
  SECONDARY: "#7C3AED",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
  BACKGROUND: "#F8FAFC",
  WHITE: "#FFFFFF",
  TEXT: {
    PRIMARY: "#1E293B",
    SECONDARY: "#64748B",
  },
  BORDER: "#E2E8F0",
  GRADIENT: {
    START: "#4F46E5",
    END: "#7C3AED",
  },
};

const ANIMATIONS = {
  FADE_IN: {
    duration: 500,
    useNativeDriver: true,
  },
  SCALE_IN: {
    duration: 300,
    useNativeDriver: true,
  },
};
const UserProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [headerHeight] = useState(
    new Animated.Value(Platform.OS === "ios" ? 120 : 100)
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        ...ANIMATIONS.FADE_IN,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session Expired", "Please login again to continue", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }

      const response = await axiosInstance.get("/user-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
    } catch (err) {
      setError(err.message || "Failed to load profile");
      Alert.alert("Error", "Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    Animated.spring(scaleAnim, {
      toValue: isEditing ? 1 : 0.98,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsEditing(!isEditing);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session Expired", "Please login again to continue", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }

      const response = await axiosInstance.put(
        "/update-profile",
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserData(response.data.user);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert("Success", "Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile");
    }
  };
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
        style={styles.loadingGradient}
      >
        <ActivityIndicator size="large" color={COLORS.WHITE} />
        <View style={styles.loadingTextContainer}>
          <Icon name="person" size={24} color={COLORS.WHITE} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderProfileHeader = () => (
    <LinearGradient
      colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
      style={styles.header}
    >
      <StatusBar
        backgroundColor={COLORS.GRADIENT.START}
        barStyle="light-content"
      />
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditToggle}
          >
            <BlurView intensity={80} style={styles.editButtonBlur}>
              <Icon name="edit" size={24} color={COLORS.WHITE} />
            </BlurView>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  const renderAvatarSection = () => (
    <View style={styles.avatarSection}>
      <LinearGradient
        colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
        style={styles.avatarContainer}
      >
        <Text style={styles.avatarText}>
          {userData?.name?.charAt(0).toUpperCase() || "?"}
        </Text>
      </LinearGradient>
      <BlurView intensity={80} style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{userData?.name || "User"}</Text>
      </BlurView>
    </View>
  );

  const renderInfoCard = () => (
    <Animated.View
      style={[
        styles.infoCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <BlurView intensity={100} style={styles.infoCardContent}>
        <View style={styles.infoHeader}>
          <LinearGradient
            colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
            style={styles.infoIconContainer}
          >
            <Icon name="person" size={24} color={COLORS.WHITE} />
          </LinearGradient>
          <Text style={styles.infoTitle}>Personal Information</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Full Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          ) : (
            <Text style={styles.value}>{userData?.name}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <Text style={styles.label}>Email Address</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{userData?.email}</Text>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderActionButtons = () =>
    isEditing && (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateProfile}
        >
          <LinearGradient
            colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
            style={styles.saveButtonGradient}
          >
            <Icon name="check" size={24} color={COLORS.WHITE} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleEditToggle}
        >
          <BlurView intensity={80} style={styles.cancelButtonBlur}>
            <Icon name="close" size={24} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </BlurView>
        </TouchableOpacity>
      </View>
    );
  const renderBottomNav = () => (
    <BlurView intensity={80} style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Home")}
      >
        <LinearGradient
          colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
          style={styles.navIconContainer}
        >
          <Icon name="home" size={24} color={COLORS.WHITE} />
        </LinearGradient>
        <Text style={styles.navText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("ScheduleAlert")}
      >
        <LinearGradient
          colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
          style={styles.navIconContainer}
        >
          <Icon name="notifications" size={24} color={COLORS.WHITE} />
        </LinearGradient>
        <Text style={styles.navText}>Alerts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("UserBooking")}
      >
        <LinearGradient
          colors={[COLORS.GRADIENT.START, COLORS.GRADIENT.END]}
          style={styles.navIconContainer}
        >
          <Icon name="event" size={24} color={COLORS.WHITE} />
        </LinearGradient>
        <Text style={styles.navText}>Bookings</Text>
      </TouchableOpacity>
    </BlurView>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  return (
    <View style={styles.container}>
      {renderProfileHeader()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.profileContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {renderAvatarSection()}
          {renderInfoCard()}
          {renderActionButtons()}
        </Animated.View>
      </ScrollView>

      {renderBottomNav()}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  editButton: {
    overflow: "hidden",
    borderRadius: 22,
  },
  editButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarText: {
    fontSize: 40,
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  welcomeContainer: {
    marginTop: 16,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.TEXT.SECONDARY,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.TEXT.PRIMARY,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoCardContent: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT.PRIMARY,
    marginLeft: 10,
  },
  infoSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 8,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: "500",
  },
  input: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelButton: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  cancelButtonBlur: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: COLORS.TEXT.SECONDARY,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: COLORS.TEXT.PRIMARY,
    marginTop: 4,
    fontWeight: "500",
  },
});

export default UserProfileScreen;
