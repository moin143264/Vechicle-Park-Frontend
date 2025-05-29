// utils/axiosInstance.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const axiosInstance = axios.create({
  baseURL: "https://vehicles-tau.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});
//https://vehicles-tau.vercel.app
// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Clear stored tokens
        await AsyncStorage.multiRemove(["token", "refreshToken"]);

        // You might want to redirect to login screen here
        // This requires setting up a navigation ref or using a navigation service
      }

      // Handle other specific error codes
      switch (error.response.status) {
        case 400:
          error.message = error.response.data.error || "Invalid request";
          break;
        case 404:
          error.message = "Resource not found";
          break;
        case 500:
          error.message = "Server error. Please try again later";
          break;
        default:
          error.message = error.response.data.error || "Something went wrong";
      }
    } else if (error.request) {
      error.message = "Network error. Please check your internet connection";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
//192.168.141.134
