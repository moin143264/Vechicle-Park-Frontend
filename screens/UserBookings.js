import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
import axiosInstance from "../utils/axiosInstance";
import { useUserContext } from "../UserContext";

const { width, height } = Dimensions.get("window");

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
  CARD_BG: "rgba(255, 255, 255, 0.95)",
};

const STATUS_STYLES = {
  completed: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: COLORS.SUCCESS,
    icon: "check-circle",
  },
  pending: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    color: COLORS.WARNING,
    icon: "schedule",
  },
  failed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: COLORS.ERROR,
    icon: "error",
  },
};
const UserBookings = ({ navigation, route }) => {
  const { userId } = useUserContext();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { latitude, longitude } = route.params || {};

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (userId) {
          const response = await axiosInstance.get(
            `/payments?userId=${userId}`
          );
          console.log("API Response:", response.data);
          const paymentsData = response.data.payments || [];
          setPayments(paymentsData);
          filterPaymentsByDate(paymentsData, selectedDate);
        } else {
          console.error("User ID is missing");
        }
      } catch (error) {
        console.error("Error fetching payments:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPayments();
    }
  }, [userId]);

  const filterPaymentsByDate = (paymentsData, date) => {
    const filtered = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.bookingDate);
      return (
        paymentDate.getDate() === date.getDate() &&
        paymentDate.getMonth() === date.getMonth() &&
        paymentDate.getFullYear() === date.getFullYear()
      );
    });
    setFilteredPayments(filtered);
  };

  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
      filterPaymentsByDate(payments, selected);
    }
  };

  const formatDate = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
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
  const formatDuration = (hours) => {
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  };

  const getStatusStyle = (status) => {
    return STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.pending;
  };
  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.paymentStatus);

    return (
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.95)"]}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.stationInfo}>
                <LinearGradient
                  colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                  style={styles.iconContainer}
                >
                  <Icon name="local-parking" size={24} color={COLORS.WHITE} />
                </LinearGradient>
                <Text style={styles.stationName} numberOfLines={1}>
                  {item.parkingSpace?.name || "Unknown Location"}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusStyle.backgroundColor },
                ]}
              >
                <Icon
                  name={statusStyle.icon}
                  size={16}
                  color={statusStyle.color}
                  style={styles.statusIcon}
                />
                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                  {item.paymentStatus?.charAt(0).toUpperCase() +
                    item.paymentStatus?.slice(1) || "Pending"}
                </Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <View style={styles.infoItem}>
                  <Icon name="event" size={18} color={COLORS.TEXT_SECONDARY} />
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>
                    {item.bookingDate || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon
                    name="schedule"
                    size={18}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>
                    {formatDuration(item.duration)}{" "}
                  </Text>
                </View>
              </View>

              <View style={styles.infoColumn}>
                <View style={styles.infoItem}>
                  <Icon
                    name="access-time"
                    size={18}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.infoLabel}>Start Time</Text>
                  <Text style={styles.infoValue}>
                    {convertTo12Hour(item.startTime)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon
                    name="payment"
                    size={18}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>
                    ₹{(item.totalAmount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.vehicleInfo}>
              <Icon
                name="directions-car"
                size={18}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.vehicleText}>
                {item.vehicleType || "Vehicle"} - {item.numberPlate || "N/A"}
              </Text>
            </View>

            <View style={styles.addressContainer}>
              <Icon
                name="location-on"
                size={18}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.addressText} numberOfLines={2}>
                {item.parkingSpace?.address || "Address not available"}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.bookingId}>
                Booking ID: {item.bookingId || "N/A"}
              </Text>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => {
                  navigation.navigate("UserBookingDetails", {
                    booking: item,
                    latitude: item.latitude || 0,
                    longitude: item.longitude || 0,
                    address:
                      item.parkingSpace?.address || "Address not available",
                  });
                }}
              >
                <LinearGradient
                  colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                  <Icon name="arrow-forward" size={16} color={COLORS.WHITE} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />

      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Bookings</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon
            name="event"
            size={24}
            color={COLORS.WHITE}
            style={styles.dateIcon}
          />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      ) : filteredPayments.length > 0 ? (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.bookingId}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/2748/2748558.png",
            }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            No bookings found for {formatDate(selectedDate)}
          </Text>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => navigation.navigate("Home")}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.bookNowButtonText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

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

        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.navButtonGradient}
          >
            <Icon name="event" size={24} color={COLORS.WHITE} />
            <Text style={styles.navTextActive}>Bookings</Text>
          </LinearGradient>
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
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.WHITE,
    marginBottom: 12,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.WHITE,
    fontWeight: "500",
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  stationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 12,
  },
  vehicleText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingId: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },
  detailsButton: {
    overflow: "hidden",
    borderRadius: 20,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  detailsButtonText: {
    color: COLORS.WHITE,
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 24,
  },
  bookNowButton: {
    overflow: "hidden",
    borderRadius: 24,
    elevation: 4,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookNowButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  flatListContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  navButtonActive: {
    overflow: "hidden",
    borderRadius: 20,
  },
  navButtonGradient: {
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
  },
  navText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: COLORS.WHITE,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default UserBookings;
