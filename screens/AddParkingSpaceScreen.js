import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import axiosInstance from '../utils/axiosInstance';

const { width, height } = Dimensions.get('window');

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Bus', 'Truck', 'Bicycle', 'Van'];
const PARKING_TYPES = ['Open', 'Covered', 'Underground', 'Multilevel', 'Indoor', 'Outdoor'];

const FACILITIES = [
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'cctv', label: 'CCTV', icon: 'videocam' },
  { id: 'ev_charging', label: 'EV Charging', icon: 'electric-car' },
  { id: 'wheelchair', label: 'Wheelchair Access', icon: 'accessible' },
  { id: 'car_wash', label: 'Car Wash', icon: 'local-car-wash' },
  { id: 'restroom', label: 'Restroom', icon: 'wc' },
  { id: 'lighting', label: '24/7 Lighting', icon: 'lightbulb' },
  { id: 'payment', label: 'Card Payment', icon: 'credit-card' }
];

const VEHICLE_DIMENSIONS = {
  Car: { length: 4.5, width: 1.8, height: 1.5 },
  Motorcycle: { length: 2.1, width: 0.8, height: 1.4 },
  Bus: { length: 12, width: 2.5, height: 3.5 },
  Truck: { length: 8.5, width: 2.5, height: 3.2 },
  Bicycle: { length: 1.8, width: 0.6, height: 1.2 },
  Van: { length: 5.5, width: 2, height: 2.2 }
};

const AddParkingSpaceScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: PARKING_TYPES[0],
    latitude: '',
    longitude: '',
    facilities: new Set(),
  });

  const [vehicleSlots, setVehicleSlots] = useState([]);
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
      })
    ]).start();
  }, []);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleAddVehicleSlot = () => {
    setVehicleSlots([...vehicleSlots, {
      vehicleType: VEHICLE_TYPES[0],
      totalSlots: '',
      pricePerHour: '',
      dimensions: VEHICLE_DIMENSIONS[VEHICLE_TYPES[0]]
    }]);
  };

  const handleVehicleSlotChange = (index, field, value) => {
    const updatedSlots = [...vehicleSlots];
    if (field === 'vehicleType') {
      updatedSlots[index] = {
        ...updatedSlots[index],
        vehicleType: value,
        dimensions: VEHICLE_DIMENSIONS[value]
      };
    } else {
      updatedSlots[index][field] = value;
    }
    setVehicleSlots(updatedSlots);
  };

  const handleRemoveVehicleSlot = (index) => {
    const updatedSlots = vehicleSlots.filter((_, i) => i !== index);
    setVehicleSlots(updatedSlots);
  };

  const handleSubmit = async () => {
    const { 
      name, address, type, latitude, longitude, facilities
    } = formData;

    if (!name || !address || !type || !latitude || !longitude || vehicleSlots.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and add at least one vehicle slot!');
      return;
    }

    const isValidSlots = vehicleSlots.every(slot => 
      slot.vehicleType && 
      slot.totalSlots && 
      slot.pricePerHour
    );

    if (!isValidSlots) {
      Alert.alert('Error', 'Please fill all vehicle slot details!');
      return;
    }

    try {
      const response = await axiosInstance.post('/parking/add', {
        name,
        address,
        type,
        latitude: Number(latitude),
        longitude: Number(longitude),
        facilities: Array.from(facilities),
        vehicleSlots: vehicleSlots.map(slot => ({
          ...slot,
          totalSlots: Number(slot.totalSlots),
          pricePerHour: Number(slot.pricePerHour)
        }))
      });

      Alert.alert('Success', response.data.message);
      setFormData({
        name: '',
        address: '',
        type: PARKING_TYPES[0],
        latitude: '',
        longitude: '',
        facilities: new Set(),
      });
      setVehicleSlots([]);
    } catch (error) {
      console.error('Error adding parking space:', error.response ? error.response.data : error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to add parking space'
      );
    }
  };

  const toggleFacility = (facilityId) => {
    const newFacilities = new Set(formData.facilities);
    if (newFacilities.has(facilityId)) {
      newFacilities.delete(facilityId);
    } else {
      newFacilities.add(facilityId);
    }
    setFormData({ ...formData, facilities: newFacilities });
  };
  const renderFacilityButtons = () => (
    <View style={styles.facilitiesContainer}>
      <Text style={styles.sectionTitle}>Available Facilities</Text>
      <View style={styles.facilitiesGrid}>
        {FACILITIES.map((facility) => (
          <TouchableOpacity
            key={facility.id}
            style={[
              styles.facilityButton,
              formData.facilities.has(facility.id) && styles.facilityButtonActive
            ]}
            onPress={() => toggleFacility(facility.id)}
          >
            <LinearGradient
              colors={formData.facilities.has(facility.id) 
                ? ['#4F46E5', '#7C3AED']
                : ['#ffffff', '#ffffff']}
              style={styles.facilityGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon
                name={facility.icon}
                size={24}
                color={formData.facilities.has(facility.id) ? '#fff' : '#666'}
                style={styles.facilityIcon}
              />
              <Text
                style={[
                  styles.facilityText,
                  formData.facilities.has(facility.id) && styles.facilityTextActive
                ]}
              >
                {facility.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderVehicleSlotInputs = (slot, index) => (
    <Animated.View 
      key={index}
      style={[styles.slotContainer, {
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          })
        }]
      }]}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.slotGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.slotHeader}>
          <Text style={styles.slotTitle}>Vehicle Slot {index + 1}</Text>
          <TouchableOpacity 
            onPress={() => handleRemoveVehicleSlot(index)}
            style={styles.removeButton}
          >
            <Icon name="remove-circle" size={24} color="#dc3545" />
          </TouchableOpacity>
        </View>

        <View style={styles.pickerContainer}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.inputIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="directions-car" size={20} color="#fff" />
          </LinearGradient>
          <Picker
            selectedValue={slot.vehicleType}
            style={styles.picker}
            onValueChange={(value) => handleVehicleSlotChange(index, 'vehicleType', value)}
          >
            {VEHICLE_TYPES.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.inputIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="format-list-numbered" size={20} color="#fff" />
          </LinearGradient>
          <TextInput
            style={styles.input}
            placeholder="Total Slots"
            value={slot.totalSlots}
            onChangeText={(text) => handleVehicleSlotChange(index, 'totalSlots', text)}
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.inputIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="attach-money" size={20} color="#fff" />
          </LinearGradient>
          <TextInput
            style={styles.input}
            placeholder="Price per Hour"
            value={slot.pricePerHour}
            onChangeText={(text) => handleVehicleSlotChange(index, 'pricePerHour', text)}
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.dimensionsSection}>
          <Text style={styles.dimensionsTitle}>Vehicle Dimensions</Text>
          <View style={styles.dimensionsContainer}>
            <View style={styles.dimensionBox}>
              <Icon name="straighten" size={20} color="#4F46E5" />
              <Text style={styles.dimensionLabel}>Length</Text>
              <Text style={styles.dimensionValue}>{slot.dimensions.length}m</Text>
            </View>

            <View style={styles.dimensionBox}>
              <Icon name="swap-horiz" size={20} color="#4F46E5" />
              <Text style={styles.dimensionLabel}>Width</Text>
              <Text style={styles.dimensionValue}>{slot.dimensions.width}m</Text>
            </View>

            <View style={styles.dimensionBox}>
              <Icon name="height" size={20} color="#4F46E5" />
              <Text style={styles.dimensionLabel}>Height</Text>
              <Text style={styles.dimensionValue}>{slot.dimensions.height}m</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.headerContainer}>
            <Animated.View 
              style={[
                styles.headerContent, 
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Icon name="local-parking" size={60} color="#fff" style={styles.headerIcon} />
              <Text style={styles.header}>Add Parking Space</Text>
              <Text style={styles.subHeader}>Create a new parking location</Text>
            </Animated.View>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
                  opacity: fadeAnim
                }
              ]}
            >
              <BlurView intensity={100} style={styles.blurContainer}>
                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.inputIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="local-parking" size={20} color="#fff" />
                  </LinearGradient>
                  <TextInput
                    style={styles.input}
                    placeholder="Parking Space Name"
                    value={formData.name}
                    onChangeText={(text) => handleChange('name', text)}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.inputIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="location-on" size={20} color="#fff" />
                  </LinearGradient>
                  <TextInput
                    style={styles.input}
                    placeholder="Address"
                    value={formData.address}
                    onChangeText={(text) => handleChange('address', text)}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.pickerContainer}>
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.inputIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="category" size={20} color="#fff" />
                  </LinearGradient>
                  <Picker
                    selectedValue={formData.type}
                    style={styles.picker}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    {PARKING_TYPES.map((type) => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.coordinatesContainer}>
                  <View style={[styles.inputContainer, styles.coordinateInput]}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.inputIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="my-location" size={20} color="#fff" />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Latitude"
                      value={formData.latitude}
                      onChangeText={(text) => handleChange('latitude', text)}
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={[styles.inputContainer, styles.coordinateInput]}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.inputIconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="explore" size={20} color="#fff" />
                    </LinearGradient>
                    <TextInput
                      style={styles.input}
                      placeholder="Longitude"
                      value={formData.longitude}
                      onChangeText={(text) => handleChange('longitude', text)}
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {renderFacilityButtons()}

                <View style={styles.vehicleSlotsContainer}>
                  <Text style={styles.sectionTitle}>Vehicle Slots</Text>
                  {vehicleSlots.map((slot, index) => renderVehicleSlotInputs(slot, index))}
                  
                  <TouchableOpacity 
                    style={styles.addSlotButton}
                    onPress={handleAddVehicleSlot}
                  >
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.gradientButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="add-circle" size={24} color="#fff" />
                      <Text style={styles.buttonText}>Add Vehicle Slot</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="add-location-alt" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Add Parking Space</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 15,
    transform: [{ rotate: '-10deg' }],
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subHeader: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    marginTop: -30,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1E293B',
    paddingHorizontal: 15,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#1E293B',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  coordinateInput: {
    flex: 0.48,
  },
  facilitiesContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
    textAlign: 'center',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  facilityButton: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  facilityGradient: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityIcon: {
    marginRight: 8,
  },
  facilityText: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  facilityTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  slotContainer: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  slotGradient: {
    padding: 15,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  removeButton: {
    padding: 5,
  },
  dimensionsSection: {
    marginTop: 15,
  },
  dimensionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  dimensionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  dimensionBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  dimensionLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 5,
  },
  dimensionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 3,
  },
  addSlotButton: {
    marginVertical: 10,
  },
  submitButton: {
    marginTop: 20,
  },
  gradientButton: {
    height: 56,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  vehicleSlotsContainer: {
    marginTop: 20,
  }
});

export default AddParkingSpaceScreen;