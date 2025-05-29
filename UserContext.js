//UserContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState('user');

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('_id');
        const storedToken = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('role');

        if (storedUserId && storedToken) {
          setUserId(storedUserId);
          setToken(storedToken);
          setRole(storedRole);
        }
      } catch (error) {
        console.error('Error reading from AsyncStorage:', error);
      }
    };

    checkLoggedIn();
  }, []);

  const setUser = (userId, token, role) => {
    setUserId(userId);
    setToken(token);
    setRole(role);
  };

  return (
    <UserContext.Provider value={{ userId, token, role, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};
