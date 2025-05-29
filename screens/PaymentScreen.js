import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useUserContext } from "../UserContext"; // Import the UserContext
import * as Notifications from "expo-notifications";

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
  MODAL_BG: "rgba(0, 0, 0, 0.5)",
  BORDER: "#E2E8F0",
};

const API_URL = "https://vehicles-tau.vercel.app/api";

const convertTo24Hour = (time12) => {
  if (!time12) return "";
  const [time, period] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
};
const scheduleNotification = async (title, body, trigger) => {
  console.log(
    `Scheduling notification: ${title} - ${body} with trigger:`,
    trigger
  );
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
    },
    trigger: trigger,
  });
};

const PaymentScreen = ({ route, navigation }) => {
  const {
    parkingSpace,
    selectedDate,
    startTime,
    duration,
    totalAmount,
    latitude,
    longitude,
    userEmail,
    vehicleType,
    numberPlate,
    startTimeDisplay,
    endTime,
  } = route.params;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [endTimeDisplay, setEndTimeDisplay] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const { userId } = useUserContext(); // Get userId from UserContext
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

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
    ]).start();
  }, []);

  const convertTo12Hour = (time24) => {
    const [hours24, minutes] = time24.split(":").map(Number);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };
  useEffect(() => {
    if (userId) {
      console.log("Fetched userId:", userId);
    } else {
      console.log("User ID not available");
    }
  }, [userId]);
  useEffect(() => {
    const fetchPushToken = async () => {
      const token = await AsyncStorage.getItem("pushToken");
      setPushToken(token); // Store the token in state
    };

    fetchPushToken();
    if (startTime && duration) {
      try {
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0);
        const endDate = new Date(startDate.getTime() + duration * 60 * 60000);
        const endHours = endDate.getHours().toString().padStart(2, "0");
        const endMinutes = endDate.getMinutes().toString().padStart(2, "0");
      } catch (error) {
        console.error("Time calculation error:", error);
      }
    }
  }, [startTime, duration]);
  const sendPushNotification = async (confirmData) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Payment Successful!",
          body: `Your payment of ₹${confirmData.payment.totalAmount} was successful. Booking ID: ${confirmData.payment.bookingId}.`,
          data: { userId: userId }, // Optionally include userId in the data payload
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  };

  const fetchPaymentIntent = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(
        `${API_URL}/payments/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            totalAmount: parseFloat(totalAmount),
            parkingSpace: parkingSpace,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Failed to create payment intent"
        );
      }
      return data;
    } catch (error) {
      console.error("Payment Intent Error:", error);
      throw error;
    }
  };

  const sendEmail = async (emailData) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const emailEndpoint = `${API_URL}/send-email`;

      const response = await fetch(emailEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Parking Booking Confirmation</h2>
              <p>Dear Customer,</p>
              <p>Your booking for parking space ${emailData.parkingSpace} is confirmed.</p>
              <p>Date: ${emailData.date}</p>
              <p>Start Time: ${emailData.startTime}</p>
              <p>End Time: ${emailData.endTime}</p>
              <p>Amount Paid: ₹${emailData.amount}</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        throw new Error("Email sending failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Email Sending Error:", error);
      throw error;
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const paymentData = await fetchPaymentIntent();

      if (!paymentData?.clientSecret) {
        throw new Error("Failed to get payment details");
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentData.clientSecret,
        merchantDisplayName: "Smart Parking",
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw new Error(presentError.message);

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const confirmResponse = await fetch(
        `${API_URL}/payments/confirm-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentData.paymentIntentId,
            duration,
            latitude,
            longitude,
            numberPlate,
            parkingSpace: {
              id: parkingSpace.id,
              name: parkingSpace.name,
              address: parkingSpace.address,
              type: parkingSpace.type || "Open",
              latitude: parkingSpace.latitude || latitude,
              longitude: parkingSpace.longitude || longitude,
            },
            bookingDate: selectedDate,
            startTime,
            endTime,
            totalAmount,
            userEmail,
            vehicleType,
          }),
        }
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(
          errorData.error || errorData.details || "Failed to confirm payment"
        );
      }

      const confirmData = await confirmResponse.json();
      setPaymentSummary(confirmData.payment);
      setShowSummary(true);

      await sendEmail({
        to: userEmail,
        subject: "Parking Booking Confirmation",
        parkingSpace: parkingSpace.name,
        date: selectedDate,
        startTime: startTimeDisplay,
        endTime: convertTo12Hour(endTime),
        amount: totalAmount,
      });
      await sendPushNotification(confirmData); // Call to send the notification
    } catch (error) {
      console.error("Payment Error:", error);
      Alert.alert(
        "Payment Error",
        error.message || "An error occurred during payment processing"
      );
    } finally {
      setLoading(false);
    }
  };
  const scheduleReminders = async (userId, startTime, duration) => {
    // Convert startTime from 12-hour format to 24-hour format
    const [startHours, startMinutes] = convertTo24Hour(startTime)
      .split(":")
      .map(Number);
    const startDate = new Date();
    startDate.setHours(startHours);
    startDate.setMinutes(startMinutes);

    // Calculate end time using the duration
    const endTime = new Date(startDate.getTime() + duration * 60 * 1000);
    console.log(
      "End Time:",
      convertTo12Hour(`${endTime.getHours()}:${endTime.getMinutes()}`)
    );

    // Calculate arrival time (5 minutes before start time)
    const arrivalTime = new Date(startDate.getTime() - 5 * 60 * 1000);

    // Calculate seconds until each notification
    const arrivalSeconds = Math.max(
      0,
      (arrivalTime.getTime() - Date.now()) / 1000
    );
    const startSeconds = Math.max(0, (startDate.getTime() - Date.now()) / 1000);
    const expireSeconds = Math.max(0, (endTime.getTime() - Date.now()) / 1000);

    // Function to send notifications after a delay
    const sendNotificationAfterDelay = async (title, body, delay) => {
      if (delay > 0) {
        console.log(
          `Waiting for ${delay} seconds to send notification: ${title}`
        );
        setTimeout(async () => {
          await scheduleNotification(title, body, { seconds: 0 }); // Send immediately after waiting
        }, delay * 1000);
      } else {
        await scheduleNotification(title, body, { seconds: 0 }); // Send immediately
      }
    };

    // Schedule reminders
    await sendNotificationAfterDelay(
      "Reminder: Upcoming Booking",
      "Your booking is in 5 minutes!",
      arrivalSeconds
    );
    await sendNotificationAfterDelay(
      "Booking Started",
      "Your booking has started!",
      startSeconds
    );
    await sendNotificationAfterDelay(
      "Booking Expired",
      "Your booking has expired!",
      expireSeconds
    );
  };

  const scheduleRemindersAfterSummary = async () => {
    if (paymentSummary) {
      await scheduleReminders(
        userId,
        paymentSummary.startTime,
        paymentSummary.duration
      );
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />

      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Payment Details</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.parkingCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.8)"]}
            style={styles.cardGradient}
          >
            <View style={styles.parkingHeaderRow}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.iconContainer}
              >
                <Icon name="local-parking" size={30} color={COLORS.WHITE} />
              </LinearGradient>
              <View style={styles.parkingTextContainer}>
                <Text style={styles.parkingName}>
                  {parkingSpace?.name || "Parking Space"}
                </Text>
                <Text style={styles.parkingAddress}>
                  <Icon
                    name="location-on"
                    size={16}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  {parkingSpace?.address || "Address not available"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.sectionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.8)"]}
            style={styles.sectionGradient}
          >
            <View style={styles.sectionTitleContainer}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.sectionIconContainer}
              >
                <Icon name="receipt" size={24} color={COLORS.WHITE} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{selectedDate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>{vehicleType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Number Plate</Text>
                <Text style={styles.detailValue}>{numberPlate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Time</Text>
                <Text style={styles.detailValue}>{startTimeDisplay}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{duration} minutes</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Time</Text>
                <Text style={styles.detailValue}>
                  {convertTo12Hour(endTime)}
                </Text>
              </View>
            </View>

            <LinearGradient
              colors={["rgba(79, 70, 229, 0.1)", "rgba(124, 58, 237, 0.1)"]}
              style={styles.costContainer}
            >
              <Text style={styles.costLabel}>Total Amount</Text>
              <Text style={styles.costValue}>₹{totalAmount}</Text>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        <TouchableOpacity
          style={styles.paymentButton}
          onPress={handlePayment}
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.paymentButtonGradient}
          >
            <Text style={styles.paymentButtonText}>Pay Securely</Text>
            <Icon name="lock" size={24} color={COLORS.WHITE} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.secureText}>
          <Icon name="security" size={16} color={COLORS.TEXT_SECONDARY} />
          Your payment is secure and encrypted
        </Text>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showSummary}
        onRequestClose={() => setShowSummary(false)}
      >
        <BlurView intensity={100} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[COLORS.SUCCESS, "#059669"]}
                  style={styles.successIconContainer}
                >
                  <Icon name="check-circle" size={50} color={COLORS.WHITE} />
                </LinearGradient>
                <Text style={styles.modalTitle}>Payment Successful!</Text>
                <Text style={styles.bookingId}>
                  Booking ID: {paymentSummary?.bookingId}
                </Text>
              </View>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Parking Space</Text>
                  <Text style={styles.summaryValue}>{parkingSpace?.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{selectedDate}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>
                    {startTimeDisplay} - {convertTo12Hour(endTime)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{duration} minutes</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle</Text>
                  <Text style={styles.summaryValue}>
                    {vehicleType} - {numberPlate}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid</Text>
                  <Text style={[styles.summaryValue, styles.amountText]}>
                    ₹{totalAmount}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={async () => {
                  setShowSummary(false); // Close the modal
                  navigation.navigate("Home"); // Navigate to Home immediately

                  // Schedule reminders after navigating
                  try {
                    await scheduleRemindersAfterSummary();
                    console.log("Reminders scheduled successfully.");
                  } catch (error) {
                    console.error("Error scheduling reminders:", error);
                    Alert.alert(
                      "Error",
                      "Failed to schedule reminders. Please try again."
                    );
                  }
                }}
              >
                <LinearGradient
                  colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                  style={styles.closeButtonGradient}
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.WHITE,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  parkingCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
  },
  parkingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  parkingTextContainer: {
    flex: 1,
  },
  parkingName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  sectionContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
  },
  sectionGradient: {
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
  },
  costContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  costValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 16,
    elevation: 4,
  },
  paymentButtonGradient: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.WHITE,
    marginRight: 8,
  },
  secureText: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginBottom: 16,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.MODAL_BG,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 10,
  },
  bookingId: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 5,
  },
  summaryContainer: {
    gap: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  amountText: {
    color: COLORS.SUCCESS,
    fontWeight: "700",
    fontSize: 18,
  },
  closeButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  closeButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentScreen;
