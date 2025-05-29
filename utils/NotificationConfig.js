// utils/NotificationConfig.js
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (!Device.isDevice) {
    // Running on emulator
    token = 'emulator-' + Date.now() + '-' + Math.random().toString(36).substring(7);
    return { token, isEmulator: true };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        token: null,
        isEmulator: false,
        error: 'Permission not granted'
      };
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id' // Replace with your project ID
    })).data;
  } catch (error) {
    // Fallback for any errors
    token = 'device-fallback-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return { token, isEmulator: false };
};

export const sendTestNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: "This is a test notification",
      data: { type: 'test' },
    },
    trigger: { seconds: 2 },
  });
};