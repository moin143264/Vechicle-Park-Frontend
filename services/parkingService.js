import axiosInstance from '../utils/axiosInstance';

export const getAllParkingSpaces = async () => {
  try {
    const response = await axiosInstance.get('/parking/all');
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in parkingService:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(error.response.data.message || 'Failed to fetch parking spaces');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up the request: ' + error.message);
    }
  }
};

export const deleteParkingSpace = async (spaceId) => {
  try {
    const response = await axiosInstance.delete(`/parking/${spaceId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting parking space:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete parking space');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Error setting up the request: ' + error.message);
    }
  }
};


export const getParkingSpacesWithSlots = async () => {
  try {
    // Endpoint to fetch parking spaces with their slots
    const response = await axiosInstance.get('/parking/all-with-slots');
    return response.data;
  } catch (error) {
    console.error('Error fetching parking spaces with slots:', error);
    throw error;
  }
};

export const getParkingSpaceSlots = async (parkingSpaceId) => {
  try {
    const response = await axiosInstance.get(`/parking-slot/${parkingSpaceId}/slots`);
    return response.data;
  } catch (error) {
    console.error('Error fetching parking space slots:', error);
    throw error;
  }
};
