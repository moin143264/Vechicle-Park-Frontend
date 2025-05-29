import { enableScreens } from "react-native-screens";
enableScreens();
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Platform,
  ActivityIndicator,
  View,
  Image,
  Text,
} from "react-native";
import { UserProvider, useUser } from "./UserContext";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import axios from "axios";
import { StationsProvider } from "./StationsContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { checkToken } from "./utils/tokenUtils";

// Screens imports
import UserProfileScreen from "./screens/UserProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import AdminPanel from "./screens/AdminPanel";
import ManageUsers from "./screens/ManageUsers";
import AddParkingSpaceScreen from "./screens/AddParkingSpaceScreen";
import ManageParkingSpacesScreen from "./screens/ManageParkingSpacesScreen";
import ParkingSpaceList from "./screens/ParkingSpaceList";
import NearbyParking from "./screens/NearbyParking";
import BookingScreen from "./screens/BookingScreen";
import PaymentScreen from "./screens/PaymentScreen";
import UserBookings from "./screens/UserBookings";
import UserBookingDetails from "./screens/UserBookingDetails";
import ScheduleAlert from "./screens/ScheduleAlert";
import PaymentManagementScreen from "./screens/PaymentManagementScreen ";
import ManageParking from "./screens/ManageParking";
import PenaltyPayment from "./screens/PenaltyPayment";
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";
const Stack = createStackNavigator();
// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Image
      source={require("./assets/hell.png")} // Adjust the path to your image
      style={styles.image}
    />
    <ActivityIndicator size="large" color="blue" />
    <Text style={styles.loadingText}>Loading, please wait...</Text>
  </View>
);

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c4bfb6", // Set background color to white
  },
  image: {
    width: 150, // Increased width
    height: 150, // Increased height
    marginBottom: 20, // Space between image and loading indicator
  },
  loadingText: {
    fontSize: 18,
    color: "blue",
  },
};
const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useRef();
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      await checkToken(setInitialRoute);
      const token = await registerForPushNotificationsAsync();
      console.log("Push Token:", token);
      alert(token);

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const { data } = response.notification.request.content;
          handleNotificationResponse(data);
        });
    };

    initializeApp();

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle notification response
  const handleNotificationResponse = (data) => {
    if (data?.type === "booking" && data?.bookingId) {
      navigationRef.current?.navigate("UserBookingDetails", {
        bookingId: data.bookingId,
      });
    }
  };

  // Register for push notifications
  async function registerForPushNotificationsAsync() {
    let token;

    if (!Device.isDevice) {
      // Return a dummy token for emulators
      return "emulator-" + Math.random().toString(36).substring(7);
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Push notifications are required for important updates. Please enable them in your settings."
      );
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    // Store the token in your backend or context
    async function sendTokenToBackend(token) {
      try {
        const response = await fetch(
          "https://vehicles-tau.vercel.app/api/push-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }), // Send only the token
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log("Token sent successfully:", data);
      } catch (error) {
        console.error("Error sending token to backend:", error);
        throw error; // Re-throw the error to handle it in the calling function
      }
    }
    await sendTokenToBackend(token); // Call the function here

    // Configure Android channel if needed
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  if (initialRoute === null) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StripeProvider publishableKey="pk_test_51Q8uua07CIuzAORvOPkNphnVDvfztI3AGlwMeVXceeQZrHsnAEvF0wOzvTvqLylyZTZ1puQVzotwQOIbFABkAoRS00BR5GdjVN">
          <UserProvider>
            <Stack.Navigator initialRouteName={initialRoute}>
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AdminPanel"
                component={AdminPanel}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ManageUsers"
                component={ManageUsers}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AddParkingSpaceScreen"
                component={AddParkingSpaceScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ManageParkingSpacesScreen"
                component={ManageParkingSpacesScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ParkingSpaceList"
                component={ParkingSpaceList}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Nearby"
                component={NearbyParking}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="BookingScreen"
                component={BookingScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PaymentScreen"
                component={PaymentScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="UserBooking"
                component={UserBookings}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="UserBookingDetails"
                component={UserBookingDetails}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ScheduleAlert"
                component={ScheduleAlert}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ManagePayment"
                component={PaymentManagementScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPassword}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ManageParking"
                component={ManageParking}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PenaltyPayment"
                component={PenaltyPayment}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </UserProvider>
        </StripeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
