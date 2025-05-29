// context/BookingAlertContext.js
import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';

// Create the context
const BookingAlertContext = createContext();

// Create a custom hook to use the alert context
export const useBookingAlert = () => useContext(BookingAlertContext);

// Provider component to wrap around the root of your app
export const BookingAlertProvider = ({ children }) => {
  const [alertedBookings, setAlertedBookings] = useState(new Set());

  const showAlert = (type, stationName) => {
    const message = type === 'upcoming'
      ? `You have an upcoming booking at ${stationName}`
      : type === 'arrived'
      ? `You have arrived at ${stationName}`
      : `Your booking at ${stationName} has expired`;

    Alert.alert(`${type.charAt(0).toUpperCase() + type.slice(1)} Booking`, message);
  };

  const checkAndAlertBooking = (booking) => {
    const { startTime, endTime, stationName, _id } = booking;

    const now = new Date();
    const startDateTime = createDateFromTime(new Date(booking.selectedDate), startTime);
    const endDateTime = endTime ? createDateFromTime(new Date(booking.selectedDate), endTime) : null;

    if (now < startDateTime && !alertedBookings.has(_id) && startDateTime - now <= 10 * 60 * 1000) {
      showAlert('upcoming', stationName);
      setAlertedBookings((prev) => new Set(prev).add(_id));
    } else if (endDateTime && now > endDateTime && !alertedBookings.has(`${_id}-expired`)) {
      showAlert('expired', stationName);
      setAlertedBookings((prev) => new Set(prev).add(`${_id}-expired`));
    }
  };

  const createDateFromTime = (date, time) => {
    const [hours, minutes] = time.split(':');
    const newDate = new Date(date); // Copy the selected date
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  return (
    <BookingAlertContext.Provider value={{ checkAndAlertBooking }}>
      {children}
    </BookingAlertContext.Provider>
  );
};
