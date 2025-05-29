import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import polyline from "@mapbox/polyline"; // Import polyline decoderimport MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import axiosInstance from "../utils/axiosInstance";
import Icon from "react-native-vector-icons/MaterialIcons"; // Ensure this matches the icon library you're using
import gmapstyle from "../utils/gmapstyle.json";
const { width, height } = Dimensions.get("window");

const COLORS = {
  PRIMARY: "#4F46E5",
  SECONDARY: "#7C3AED",
  ACCENT: "#2563EB",
  TEXT_PRIMARY: "#1E293B",
  TEXT_SECONDARY: "#64748B",
  BACKGROUND: "#F8FAFC",
  WHITE: "#FFFFFF",
  ERROR: "#EF4444",
};

const MIN_ZOOM_DELTA = 0.0001;
const MAX_ZOOM_DELTA = 0.05;
const ZOOM_FACTOR = 0.5;

const customMapStyle = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ visibility: "on" }],
  },
];

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [region, setRegion] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.005);
  const [loading, setLoading] = useState(true);
  const [isUserZooming, setIsUserZooming] = useState(false);
  const [selectedParkingSpace, setSelectedParkingSpace] = useState(null);
  const [route, setRoute] = useState(null);
  // Stations state
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState(null);
  const [parkingSpaces, setParkingSpaces] = useState([]);

  // Refs for map and animations
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const fetchRoute = async (startCoords, endCoords) => {
    try {
      const response = await axios.get(
        `http://router.project-osrm.org/route/v1/driving/${startCoords.longitude},${startCoords.latitude};${endCoords.longitude},${endCoords.latitude}?geometries=geojson`
      );
      setRoute(response.data.routes[0].geometry.coordinates);
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Create this function to fetch parking spaces
  const fetchParkingSpaces = async () => {
    try {
      const response = await axiosInstance.get(
        "https://vehicles-tau.vercel.app/parking-spaces"
      );
      setParkingSpaces(response.data);
      console.log("Fetched parking spaces:", response.data);
    } catch (error) {
      console.error("Error fetching parking spaces:", error);
    }
  };

  const fetchUserEmail = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }

      const response = await axiosInstance.get("/user-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserEmail(response.data.email);
      console.log("Logged-in user email:", response.data.email);
    } catch (error) {
      console.error("Error fetching user email:", error);
    }
  };
  useEffect(() => {
    const initializeApp = async () => {
      // Animate header and content
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

      try {
        const storedUserName = await AsyncStorage.getItem("name");
        setUserName(storedUserName || "User");
      } catch (error) {
        console.error("Error fetching name:", error);
      }

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert("Permission Denied", "Location access is required.");
        }
      } else {
        setHasPermission(true);
      }

      await fetchUserEmail();
      await fetchParkingSpaces();
    };

    initializeApp();
  }, [fadeAnim, slideAnim, scaleAnim]);

  useEffect(() => {
    const fetchLocation = async () => {
      if (hasPermission) {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setErrorMsg("Permission to access location was denied");
            return;
          }

          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const { latitude, longitude } = location.coords;
          const initialRegion = {
            latitude,
            longitude,
            latitudeDelta: zoomLevel,
            longitudeDelta: zoomLevel,
          };
          setRegion(initialRegion);
          mapRef.current?.animateToRegion(initialRegion, 1000);
        } catch (error) {
          console.error("Error getting location:", error);
          setErrorMsg("Failed to get location");
        } finally {
          setLoading(false);
        }
      }
    };

    if (hasPermission) {
      fetchLocation();
    }
  }, [hasPermission]);

  const handleZoomIn = () => {
    if (region) {
      setIsUserZooming(true);
      const newZoomLevel = Math.max(zoomLevel * ZOOM_FACTOR, MIN_ZOOM_DELTA);
      setZoomLevel(newZoomLevel);
      mapRef.current?.animateToRegion(
        {
          ...region,
          latitudeDelta: newZoomLevel,
          longitudeDelta: newZoomLevel,
        },
        300
      );
      setTimeout(() => setIsUserZooming(false), 1000);
    }
  };

  const handleZoomOut = () => {
    if (region) {
      setIsUserZooming(true);
      const newZoomLevel = Math.min(zoomLevel / ZOOM_FACTOR, MAX_ZOOM_DELTA);
      setZoomLevel(newZoomLevel);
      mapRef.current?.animateToRegion(
        {
          ...region,
          latitudeDelta: newZoomLevel,
          longitudeDelta: newZoomLevel,
        },
        300
      );
      setTimeout(() => setIsUserZooming(false), 1000);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "name"]);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };
  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <Animated.View
        style={[
          styles.headerContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => navigation.navigate("UserProfile")}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            style={styles.avatarContainer}
          >
            <Text style={styles.avatarText}>
              {userName?.charAt(0).toUpperCase() || "U"}
            </Text>
          </LinearGradient>
          <View style={styles.userTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
            style={styles.logoutGradient}
          >
            <Icon name="logout" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />

      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY, COLORS.ACCENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {renderHeader()}

        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <BlurView intensity={100} style={styles.blurContainer}>
            <View style={styles.mapContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                  <Text style={styles.loadingText}>
                    Finding your location...
                  </Text>
                </View>
              ) : region ? (
                <>
                  <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={region}
                    customMapStyle={gmapstyle}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    showsCompass={true}
                    onRegionChangeComplete={(newRegion) => {
                      if (!isUserZooming) {
                        setRegion(newRegion);
                        setZoomLevel(newRegion.latitudeDelta);
                      }
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: region.latitude,
                        longitude: region.longitude,
                      }}
                      title="Your Location"
                    >
                      <View style={styles.markerContainer}>
                        <LinearGradient
                          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                          style={styles.markerGradient}
                        >
                          <MaterialIcons
                            name="electric-car"
                            size={20}
                            color="white"
                          />
                        </LinearGradient>
                      </View>
                    </Marker>

                    {parkingSpaces.map((space) => (
                      <Marker
                        key={space._id}
                        coordinate={{
                          latitude: space.latitude,
                          longitude: space.longitude,
                        }}
                        title={space.name}
                        description={`Addres:${space.address}`}
                      >
                        <View style={styles.stationMarkerContainer}>
                          <LinearGradient
                            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                            style={styles.stationMarkerGradient}
                          >
                            <Icon
                              name="local-parking"
                              size={20}
                              color="#FFFFFF"
                            />
                          </LinearGradient>
                        </View>
                      </Marker>
                    ))}
                  </MapView>
                  <View style={styles.zoomControls}>
                    <TouchableOpacity
                      style={[styles.zoomButton, styles.zoomInButton]}
                      onPress={handleZoomIn}
                    >
                      <LinearGradient
                        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                        style={styles.zoomGradient}
                      >
                        <Icon name="add" size={24} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.zoomLevelIndicator}>
                      <Text style={styles.zoomLevelText}>
                        {`${Math.round(
                          (1 - zoomLevel / MAX_ZOOM_DELTA) * 100
                        )}%`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.zoomButton}
                      onPress={handleZoomOut}
                    >
                      <LinearGradient
                        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                        style={styles.zoomGradient}
                      >
                        <Icon name="remove" size={24} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.errorContainer}>
                  <Icon name="error-outline" size={48} color={COLORS.ERROR} />
                  <Text style={styles.errorText}>
                    {errorMsg || "Failed to load map"}
                  </Text>
                </View>
              )}
            </View>
          </BlurView>
        </Animated.View>

        <BlurView intensity={100} style={styles.bottomNav}>
          {/* Navigation Buttons */}
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonActive]}
            onPress={() => navigation.navigate("Home")}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
              style={styles.navButtonGradient}
            >
              <Icon name="home" size={24} color="#FFFFFF" />
              <Text style={styles.navTextActive}>Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("ScheduleAlert")}
          >
            <Icon
              name="notifications"
              size={24}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={styles.navText}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("UserBooking")}
          >
            <Icon name="event" size={24} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.navText}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              navigation.navigate("Nearby", {
                latitude: region?.latitude,
                longitude: region?.longitude,
                userEmail: userEmail,
              })
            }
          >
            <Icon name="directions" size={24} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.navText}>Space</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("ManageParking")}
          >
            <Icon
              name="local-parking"
              size={24}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={styles.navText}>Manage</Text>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  logoutButton: {
    overflow: "hidden",
    borderRadius: 12,
  },
  logoutGradient: {
    padding: 12,
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.WHITE,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.ERROR,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerGradient: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  stationMarkerContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  stationMarkerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    borderRadius: 20,
  },
  stationMarkerText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  zoomControls: {
    position: "absolute",
    right: 16,
    bottom: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.WHITE,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomButton: {
    overflow: "hidden",
  },
  zoomGradient: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomInButton: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  zoomLevelIndicator: {
    padding: 8,
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
  },
  zoomLevelText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "space-between",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  navButtonActive: {
    overflow: "hidden",
  },
  navButtonGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  navTextActive: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  stationsLoadingContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 10,
    borderRadius: 20,
  },
  stationsLoadingText: {
    marginLeft: 10,
    color: "#FF5722",
  },
  stationsErrorContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,82,82,0.1)",
    padding: 10,
    borderRadius: 20,
  },
  stationsErrorText: {
    marginLeft: 10,
    color: "#FF5252",
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#FF5252",
    padding: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default HomeScreen;
