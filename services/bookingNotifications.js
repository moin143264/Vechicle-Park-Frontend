import { NOTIFICATION_TYPES } from '../services/usePushNotifications';

export class BookingNotificationManager {
    constructor(scheduleNotification) {
        this.scheduleNotification = scheduleNotification;
        this.alertedBookings = new Set();
    }

    /**
     * Checks if a notification should be sent for a booking
     * @param {Object} booking - The booking object
     * @param {Date} now - Current time
     */
    checkAndNotify(booking, now) {
        // First check if this is a new confirmation
        if (booking.bookingStatus === 'pending') {
            this.sendConfirmationNotification(booking);
            return;
        }

        if (booking.bookingStatus !== 'confirmed') return;

        const bookingDate = new Date(booking.bookingDate);
        const startTime = this.createDateFromTime(bookingDate, booking.startTime);
        const endTime = booking.endTime ? this.createDateFromTime(bookingDate, booking.endTime) : null;
        
        if (!this.isSameDay(bookingDate, now)) return;

        this.checkUpcomingNotification(booking, now, startTime);
        this.checkArrivedNotification(booking, now, startTime, endTime);
        this.checkCompletedNotification(booking, now, endTime);
    }

    /**
     * Send booking confirmation notification
     */
    sendConfirmationNotification(booking) {
        if (!this.isAlerted(booking.bookingId, 'confirmed')) {
            this.sendBookingNotification(
                NOTIFICATION_TYPES.CONFIRMED,
                booking,
                'confirmed'
            );
            this.markAlerted(booking.bookingId, 'confirmed');
        }
    }

    /**
     * Checks and sends upcoming booking notification
     */
    checkUpcomingNotification(booking, now, startTime) {
        const tenMinutesBeforeStart = startTime.getTime() - (10 * 60 * 1000);
        
        if (!this.isAlerted(booking.bookingId, 'upcoming') && 
            now.getTime() >= tenMinutesBeforeStart && 
            now < startTime) {
            
            this.sendBookingNotification(
                NOTIFICATION_TYPES.UPCOMING,
                booking,
                'arriving'
            );
            this.markAlerted(booking.bookingId, 'upcoming');
        }
    }

    /**
     * Checks and sends arrived notification
     */
    checkArrivedNotification(booking, now, startTime, endTime) {
        if (!this.isAlerted(booking.bookingId, 'arrived') && 
            now >= startTime && 
            (!endTime || now < endTime)) {
            
            this.sendBookingNotification(
                NOTIFICATION_TYPES.ARRIVED,
                booking,
                'arrived'
            );
            this.markAlerted(booking.bookingId, 'arrived');
        }
    }

    /**
     * Checks and sends completed notification
     */
    checkCompletedNotification(booking, now, endTime) {
        if (endTime && 
            !this.isAlerted(booking.bookingId, 'completed') && 
            now > endTime) {
            
            this.sendBookingNotification(
                NOTIFICATION_TYPES.COMPLETED,
                booking,
                'completed'
            );
            this.markAlerted(booking.bookingId, 'completed');
        }
    }

    /**
     * Sends a notification for a booking
     */
    sendBookingNotification(type, booking, newStatus) {
        const location = booking.parkingSpace.name;
        let title, message;

        switch (type) {
            case NOTIFICATION_TYPES.UPCOMING:
                title = 'Upcoming Booking';
                message = `Your booking at ${location} starts in less than 10 minutes!`;
                break;
            case NOTIFICATION_TYPES.ARRIVED:
                title = 'Booking Started';
                message = `Welcome to ${location}! Your parking session has started.`;
                break;
            case NOTIFICATION_TYPES.COMPLETED:
                title = 'Booking Completed';
                message = `Your booking at ${location} has ended. Thank you for using our service!`;
                break;
            case NOTIFICATION_TYPES.CONFIRMED:
                title = 'Booking Confirmed';
                message = `Your booking at ${location} has been confirmed.`;
                break;
        }

        this.scheduleNotification(title, message, {
            bookingId: booking.bookingId,
            type,
            location,
            newStatus
        });
    }

    /**
     * Utility to check if a notification has been sent
     */
    isAlerted(bookingId, type) {
        return this.alertedBookings.has(`${bookingId}-${type}`);
    }

    /**
     * Utility to mark a notification as sent
     */
    markAlerted(bookingId, type) {
        this.alertedBookings.add(`${bookingId}-${type}`);
    }

    /**
     * Utility to create a date object from time string
     */
    createDateFromTime(date, time) {
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours));
        newDate.setMinutes(parseInt(minutes));
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        return newDate;
    }

    /**
     * Utility to check if two dates are the same day
     */
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
}
