import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure default notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
    }),
});

export const NOTIFICATION_TYPES = {
    CONFIRMED: 'CONFIRMED',
    UPCOMING: 'UPCOMING',
    ARRIVED: 'ARRIVED',
    COMPLETED: 'COMPLETED'
};

export const usePushNotifications = () => {
    const [notification, setNotification] = useState(null);
    const [notificationError, setNotificationError] = useState(null);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        setupNotifications();
        return cleanupNotifications;
    }, []);

    const setupNotifications = async () => {
        try {
            await setupAndroidChannel();
            setupNotificationListeners();
        } catch (error) {
            console.error('Error setting up notifications:', error);
            setNotificationError(error.message);
        }
    };

    const setupAndroidChannel = async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('booking-alerts', {
                name: 'Booking Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                enableVibrate: true,
                enableLights: true,
            });
        }
    };

    const setupNotificationListeners = () => {
        notificationListener.current = Notifications.addNotificationReceivedListener(
            notification => {
                console.log('Received notification:', notification);
                setNotification(notification);
            }
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            response => {
                console.log('Notification response:', response);
                handleNotificationResponse(response);
            }
        );
    };

    const cleanupNotifications = () => {
        if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
        }
    };

    const handleNotificationResponse = (response) => {
        // Handle notification taps here
        const data = response.notification.request.content.data;
        if (data.bookingId) {
            // Navigate to booking details or perform other actions
            console.log('Handling notification response for booking:', data.bookingId);
        }
    };

    const scheduleLocalNotification = async (title, body, data = {}, trigger = null) => {
        try {
            const notificationContent = {
                title,
                body,
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
                sound: true,
                priority: 'high',
                vibrate: [0, 250, 250, 250],
            };

            if (trigger) {
                await Notifications.scheduleNotificationAsync({
                    content: notificationContent,
                    trigger,
                });
                console.log('Scheduled notification:', { title, trigger });
            } else {
                await Notifications.presentNotificationAsync(notificationContent);
                console.log('Presented immediate notification:', { title });
            }
        } catch (error) {
            console.error('Error scheduling notification:', error);
            setNotificationError(error.message);
            throw error;
        }
    };

    return {
        notification,
        notificationError,
        scheduleLocalNotification,
        NOTIFICATION_TYPES,
    };
};
