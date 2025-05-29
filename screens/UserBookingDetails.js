import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
  Modal,
  ScrollView,
  Vibration,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Location from "expo-location";
import QRCode from "react-native-qrcode-svg";
import gmapstyle from "../utils/gmapstyle";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
const COLORS = {
  PRIMARY: "#4F46E5",
  SECONDARY: "#7C3AED",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  BACKGROUND: "#F8FAFC",
  WHITE: "#FFFFFF",
  TEXT_PRIMARY: "#1E293B",
  TEXT_SECONDARY: "#64748B",
  BORDER: "#E2E8F0",
  CARD_BG: "rgba(255, 255, 255, 0.95)",
  GRADIENT_START: "#4F46E5",
  GRADIENT_END: "#7C3AED",
};
const UserBookingDetails = ({ route, navigation }) => {
  const {
    booking,
    latitude: stationLat,
    longitude: stationLong,
    stationAdrres,
  } = route.params;
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showStationInfo, setShowStationInfo] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const [isCharging, setIsCharging] = useState(false);

  const handleQRScan = () => {
    if (isCharging) {
      Alert.alert(
        "Already Parked",
        `Vehcile Already Parked!\nBooking ID: ${booking.bookingId}\nVehicle: ${booking.VehcileDetails}`,
        [{ text: "OK", onPress: () => setShowQRCode(false) }]
      );
    } else {
      setIsCharging(true);
      Alert.alert("Parked", "Your Vehcile Is Parked!", [
        { text: "OK", onPress: () => setShowQRCode(false) },
      ]);
    }
  };
  const convertTo12Hour = (time24) => {
    if (!time24) return "N/A";
    try {
      const [hours24, minutes] = time24.split(":").map(Number);
      const period = hours24 >= 12 ? "PM" : "AM";
      const hours12 =
        hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error("Time conversion error:", error);
      return "N/A";
    }
  };
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < encoded.length) {
      let shift = 0,
        result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }
    return points;
  };

  const shareBooking = async () => {
    try {
      const shareMessage = `
🅿️ Reserved Parking Details
Station: ${booking.name}
Date: ${new Date(booking.selectedDate).toLocaleDateString()}
Time: ${booking.startTime} - ${booking.endTime}
Duration: ${booking.duration} mins
Amount: ₹${booking.totalAmount.toFixed(2)}
Location: ${stationAdrres}
Booking ID: ${booking.bookingId}
      `;

      await Share.share({
        message: shareMessage,
        title: "Reserved Parking Details",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share booking details");
    }
  };
  const getRouteFromGoogleMaps = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full`
      );

      if (!response.ok) {
        Alert.alert("Error", "Failed to fetch route");
        return;
      }

      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const points = data.routes[0].geometry;
        const decodedPoints = decodePolyline(points);

        setRouteCoordinates(decodedPoints);

        const leg = data.routes[0].legs[0];
        setDistance(`${(leg.distance / 1000).toFixed(1)} km`); // Convert to kilometers

        setDuration(`${Math.round(leg.duration / 60 + 10)} mins`); // Add 10 minutes to the estimated duration
      } else {
        Alert.alert("Error", "No route found. Please check your locations.");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      Alert.alert("Error", "Failed to fetch route. Please try again.");
    }
  };
  const startNavigation = async () => {
    setIsNavigating(true);
    setShowDirections(true);
    Vibration.vibrate(200);

    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 5000,
      },
      async (location) => {
        const newUserLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(newUserLocation);

        const destination = {
          latitude: parseFloat(stationLat),
          longitude: parseFloat(stationLong),
        };

        await getRouteFromGoogleMaps(newUserLocation, destination);

        if (checkNearCheckpoint(newUserLocation, destination)) {
          Alert.alert("Arrived!", "You have reached your destination.");
          stopNavigation();
        }

        if (mapRef.current) {
          mapRef.current.animateCamera(
            {
              center: newUserLocation,
              pitch: 45,
              heading: calculateBearing(newUserLocation, destination),
              altitude: 1000,
              zoom: 17,
            },
            { duration: 1000 }
          );
        }
      }
    );
  };

  const stopNavigation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setIsNavigating(false);
    Vibration.vibrate(200);

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: userLocation,
        pitch: 0,
        heading: 0,
        altitude: 0,
        zoom: 15,
      });
    }
  };

  const StationInfoModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showStationInfo}
      onRequestClose={() => setShowStationInfo(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Station Information</Text>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Booking Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking ID:</Text>
                <Text style={styles.infoValue}>{booking.bookingId}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time Slot:</Text>
                <Text style={styles.infoValue}>
                  {convertTo12Hour(booking.startTime)} -{" "}
                  {convertTo12Hour(booking.endTime)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{booking.duration} Hour</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Navigation</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance:</Text>
                <Text style={styles.infoValue}>{distance}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Est. Duration:</Text>
                <Text style={styles.infoValue}>{duration}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Payment</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount:</Text>
                <Text style={styles.infoValue}>
                  ₹{booking.totalAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color:
                        booking.paymentStatus === "Paid"
                          ? "#4CAF50"
                          : "#f44336",
                    },
                  ]}
                >
                  {booking.paymentStatus}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.shareButton]}
              onPress={shareBooking}
            >
              <Icon name="share" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowStationInfo(false)}
            >
              <Icon name="close" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const QRCodeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showQRCode}
      onRequestClose={() => setShowQRCode(false)}
    >
      <View style={styles.modalContainer}>
        <BlurView intensity={100} style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isCharging ? "Parking in Progress" : "Scan to Start Parking"}
          </Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({
                bookingId: booking.bookingId,
                numberPlate: booking.VehcileDetails,
              })}
              size={200}
              color={COLORS.TEXT_PRIMARY}
              backgroundColor={COLORS.WHITE}
              onPress={handleQRScan}
            />
          </View>

          <TouchableOpacity style={styles.scanButton} onPress={handleQRScan}>
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK]}
              style={styles.scanButtonGradient}
            >
              <Icon name="qr-code-scanner" size={20} color={COLORS.WHITE} />
              <Text style={styles.scanButtonText}>
                {isCharging ? "Check Status" : "Simulate Scan"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeQRButton}
            onPress={() => setShowQRCode(false)}
          >
            <LinearGradient
              colors={[COLORS.ERROR, "#ff6b6b"]}
              style={styles.closeQRButtonGradient}
            >
              <Icon name="close" size={20} color={COLORS.WHITE} />
              <Text style={styles.closeQRButtonText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert("Permission to access location was denied");
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(userLoc);

        const destination = {
          latitude: parseFloat(stationLat),
          longitude: parseFloat(stationLong),
        };

        await getRouteFromGoogleMaps(userLoc, destination);
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "Failed to get location");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [stationLat, stationLong]);

  const handleGetDirections = async () => {
    setShowDirections(!showDirections);

    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          userLocation,
          {
            latitude: parseFloat(stationLat),
            longitude: parseFloat(stationLong),
          },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  };

  const calculateBearing = (start, end) => {
    const startLat = (start.latitude * Math.PI) / 180;
    const startLng = (start.longitude * Math.PI) / 180;
    const endLat = (end.latitude * Math.PI) / 180;
    const endLng = (end.longitude * Math.PI) / 180;

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    if (bearing < 0) bearing += 360;
    return bearing;
  };

  const checkNearCheckpoint = (userLoc, checkpoint, threshold = 0.05) => {
    const R = 6371;
    const dLat = ((checkpoint.latitude - userLoc.latitude) * Math.PI) / 180;
    const dLon = ((checkpoint.longitude - userLoc.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLoc.latitude * Math.PI) / 180) *
        Math.cos((checkpoint.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= threshold;
  };

  if (loading || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Station Directions</Text>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={gmapstyle}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        followsUserLocation={isNavigating}
        showsCompass={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={userLocation}
          title="Your Location"
          description="You are here"
        >
          <View style={styles.userMarker}>
            <Icon name="person-pin-circle" size={30} color="#4CAF50" />
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: parseFloat(stationLat),
            longitude: parseFloat(stationLong),
          }}
          title={booking.stationName}
          description={stationAdrres}
        >
          <View style={styles.stationMarker}>
            <MaterialCommunityIcons name="parking" size={34} color="purple" />
          </View>
        </Marker>

        {showDirections && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor="#FF0000"
          />
        )}
      </MapView>

      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.stationName}>{booking.stationName}</Text>
            <Text style={styles.address} numberOfLines={1}>
              {stationAdrres}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowQRCode(true)}
            >
              <Icon name="qr-code" size={20} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowStationInfo(true)}
            >
              <Icon name="info" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Icon name="directions-car" size={18} color="#4CAF50" />
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailText}>{distance}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Icon name="access-time" size={18} color="#4CAF50" />
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailText}>{duration} To Reach</Text>
            </View>
          </View>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                showDirections && styles.actionButtonActive,
                { marginRight: 4 },
              ]}
              onPress={handleGetDirections}
            >
              <Icon name="directions" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>
                {showDirections ? "Hide" : "Route"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.navigationActionButton,
                isNavigating && styles.navigationButtonActive,
                { marginHorizontal: 4 },
              ]}
              onPress={isNavigating ? stopNavigation : startNavigation}
            >
              <Icon
                name={isNavigating ? "stop" : "navigation"}
                size={16}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>
                {isNavigating ? "Stop" : "Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.shareActionButton,
                { marginLeft: 4 },
              ]}
              onPress={shareBooking}
            >
              <Icon name="share" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {StationInfoModal()}
      {QRCodeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "BACKGROUND",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6A0DAD",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    marginBottom: 20,
  },
  closeQRButton: {
    width: "100%",
    marginTop: 10,
  },
  closeQRButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  closeQRButtonText: {
    color: COLORS.WHITE,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  shareButton: {
    backgroundColor: "#4CAF50",
  },
  closeButton: {
    backgroundColor: "#f44336",
  },
  modalButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2c3e50",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  address: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  headerRight: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#f5f9f7",
    borderRadius: 8,
    marginLeft: 8,
  },
  detailsContainer: {
    backgroundColor: "#f8faf9",
    borderRadius: 12,
    padding: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  actionButtonActive: {
    backgroundColor: "#388E3C",
  },
  navigationActionButton: {
    backgroundColor: "#2196F3",
  },
  navigationButtonActive: {
    backgroundColor: "#1976D2",
  },
  shareActionButton: {
    backgroundColor: "#9C27B0",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4CAF50",
  },
  userMarker: {
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  stationMarker: {
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  scanButton: {
    width: "100%",
    marginBottom: 10,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: COLORS.WHITE,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UserBookingDetails;
