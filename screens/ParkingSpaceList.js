import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  Layout,
  SlideInRight 
} from 'react-native-reanimated';
import { getAllParkingSpaces, deleteParkingSpace } from '../services/parkingService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const COLORS = {
  PRIMARY: '#4F46E5',
  SECONDARY: '#7C3AED',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  BACKGROUND: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT_PRIMARY: '#1E293B',
  TEXT_SECONDARY: '#64748B',
  BORDER: '#E2E8F0',
  CARD_BG: 'rgba(255, 255, 255, 0.95)',
  GRADIENT_START: '#4F46E5',
  GRADIENT_END: '#7C3AED',
};

const STATUS_STYLES = {
  available: {
    colors: ['#10B981', '#059669'],
    icon: 'check-circle'
  },
  almostFull: {
    colors: ['#F59E0B', '#D97706'],
    icon: 'warning'
  },
  full: {
    colors: ['#EF4444', '#DC2626'],
    icon: 'error'
  }
};
const ParkingSpaceList = () => {
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchParkingSpaces();
  }, []);

  const fetchParkingSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllParkingSpaces();
      if (response.success && response.parkingSpaces) {
        setParkingSpaces(response.parkingSpaces);
      }
    } catch (err) {
      setError('Unable to fetch parking spaces. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (spaceId, name) => {
    Alert.alert(
      "Delete Parking Space",
      `Are you sure you want to delete "${name}"?`,
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await deleteParkingSpace(spaceId);
              setParkingSpaces(prevSpaces => 
                prevSpaces.filter(space => space.spaceId !== spaceId)
              );
              Alert.alert(
                "Success", 
                "Parking space deleted successfully",
                [{ text: "OK" }]
              );
            } catch (err) {
              Alert.alert(
                "Error", 
                "Failed to delete parking space. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const getStatusStyle = (availableSpots, totalSpots) => {
    const percentage = (availableSpots / totalSpots) * 100;
    if (percentage > 30) return STATUS_STYLES.available;
    if (percentage > 10) return STATUS_STYLES.almostFull;
    return STATUS_STYLES.full;
  };

  const getStatusText = (availableSpots, totalSpots) => {
    const percentage = (availableSpots / totalSpots) * 100;
    if (percentage > 30) return 'Available';
    if (percentage > 10) return 'Almost Full';
    return 'Full';
  };

  const getVehicleIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'car': return 'car';
      case 'motorcycle': return 'motorcycle';
      case 'van': return 'shuttle-van';
      case 'bicycle': return 'bicycle';
      case 'bus': return 'bus';
      case 'truck': return 'truck';
      default: return 'car';
    }
  };

  const getFeatureIcon = (feature) => {
    switch(feature.toLowerCase()) {
      case 'security cameras': 
      case 'cctv': return { name: 'video', color: '#3498db' };
      case 'ev charging': return { name: 'charging-station', color: '#27ae60' };
      case '24/7': 
      case '24/7 access': return { name: 'clock', color: '#8e44ad' };
      case 'covered': return { name: 'umbrella', color: '#e67e22' };
      case 'security': 
      case 'security guard': return { name: 'shield-alt', color: '#2c3e50' };
      case 'valet': 
      case 'valet service': return { name: 'car-side', color: '#16a085' };
      case 'car wash': return { name: 'car', color: '#2980b9' };
      case 'bike racks': return { name: 'bicycle', color: '#c0392b' };
      default: return { name: 'check-circle', color: '#7f8c8d' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDailyRevenue = (capacity, rates) => {
    const minRate = Math.min(...rates.map(slot => slot.pricePerHour));
    return formatCurrency((capacity * minRate * 24 * 0.7));
  };

  const calculateOccupancyRate = (available, total) => {
    return (((total - available) / total) * 100).toFixed(1);
  };
  const renderFeatureBadge = (feature) => {
    const { name, color } = getFeatureIcon(feature);
    
    return (
      <Animated.View
        key={feature}
        entering={FadeInDown.springify()}
        style={styles.featureBadge}
      >
        <LinearGradient
          colors={[color, color + '99']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureGradient}
        >
          <FontAwesome5 name={name} size={12} color={COLORS.WHITE} />
          <Text style={styles.featureText}>{feature}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderVehicleTypes = (vehicleSlots) => {
    const vehicleTypes = vehicleSlots.map(slot => slot.vehicleType.toLowerCase());
    
    return (
      <View style={styles.vehicleTypesContainer}>
        <Text style={styles.sectionTitle}>Accepted Vehicles</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehiclesList}
        >
          {vehicleTypes.map((type, index) => (
            <Animated.View
              key={type}
              entering={SlideInRight.delay(index * 100).springify()}
              style={styles.vehicleIconContainer}
            >
              <LinearGradient
                colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
                style={styles.vehicleIconGradient}
              >
                <FontAwesome5 
                  name={getVehicleIcon(type)} 
                  size={18} 
                  color={COLORS.WHITE} 
                />
                <Text style={styles.vehicleTypeText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDetailItem = (icon, label, value, color) => (
    <Animated.View
      entering={FadeInDown.springify()}
      style={styles.detailItem}
    >
      <LinearGradient
        colors={[color, color + '99']}
        style={styles.detailItemGradient}
      >
        <MaterialIcons name={icon} size={24} color={COLORS.WHITE} />
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderAdditionalDetails = (item) => (
    <View style={styles.additionalDetails}>
      <Text style={styles.sectionTitle}>Additional Details</Text>
      <View style={styles.detailsGrid}>
        {renderDetailItem(
          'attach-money',
          'Daily Revenue',
          calculateDailyRevenue(item.totalCapacity, item.vehicleSlots),
          '#27ae60'
        )}
        {renderDetailItem(
          'people',
          'Occupancy Rate',
          `${calculateOccupancyRate(item.totalAvailableSlots, item.totalCapacity)}%`,
          '#3498db'
        )}
        {renderDetailItem(
          'access-time',
          'Peak Hours',
          '9 AM - 5 PM',
          '#e67e22'
        )}
        {renderDetailItem(
          'security',
          'Security Status',
          item.facilities.some(f => 
            f.toLowerCase().includes('security') || 
            f.toLowerCase().includes('cctv')
          ) ? '24/7 Active' : 'Basic',
          '#8e44ad'
        )}
      </View>
    </View>
  );

  const renderParkingCard = (item, index) => {
    const statusStyle = getStatusStyle(item.totalAvailableSlots, item.totalCapacity);
    const statusText = getStatusText(item.totalAvailableSlots, item.totalCapacity);

    return (
      <Animated.View
        key={item.spaceId}
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.cardContainer}
      >
        <BlurView intensity={100} style={styles.card}>
          <LinearGradient
            colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardHeader}
          >
            <View style={styles.nameContainer}>
              <MaterialIcons name="local-parking" size={24} color={COLORS.WHITE} />
              <Text style={styles.parkingName}>{item.name}</Text>
            </View>
            <View style={styles.rightContainer}>
              <LinearGradient
                colors={statusStyle.colors}
                style={styles.statusBadge}
              >
                <MaterialIcons name={statusStyle.icon} size={16} color={COLORS.WHITE} />
                <Text style={styles.statusText}>{statusText}</Text>
              </LinearGradient>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(item.spaceId, item.name)}
              >
                <MaterialIcons name="delete-outline" size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          <View style={styles.mainInfo}>
            <LinearGradient
              colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
              style={styles.infoCard}
            >
              <View style={styles.infoColumn}>
                <MaterialIcons name="local-parking" size={24} color={COLORS.WHITE} />
                <Text style={styles.spotCount}>
                  {item.totalAvailableSlots}/{item.totalCapacity}
                </Text>
                <Text style={styles.spotLabel}>Available Spots</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.infoColumn}>
                <MaterialIcons name="payments" size={24} color={COLORS.WHITE} />
                <Text style={styles.rateText}>
                  {formatCurrency(Math.min(...item.vehicleSlots.map(slot => slot.pricePerHour)))}+
                </Text>
                <Text style={styles.rateLabel}>per hour</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.infoColumn}>
                <MaterialIcons name="location-on" size={24} color={COLORS.WHITE} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.address}
                </Text>
                <Text style={styles.addressLabel}>Location</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Features</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuresList}
            >
              {item.facilities.map(feature => renderFeatureBadge(feature))}
            </ScrollView>
          </View>

          {renderVehicleTypes(item.vehicleSlots)}

          <View style={styles.divider} />
          
          {renderAdditionalDetails(item)}
        </BlurView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient
          colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={COLORS.WHITE} />
          <View style={styles.loadingTextContainer}>
            <MaterialIcons name="local-parking" size={30} color={COLORS.WHITE} />
            <Text style={styles.loadingText}>Loading parking spaces...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient
          colors={[COLORS.ERROR, '#ff6b6b']}
          style={styles.errorGradient}
        >
          <MaterialIcons name="error-outline" size={48} color={COLORS.WHITE} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchParkingSpaces}
          >
            <BlurView intensity={100} style={styles.retryButtonContent}>
              <MaterialIcons name="refresh" size={20} color={COLORS.WHITE} />
              <Text style={styles.retryText}>Tap to Retry</Text>
            </BlurView>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="local-parking" size={30} color={COLORS.WHITE} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Find Parking</Text>
            <Text style={styles.headerSubtitle}>
              {parkingSpaces.length} {parkingSpaces.length === 1 ? 'space' : 'spaces'} available
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {parkingSpaces.map((space, index) => renderParkingCard(space, index))}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  cardContainer: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: COLORS.CARD_BG,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parkingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 10,
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    padding: 8,
    borderRadius: 8,
  },
  mainInfo: {
    padding: 15,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 15,
  },
  infoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  spotCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 8,
  },
  spotLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  rateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 8,
  },
  rateLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginTop: 8,
    textAlign: 'center',
  },
  addressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 15,
    marginVertical: 15,
  },
  featuresContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  featuresList: {
    paddingRight: 15,
  },
  featureBadge: {
    marginRight: 8,
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  vehicleTypesContainer: {
    padding: 15,
  },
  vehiclesList: {
    paddingRight: 15,
  },
  vehicleIconContainer: {
    marginRight: 10,
  },
  vehicleIconGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  vehicleTypeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  additionalDetails: {
    padding: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailItemGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
    marginTop: 8,
    opacity: 0.9,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  errorGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.WHITE,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  retryText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParkingSpaceList;