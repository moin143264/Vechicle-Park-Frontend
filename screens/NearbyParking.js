import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import axios from "axios";

const { width } = Dimensions.get("window");

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
};

const NearbyParking = ({ route }) => {
  const { latitude, longitude, userEmail } = route.params;
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

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

    const currentDate = new Date().toISOString().split("T")[0];
    fetchParkingSpaces(currentDate);
  }, [latitude, longitude]);

  const fetchParkingSpaces = async () => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const response = await axios.get(
        "https://vehicles-tau.vercel.app/parking",
        {
          params: {
            latitude,
            longitude,
            date: currentDate,
          },
        }
      );
      setParkingSpaces(response.data);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch parking spaces. Please try again.",
        [{ text: "OK" }]
      );
      console.error("Error fetching parking spaces:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const renderVehicleSlots = (vehicleSlots) => {
    const pairs = [];
    for (let i = 0; i < vehicleSlots.length; i += 2) {
      pairs.push(vehicleSlots.slice(i, i + 2));
    }

    return (
      <View style={styles.vehicleSlotsContainer}>
        {pairs.map((pair, pairIndex) => (
          <View key={pairIndex} style={styles.slotRow}>
            {pair.map((slot, index) => (
              <View key={index} style={styles.slotItem}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.8)"]}
                  style={styles.slotGradient}
                >
                  <View style={styles.slotHeader}>
                    <View style={styles.vehicleTypeContainer}>
                      <LinearGradient
                        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                        style={styles.iconContainer}
                      >
                        <Icon
                          name={getVehicleIcon(slot.vehicleType)}
                          size={20}
                          color={COLORS.WHITE}
                        />
                      </LinearGradient>
                      <Text style={styles.vehicleType}>{slot.vehicleType}</Text>
                    </View>
                  </View>
                  <View style={styles.slotInfo}>
                    <Text style={styles.priceText}>
                      ₹{slot.pricePerHour}/hr
                    </Text>
                    <LinearGradient
                      colors={
                        slot.availableSlots === 0
                          ? [COLORS.ERROR, "#DC2626"]
                          : [COLORS.SUCCESS, "#059669"]
                      }
                      style={styles.slotStatus}
                    >
                      <Text style={styles.availabilityText}>
                        {slot.availableSlots}/{slot.totalSlots}
                      </Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.dimensionsText}>
                    {slot.dimensions.length}×{slot.dimensions.width}×
                    {slot.dimensions.height}m
                  </Text>
                </LinearGradient>
              </View>
            ))}
            {pair.length === 1 && <View style={styles.emptySlot} />}
          </View>
        ))}
      </View>
    );
  };

  const getVehicleIcon = (type) => {
    switch (type.toLowerCase()) {
      case "car":
        return "directions-car";
      case "motorcycle":
        return "two-wheeler";
      case "bus":
        return "directions-bus";
      case "truck":
        return "local-shipping";
      case "bicycle":
        return "pedal-bike";
      case "van":
        return "airport-shuttle";
      default:
        return "local-parking";
    }
  };

  const handleBook = (parkingSpace) => {
    navigation.navigate("BookingScreen", {
      parkingSpace,
      parkingLatitude: parkingSpace.latitude,
      parkingLongitude: parkingSpace.longitude,
      userEmail,
    });
  };

  const renderParkingCard = (parkingSpace, index) => {
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.parkingCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY }, { scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.8)"]}
          style={styles.cardGradient}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.parkingName}>{parkingSpace.name}</Text>
            <LinearGradient
              colors={
                parkingSpace.type === "Covered"
                  ? ["#F59E0B", "#D97706"]
                  : parkingSpace.type === "Underground"
                  ? [COLORS.SECONDARY, "#6D28D9"]
                  : [COLORS.SUCCESS, "#059669"]
              }
              style={styles.typeBadge}
            >
              <Text style={styles.typeText}>{parkingSpace.type}</Text>
            </LinearGradient>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.infoValue}>{parkingSpace.address}</Text>
            </View>

            <View style={styles.capacityContainer}>
              <Text style={styles.capacityTitle}>
                <Icon name="local-parking" size={18} color={COLORS.PRIMARY} />{" "}
                Available Slots
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (parkingSpace.totalAvailableSlots /
                          parkingSpace.totalCapacity) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.capacityText}>
                {parkingSpace.totalAvailableSlots} of{" "}
                {parkingSpace.totalCapacity}
              </Text>
            </View>

            {renderVehicleSlots(parkingSpace.vehicleSlots)}

            {parkingSpace.facilities && parkingSpace.facilities.length > 0 && (
              <View style={styles.facilitiesContainer}>
                <Text style={styles.facilitiesTitle}>
                  <Icon name="star" size={18} color={COLORS.PRIMARY} />{" "}
                  Facilities
                </Text>
                <View style={styles.facilitiesGrid}>
                  {parkingSpace.facilities.map((facility, idx) => (
                    <LinearGradient
                      key={idx}
                      colors={[
                        "rgba(79, 70, 229, 0.1)",
                        "rgba(124, 58, 237, 0.1)",
                      ]}
                      style={styles.facilityTag}
                    >
                      <Text style={styles.facilityText}>{facility}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => handleBook(parkingSpace)}
              disabled={!parkingSpace.isOpen}
            >
              <LinearGradient
                colors={
                  parkingSpace.isOpen
                    ? [COLORS.PRIMARY, COLORS.SECONDARY]
                    : ["#9CA3AF", "#6B7280"]
                }
                style={styles.bookButtonGradient}
              >
                <Text style={styles.bookButtonText}>
                  {parkingSpace.isOpen ? "Book Now" : "Currently Closed"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.loadingText}>
            Finding nearby parking spaces...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <BlurView intensity={20} style={styles.headerBlur}>
          <Text style={styles.title}>Nearby Parking</Text>
          <Text style={styles.subtitle}>
            {parkingSpaces.length} spaces found
          </Text>
        </BlurView>
      </LinearGradient>

      {parkingSpaces.length > 0 ? (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {parkingSpaces.map((parkingSpace, index) =>
            renderParkingCard(parkingSpace, index)
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["rgba(79, 70, 229, 0.1)", "rgba(124, 58, 237, 0.1)"]}
            style={styles.emptyGradient}
          >
            <Icon name="local-parking" size={64} color={COLORS.PRIMARY} />
            <Text style={styles.emptyText}>No parking spaces found nearby</Text>
            <Text style={styles.emptySubtext}>
              Try expanding your search area
            </Text>
          </LinearGradient>
        </View>
      )}

      <BlurView intensity={80} style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Home</Text>
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
          onPress={() => navigation.navigate("ScheduleAlert")}
        >
          <Icon name="notifications" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navButton, styles.activeNavButton]}>
          <Icon name="local-parking" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.activeNavText}>Parking</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    overflow: "hidden",
  },
  headerBlur: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  parkingCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    backgroundColor: COLORS.WHITE,
  },
  cardGradient: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  parkingName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
    fontWeight: "500",
  },
  capacityContainer: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  capacityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(79, 70, 229, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  vehicleSlotsContainer: {
    gap: 8,
  },
  slotRow: {
    flexDirection: "row",
    gap: 8,
  },
  slotItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  slotGradient: {
    padding: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  vehicleTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleType: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  slotInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  slotStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  priceText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  dimensionsText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  facilitiesContainer: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  facilitiesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  facilityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  facilityText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: "500",
  },
  bookButton: {
    overflow: "hidden",
    borderRadius: 12,
    marginTop: 8,
  },
  bookButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  bookButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.5)",
  },
  navButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavButton: {
    borderTopWidth: 2,
    borderTopColor: COLORS.PRIMARY,
  },
  navText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  activeNavText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: "600",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.WHITE,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: "center",
  },
});

export default NearbyParking;
