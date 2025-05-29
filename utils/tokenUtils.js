import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Function to validate the token with the backend
export const validateToken = async (token) => {
  try {
    const response = await axios.post(
      "https://vehicles-tau.vercel.app/validate-token",
      { token }
    );
    return response.data.isValid; // Assuming your backend returns an object with an isValid property
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

// Function to renew the token
export const renewToken = async (token) => {
  try {
    const response = await axios.post(
      "https://vehicles-tau.vercel.app/renew-token",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`, // Send the token in the Authorization header
        },
      }
    );
    return response.data.token; // Assuming the new token is returned in this format
  } catch (error) {
    console.error("Error renewing token:", error);
    return null;
  }
};
// Function to check the token and set the initial route
export const checkToken = async (setInitialRoute) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      const isValidToken = await validateToken(token);
      if (isValidToken) {
        setInitialRoute("Home");
      } else {
        const newToken = await renewToken(token); // Pass the current token to renew it
        if (newToken) {
          await AsyncStorage.setItem("token", newToken);
          setInitialRoute("Home");
        } else {
          setInitialRoute("Login");
        }
      }
    } else {
      setInitialRoute("Login");
    }
  } catch (error) {
    console.error("Error checking token:", error);
    setInitialRoute("Login");
  }
};
