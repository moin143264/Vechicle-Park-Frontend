import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
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
};

const STATUS_STYLES = {
  "Arriving in 10 minutes": {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    color: COLORS.WARNING,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  Arrived: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: COLORS.SUCCESS,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  Expired: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: COLORS.ERROR,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  Pending: {
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    color: COLORS.TEXT_SECONDARY,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
};
const ScheduleAlert = ({ navigation }) => {
  const { userId } = useUserContext();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [alertedBookings, setAlertedBookings] = useState(new Set());
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  const formatDate = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        if (!userId) return;

        const response = await fetch(
          `https://vehicles-tau.vercel.app/ap/payments?userId=${userId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setPayments(result.data);
          filterPaymentsByDate(result.data, selectedDate);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          throw new Error(result.message || "Failed to fetch payments");
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "Unable to retrieve booking details. Please try again later."
        );
      }
    };

    fetchPayments();

    const interval = setInterval(() => {
      const now = new Date();
      payments.forEach((payment) => {
        notificationManager.current.checkAndNotify(payment, now);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, selectedDate]);

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

  const createDateFromTime = (date, time) => {
    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours24, minutes] = time24.split(":").map(Number);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const getStatus = (startTime, endTime) => {
    const now = new Date();

    if (
      now < startTime &&
      startTime.getTime() - now.getTime() <= 10 * 60 * 1000
    ) {
      return "Arriving in 10 minutes";
    } else if (now >= startTime && (!endTime || now <= endTime)) {
      return "Arrived";
    } else if (endTime && now > endTime) {
      return "Expired";
    }
    return "Pending";
  };
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.header}
      >
        <Icon
          name="notifications"
          size={32}
          color={COLORS.WHITE}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Parking Alerts</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="event" size={24} color={COLORS.PRIMARY} />
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

      <Animated.View
        style={[
          styles.cardsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon
              name="notifications-off"
              size={80}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={styles.emptyStateText}>No Alerts Found</Text>
            <Text style={styles.emptyStateSubText}>
              No parking alerts for {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity
              style={styles.newBookingButton}
              onPress={() => navigation.navigate("Booking")}
            >
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Icon name="add-circle" size={20} color={COLORS.WHITE} />
                <Text style={styles.newBookingButtonText}>Book Parking</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredPayments}
            keyExtractor={(item) => item.bookingId}
            renderItem={({ item }) => {
              const bookingDate = new Date(item.bookingDate);
              const startTime = createDateFromTime(bookingDate, item.startTime);
              const endTime = item.endTime
                ? createDateFromTime(bookingDate, item.endTime)
                : null;
              const status = getStatus(startTime, endTime);
              const statusStyle = STATUS_STYLES[status];

              return (
                <Animated.View style={styles.cardWrapper}>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.95)"]}
                    style={[
                      styles.card,
                      {
                        borderLeftColor: statusStyle.color,
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.vehicleInfo}>
                        <Icon
                          name="directions-car"
                          size={24}
                          color={COLORS.PRIMARY}
                        />
                        <Text style={styles.vehicleText}>
                          {item.numberPlate}
                        </Text>
                        <View style={styles.vehicleType}>
                          <Text style={styles.vehicleTypeText}>
                            {item.vehicleType}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusStyle.color },
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.parkingDetails}>
                      <View style={styles.locationSection}>
                        <Icon
                          name="place"
                          size={20}
                          color={COLORS.TEXT_SECONDARY}
                        />
                        <View style={styles.locationText}>
                          <Text style={styles.parkingName}>
                            {item.parkingSpace.name}
                          </Text>
                          <Text style={styles.parkingAddress}>
                            {item.parkingSpace.address}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.timeSection}>
                        <View style={styles.timeBlock}>
                          <Icon
                            name="schedule"
                            size={18}
                            color={COLORS.TEXT_SECONDARY}
                          />
                          <View style={styles.timeDetails}>
                            <Text style={styles.timeLabel}>Start</Text>
                            <Text style={styles.timeValue}>
                              {convertTo12Hour(item.startTime)}
                            </Text>
                          </View>
                        </View>
                        <Icon
                          name="arrow-forward"
                          size={18}
                          color={COLORS.BORDER}
                        />
                        <View style={styles.timeBlock}>
                          <Icon
                            name="schedule"
                            size={18}
                            color={COLORS.TEXT_SECONDARY}
                          />
                          <View style={styles.timeDetails}>
                            <Text style={styles.timeLabel}>End</Text>
                            <Text style={styles.timeValue}>
                              {convertTo12Hour(item.endTime)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.paymentSection}>
                        <Icon name="payment" size={18} color={COLORS.SUCCESS} />
                        <Text style={styles.paymentText}>
                          ₹{item.totalAmount}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </Animated.View>

      <BlurView intensity={100} style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.navButtonGradient}
          >
            <Icon name="notifications" size={24} color={COLORS.WHITE} />
            <Text style={styles.navTextActive}>Alerts</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("UserProfile")}
        >
          <Icon name="person" size={24} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.navText}>Profile</Text>
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
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignItems: "center",
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.WHITE,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
    marginLeft: 8,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
  },
  vehicleType: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  vehicleTypeText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  parkingDetails: {
    padding: 16,
  },
  locationSection: {
    flexDirection: "row",
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeDetails: {
    marginLeft: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  paymentSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.SUCCESS,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginTop: 8,
  },
  newBookingButton: {
    marginTop: 24,
    overflow: "hidden",
    borderRadius: 25,
    elevation: 4,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  newBookingButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 100,
  },
});

export default ScheduleAlert;
