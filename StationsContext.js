import React, { createContext, useState, useContext } from "react";

// Create the context
const StationsContext = createContext();

// Provider component
export const StationsProvider = ({ children }) => {
  const [selectedStationId, setSelectedStationId] = useState(null); // Store only the _id of the station

  // Function to set the selected station _id
  const selectStation = (stationId) => {
    setSelectedStationId(stationId);
  };

  return (
    <StationsContext.Provider value={{ selectedStationId, selectStation }}>
      {children}
    </StationsContext.Provider>
  );
};

// Custom hook to access the context
export const useStations = () => useContext(StationsContext);
