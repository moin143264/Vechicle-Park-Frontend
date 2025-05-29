import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import { BlurView } from "expo-blur";
import { useUserContext } from "../UserContext"; // Make sure path is correct

const { width, height } = Dimensions.get("window");

const PENALTY_RATES = {
  car: 25,
  motorcycle: 15,
  bus: 50,
  truck: 45,
  bicycle: 10,
  van: 35,
};

const COLORS = {
  PRIMARY: "#4F46E5",
  SECONDARY: "#7C3AED",
  ACCENT: "#2563EB",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  TEXT_PRIMARY: "#1E293B",
  TEXT_SECONDARY: "#64748B",
  BACKGROUND: "#F8FAFC",
  WHITE: "#FFFFFF",
  BORDER: "#E2E8F0",
};
const ManageParking = ({ route }) => {
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { userId, token } = useUserContext();

  const fetchBookings = async () => {
    if (!userId) {
      console.log("No userId available");
      return;
    }

    try {
      setRefreshing(true);
      console.log("Fetching bookings for userId:", userId); // Debug log

      const response = await axios.get(
        `https://vehicles-tau.vercel.app/active-bookings/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setBookings(response.data);
    } catch (error) {
      console.error("Fetch error:", {
        message: error.message,
        response: error.response?.data,
        userId: userId,
      });
      Alert.alert("Error", "Failed to fetch bookings");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      Alert.alert("Error", "Please log in to view your bookings");
      return;
    }

    fetchBookings();
    const interval = setInterval(fetchBookings, 60000);

    const unsubscribe = navigation.addListener("focus", () => {
      if (route.params?.refresh) {
        fetchBookings();
        navigation.setParams({ refresh: undefined });
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [userId, navigation, route.params?.refresh]);
  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours24, minutes] = time24.split(":").map(Number);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };
  const calculateStatus = (booking) => {
    const now = new Date();
    const endTime = new Date(booking.bookingDate + " " + booking.endTime);
    const graceEndTime = new Date(endTime.getTime() + 15 * 60000);

    if (booking.parkingStatus === "unparked") {
      return "CHECKED OUT";
    } else if (now > graceEndTime) {
      return "OVERSTAYED";
    } else if (now > endTime) {
      return "IN GRACE PERIOD";
    }
    return "ACTIVE";
  };

  const calculateOvertimeCharges = (booking) => {
    const now = new Date();
    const endTime = new Date(booking.bookingDate + " " + booking.endTime);
    const graceEndTime = new Date(endTime.getTime() + 15 * 60000);

    if (now > graceEndTime) {
      const overtimeMinutes = Math.ceil((now - graceEndTime) / (1000 * 60));
      const overtimeHours = Math.ceil(overtimeMinutes / 60);
      const vehicleType = booking.vehicleType.toLowerCase();
      const penaltyRate = PENALTY_RATES[vehicleType] || 25;

      return overtimeHours * penaltyRate;
    }
    return 0;
  };

  const handleCheckout = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b._id === bookingId);
      const overtimeCharges = calculateOvertimeCharges(booking);

      if (overtimeCharges > 0) {
        const response = await axios.post(
          "https://vehicles-tau.vercel.app/create-payment-intent",
          {
            amount: overtimeCharges,
          }
        );

        navigation.navigate("PenaltyPayment", {
          clientSecret: response.data.clientSecret,
          bookingId: bookingId,
          amount: overtimeCharges,
        });
      } else {
        const response = await axios.post(
          `https://vehicles-tau.vercel.app/checkout/${bookingId}`
        );
        Alert.alert("Success", "Vehicle checked out successfully");
        fetchBookings();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to checkout vehicle"
      );
    }
  };
  const renderBookingCard = (booking) => {
    const status = calculateStatus(booking);
    const overtimeCharges = calculateOvertimeCharges(booking);
    const isOverstayed = status === "OVERSTAYED";

    return (
      <View key={booking._id} style={styles.bookingCard}>
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.95)"]}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.vehicleNumber}>{booking.numberPlate}</Text>
            <View
              style={[
                styles.statusBadge,
                isOverstayed
                  ? styles.overstayedBadge
                  : status === "IN GRACE PERIOD"
                  ? styles.graceBadge
                  : status === "CHECKED OUT"
                  ? styles.checkedOutBadge
                  : styles.activeBadge,
              ]}
            >
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Icon
                name="access-time"
                size={22}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.detailText}>
                {convertTo12Hour(booking.startTime)} -{" "}
                {convertTo12Hour(booking.endTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon
                name="location-on"
                size={22}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.detailText}>{booking.parkingSpace.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Icon
                name="directions-car"
                size={22}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.detailText}>{booking.vehicleType}</Text>
            </View>

            {overtimeCharges > 0 && (
              <View style={styles.warningContainer}>
                <Icon name="warning" size={22} color={COLORS.ERROR} />
                <Text style={styles.warningText}>
                  Penalty Charges: ₹{overtimeCharges}
                </Text>
              </View>
            )}
          </View>

          {booking.parkingStatus === "parked" && (
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => {
                Alert.alert(
                  "Confirm Action",
                  overtimeCharges > 0
                    ? `Vehicle has overstayed. Penalty charges: ₹${overtimeCharges}. Proceed to payment?`
                    : "Are you sure you want to checkout this vehicle?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: overtimeCharges > 0 ? "Pay & Checkout" : "Checkout",
                      onPress: () => handleCheckout(booking._id),
                    },
                  ]
                );
              }}
            >
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutButtonGradient}
              >
                <Text style={styles.checkoutButtonText}>
                  {overtimeCharges > 0 ? "Pay & Checkout" : "Checkout Vehicle"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Manage Parking</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBookings}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {bookings.length > 0 ? (
          bookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Icon
              name="local-parking"
              size={80}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={styles.emptyText}>No active parkings</Text>
          </View>
        )}
      </ScrollView>

      <BlurView intensity={100} style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("ScheduleAlert")}
        >
          <Icon name="notifications" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("UserBooking")}
        >
          <Icon name="event" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Bookings</Text>
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
    padding: 20,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.WHITE,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  vehicleNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  activeBadge: {
    backgroundColor: COLORS.SUCCESS,
  },
  graceBadge: {
    backgroundColor: COLORS.WARNING,
  },
  overstayedBadge: {
    backgroundColor: COLORS.ERROR,
  },
  checkedOutBadge: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },
  detailsContainer: {
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  warningText: {
    color: COLORS.ERROR,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  checkoutButton: {
    marginTop: 20,
    overflow: "hidden",
    borderRadius: 12,
    elevation: 4,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  checkoutButtonGradient: {
    padding: 14,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: height * 0.15,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    minWidth: 80,
  },
  navButtonActive: {
    backgroundColor: "transparent",
  },
  navButtonGradient: {
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    fontWeight: "500",
  },
  navTextActive: {
    fontSize: 12,
    color: COLORS.WHITE,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default ManageParking;
