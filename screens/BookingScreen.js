import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import RNPickerSelect from "react-native-picker-select";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

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

const VEHICLE_CONFIGS = {
  Car: {
    plateFormat: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
    example: "MH12AB1234",
  },
  Motorcycle: {
    plateFormat: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
    example: "MH12AB1234",
  },
  Bus: {
    plateFormat: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
    example: "MH12AB1234",
  },
  Truck: {
    plateFormat: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
    example: "MH12AB1234",
  },
  Van: {
    plateFormat: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
    example: "MH12AB1234",
  },
};

const BookingScreen = ({ route }) => {
  const navigation = useNavigation();
  const { parkingSpace, parkingLatitude, parkingLongitude, userEmail } =
    route.params || {};

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(""); // Initialize as an empty string
  const [selectedStartTime, setSelectedStartTime] = useState(currentDate);
  const [duration, setDuration] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedStartTimeString, setSelectedStartTimeString] = useState("");
  const [selectedStartTimeDisplay, setSelectedStartTimeDisplay] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [numberPlateError, setNumberPlateError] = useState("");

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const availableVehicleTypes = useMemo(() => {
    if (!parkingSpace?.vehicleSlots || parkingSpace.vehicleSlots.length === 0) {
      return [];
    }

    return parkingSpace.vehicleSlots.map((slot) => ({
      label: `${slot.vehicleType} (₹${slot.pricePerHour}/hr - ${slot.availableSlots} slots)`,
      value: slot.vehicleType,
      pricePerHour: slot.pricePerHour,
      availableSlots: slot.availableSlots,
      disabled: slot.availableSlots === 0,
    }));
  }, [parkingSpace?.vehicleSlots]);

  const durationOptions = useMemo(() => {
    if (!selectedStartTime) return []; // Return empty if no start time is selected

    const startHour = new Date(selectedStartTime).getHours();
    const maxDuration = startHour === 23 ? 1 : 24 - startHour; // Calculate max duration based on start time

    return Array.from({ length: maxDuration }, (_, index) => {
      const durationInMinutes = (index + 1) * 60; // Convert to minutes
      return {
        label: `${durationInMinutes / 60} hour${
          durationInMinutes / 60 > 1 ? "s" : ""
        } (${durationInMinutes} minutes)`,
        value: durationInMinutes,
      };
    });
  }, [selectedStartTime]);

  const timeOptions = useMemo(() => {
    const currentHour = new Date().getHours(); // Get the current hour
    return Array.from({ length: 24 - currentHour }, (_, hour) => {
      const ampm = currentHour + hour >= 12 ? "PM" : "AM";
      const hour12 = (currentHour + hour) % 12 || 12; // Convert to 12-hour format
      return {
        label: `${hour12}:00 ${ampm}`,
        value: `${(currentHour + hour).toString().padStart(2, "0")}:00`,
      };
    }).filter((_, index) => index + currentHour <= 23); // Filter to ensure we don't go past 11 PM
  }, []);

  const calculateTotalCost = useMemo(() => {
    if (!duration || !selectedVehicleType) return 0;
    const vehicleType = availableVehicleTypes.find(
      (type) => type.value === selectedVehicleType
    );
    if (!vehicleType) return 0;

    const hours = duration / 60;
    return (hours * vehicleType.pricePerHour).toFixed(2);
  }, [duration, selectedVehicleType, availableVehicleTypes]);

  useEffect(() => {
    if (selectedStartTime && duration) {
      const start = new Date(selectedStartTime);
      const end = new Date(start.getTime() + duration * 60000);

      // Check if end time is midnight (00:00)
      if (end.getHours() === 0 && end.getMinutes() === 0) {
        end.setHours(23, 59); // Set to the last minute of the same day
        end.setDate(start.getDate()); // Ensure same date
      }

      setEndTime(end);
    }
  }, [selectedStartTime, duration]);
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now.toLocaleDateString("en-CA")); // Set selectedDate to today's date in YYYY-MM-DD format
  }, []); // This runs only once when the component mounts

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);
      const currentDateString = now.toLocaleDateString("en-CA"); // Update selectedDate to today's date
      setSelectedDate(currentDateString);
      console.log("Current Date Updated:", currentDateString); // Debug log
    }, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Log selected date when it changes
  useEffect(() => {
    console.log("Selected Date:", selectedDate); // Debug log
  }, [selectedDate]);

  const handleTimeChange = (value) => {
    if (value) {
      const [hours, minutes] = value.split(":");
      const newStartTime = new Date(selectedStartTime);
      newStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setSelectedStartTime(newStartTime);
      setSelectedStartTimeString(value);

      const hour12 =
        parseInt(hours) === 0
          ? 12
          : parseInt(hours) > 12
          ? parseInt(hours) - 12
          : parseInt(hours);
      const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
      setSelectedStartTimeDisplay(`${hour12}:00 ${ampm}`);

      setDuration(null);
      setEndTime(null);
    }
  };
  const handleDateSelect = (day) => {
    const currentDateString = currentDate.toISOString().split("T")[0];
    if (day.dateString === currentDateString) {
      setSelectedDate(day.dateString);
    } else {
      Alert.alert(
        "Booking Restricted",
        "Bookings are only available for today.",
        [{ text: "OK" }]
      );
    }
  };

  const validateNumberPlate = (plate) => {
    if (!selectedVehicleType) {
      setNumberPlateError("Please select a vehicle type first");
      return false;
    }

    const config = VEHICLE_CONFIGS[selectedVehicleType];
    if (!config) {
      setNumberPlateError("Invalid vehicle type selected");
      return false;
    }

    if (!config.plateFormat.test(plate)) {
      setNumberPlateError(`Invalid format. Example: ${config.example}`);
      return false;
    }

    setNumberPlateError("");
    return true;
  };

  const handleProceedToPayment = () => {
    const validationErrors = [];

    const selectedVehicleSlot = availableVehicleTypes.find(
      (type) => type.value === selectedVehicleType
    );

    if (!selectedVehicleType) {
      validationErrors.push("Please select a vehicle type");
    } else if (!selectedVehicleSlot) {
      validationErrors.push("Invalid vehicle type selected");
    } else if (selectedVehicleSlot.availableSlots === 0) {
      validationErrors.push(
        "No parking slots available for selected vehicle type"
      );
    }

    if (!numberPlate || !validateNumberPlate(numberPlate))
      validationErrors.push("Please enter a valid number plate");
    if (!selectedDate) validationErrors.push("Please select a date");
    if (!selectedStartTimeString)
      validationErrors.push("Please select a start time");
    if (!duration) validationErrors.push("Please select a duration");
    if (!endTime) validationErrors.push("Unable to calculate end time");

    if (validationErrors.length > 0) {
      Alert.alert("Booking Error", validationErrors.join("\n"), [
        { text: "OK" },
      ]);
      return;
    }
    const formattedEndTime = endTime
      ? `${endTime.getHours().toString().padStart(2, "0")}:${endTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      : "";

    navigation.navigate("PaymentScreen", {
      userEmail,
      parkingId: parkingSpace?.id,
      parkingName: parkingSpace?.name,
      vehicleType: selectedVehicleType,
      numberPlate: numberPlate,
      bookingDate: selectedDate,
      startTime: selectedStartTimeString,
      startTimeDisplay: selectedStartTimeDisplay,

      endTime: formattedEndTime,
      duration: duration,
      totalAmount: calculateTotalCost,
      parkingSpace,
      latitude: parkingLatitude,
      longitude: parkingLongitude,
      selectedDate,
    });
  };

  const renderParkingDetails = () => (
    <View style={styles.sectionContainer}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.parkingGradient}
      >
        <View style={styles.parkingHeaderRow}>
          <View style={styles.parkingIconContainer}>
            <Icon name="local-parking" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.parkingTextContainer}>
            <Text style={styles.parkingName}>
              {parkingSpace?.name || "Parking Space"}
            </Text>
            <Text style={styles.parkingAddress}>
              <Icon name="location-on" size={16} color="#FFFFFF" />
              {parkingSpace?.address || "Address not available"}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderDatePicker = () => {
    const today = currentDate.toISOString().split("T")[0];
    const markedDates = {
      [today]: {
        selected: selectedDate === today,
        selectedColor: COLORS.PRIMARY,
        marked: true,
        dotColor: COLORS.PRIMARY,
      },
    };

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Icon name="event" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.sectionTitle}>Select Date</Text>
        </View>
        <Calendar
          current={today}
          minDate={today}
          maxDate={today}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          theme={{
            todayTextColor: COLORS.PRIMARY,
            selectedDayBackgroundColor: COLORS.PRIMARY,
            selectedDayTextColor: COLORS.WHITE,
            arrowColor: COLORS.PRIMARY,
            monthTextColor: COLORS.TEXT_PRIMARY,
            textDayFontWeight: "500",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "500",
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />

      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY, COLORS.ACCENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.iconBackground}
            >
              <Icon
                name="event-available"
                size={60}
                color="#FFFFFF"
                style={styles.headerIcon}
              />
            </LinearGradient>
            <Text style={styles.headerText}>Book Parking</Text>
            <Text style={styles.subHeaderText}>Reserve your spot easily</Text>
          </Animated.View>
        </View>

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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {renderParkingDetails()}

              <View style={styles.sectionContainer}>
                <View style={styles.sectionTitleContainer}>
                  <Icon
                    name="directions-car"
                    size={24}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.sectionTitle}>Vehicle Details</Text>
                </View>

                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={(value) => {
                      setSelectedVehicleType(value);
                      setNumberPlate("");
                      setNumberPlateError("");
                    }}
                    items={availableVehicleTypes}
                    value={selectedVehicleType}
                    style={pickerSelectStyles}
                    placeholder={{ label: "Select Vehicle Type", value: null }}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Vehicle Number</Text>
                  <TextInput
                    style={[
                      styles.input,
                      numberPlateError ? styles.inputError : null,
                    ]}
                    value={numberPlate}
                    onChangeText={(text) => {
                      const upperText = text.toUpperCase();
                      setNumberPlate(upperText);
                      if (upperText) validateNumberPlate(upperText);
                      else setNumberPlateError("");
                    }}
                    placeholder="Enter vehicle number"
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                  {numberPlateError ? (
                    <Text style={styles.errorText}>{numberPlateError}</Text>
                  ) : (
                    <Text style={styles.helperText}>
                      Format:{" "}
                      {selectedVehicleType
                        ? VEHICLE_CONFIGS[selectedVehicleType]?.example
                        : "MH12AB1234"}
                    </Text>
                  )}
                </View>
              </View>

              {renderDatePicker()}

              <View style={styles.sectionContainer}>
                <View style={styles.timeContainer}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <RNPickerSelect
                      onValueChange={handleTimeChange}
                      items={timeOptions}
                      value={selectedStartTimeString}
                      style={pickerSelectStyles}
                      placeholder={{ label: "Select Start Time", value: null }}
                    />
                  </View>

                  <View style={styles.pickerContainer}>
                    <Text style={styles.inputLabel}>Duration</Text>
                    <RNPickerSelect
                      onValueChange={(value) => setDuration(value)}
                      items={durationOptions}
                      value={duration}
                      style={pickerSelectStyles}
                      placeholder={{
                        label: selectedStartTimeString
                          ? "Select Duration"
                          : "Select Start Time First",
                        value: null,
                      }}
                      disabled={!selectedStartTimeString}
                    />
                  </View>
                </View>

                {duration && selectedVehicleType && (
                  <View style={styles.costContainer}>
                    <Text style={styles.costLabel}>Total Cost</Text>
                    <Text style={styles.costValue}>₹{calculateTotalCost}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.bookingButton}
                onPress={handleProceedToPayment}
                disabled={
                  !selectedVehicleType ||
                  availableVehicleTypes.find(
                    (type) => type.value === selectedVehicleType
                  )?.disabled
                }
              >
                <LinearGradient
                  colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookingGradient}
                >
                  <Text style={styles.bookingButtonText}>
                    {!selectedVehicleType ||
                    availableVehicleTypes.find(
                      (type) => type.value === selectedVehicleType
                    )?.disabled
                      ? "No Slots Available"
                      : "Proceed to Payment"}
                  </Text>
                  <Icon name="arrow-forward" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  headerContainer: {
    height: height * 0.28,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerIcon: {
    transform: [{ rotate: "-10deg" }],
  },
  headerText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subHeaderText: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    marginTop: -30,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  parkingGradient: {
    borderRadius: 12,
    padding: 20,
  },
  parkingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  parkingIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  parkingTextContainer: {
    flex: 1,
  },
  parkingName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    height: 55,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  timeContainer: {
    marginBottom: 20,
  },
  costContainer: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  costLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  costValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  bookingButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
    marginBottom: 10,
  },
  bookingGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  bookingButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 55,
    fontSize: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.2)",
    borderRadius: 12,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: "#FFFFFF",
  },
  inputAndroid: {
    height: 55,
    fontSize: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.2)",
    borderRadius: 12,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: "#FFFFFF",
    paddingRight: 30,
  },
  placeholder: {
    color: COLORS.TEXT_SECONDARY,
  },
  iconContainer: {
    top: 15,
    right: 12,
  },
});

export default BookingScreen;
