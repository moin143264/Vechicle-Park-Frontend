import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { checkToken } from "../utils/tokenUtils"; // Import your utility functions

const StartPage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status

  useEffect(() => {
    const checkUserToken = async () => {
      await checkToken(setIsLoggedIn, setLoading); // Pass setLoading to manage loading state
    };
    checkUserToken();
  }, []);

  const handleGetStarted = () => {
    // Redirect to Home if logged in, otherwise to Login
    if (isLoggedIn) {
      navigation.replace("Home");
    } else {
      navigation.replace("Login");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/start.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.title}>Park Master PRo</Text>
        <Text style={styles.subtitle}>Park Your Vehicle with Ease</Text>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted} // Call the function on button press
        >
          <Icon name="bolt" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Park Here</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.7,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
});

export default StartPage;
