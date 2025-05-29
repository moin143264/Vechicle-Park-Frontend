import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Platform,
  Dimensions 
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  Layout 
} from 'react-native-reanimated';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

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
  succeeded: {
    colors: ['#10B981', '#059669'],
    icon: 'check-circle'
  },
  pending: {
    colors: ['#F59E0B', '#D97706'],
    icon: 'schedule'
  },
  failed: {
    colors: ['#EF4444', '#DC2626'],
    icon: 'error'
  }
};
export default function PaymentManagementScreen() {
  // State Management
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilterAnimation, setShowFilterAnimation] = useState(false);

  // Fetch Payments Function
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dateParam = selectedDate 
        ? selectedDate.toISOString().split('T')[0] 
        : null;
      
      const url = dateParam 
        ? `https://vehicles-tau.vercel.app/payments?date=${dateParam}` 
        : 'https://vehicles-tau.vercel.app/payments';
      
      const response = await axios.get(url);
      
      setPayments(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError('Unable to fetch payments. Please check your connection and try again.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    setSelectedDate(currentDate);
    setIsFiltered(true);
    setShowFilterAnimation(true);
    setTimeout(() => setShowFilterAnimation(false), 500);
  };

  const clearDateFilter = () => {
    setIsFiltered(false);
    setSelectedDate(null);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusStyle = (status) => {
    return STATUS_STYLES[status] || STATUS_STYLES.pending;
  };

  const renderPaymentItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      exiting={FadeOutUp.springify()}
      layout={Layout.springify()}
      style={styles.paymentCardContainer}
    >
      <BlurView intensity={100} style={styles.paymentCard}>
        <LinearGradient
          colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.paymentHeader}
        >
          <View style={styles.amountContainer}>
            <Icon name="payment" size={24} color={COLORS.WHITE} />
            <Text style={styles.amountText}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Icon name="calendar-today" size={20} color={COLORS.WHITE} />
            <Text style={styles.dateText}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.paymentDetails}>
          {[
            { 
              icon: 'email',
              label: 'User Email',
              value: item.userEmail,
              gradient: ['#3498db', '#2980b9']
            },
            { 
              icon: 'directions-car',
              label: 'Vehicle Type',
              value: item.vehicleType,
              gradient: ['#9b59b6', '#8e44ad']
            },
            { 
              icon: 'pin',
              label: 'Number Plate',
              value: item.numberPlate,
              gradient: ['#e67e22', '#d35400']
            },
            { 
              icon: getStatusStyle(item.paymentStatus).icon,
              label: 'Payment Status',
              value: item.paymentStatus,
              gradient: getStatusStyle(item.paymentStatus).colors
            }
          ].map((detail, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(idx * 100).springify()}
              style={styles.detailRow}
            >
              <LinearGradient
                colors={detail.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.detailGradient}
              >
                <View style={styles.iconLabelContainer}>
                  <Icon 
                    name={detail.icon} 
                    size={20} 
                    color={COLORS.WHITE}
                  />
                  <Text style={styles.labelText}>{detail.label}</Text>
                </View>
                <Text style={styles.valueText}>
                  {detail.value}
                </Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderHeader = () => (
    <>
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleContainer}
      >
        <View style={styles.titleContent}>
          <Icon name="payment" size={30} color={COLORS.WHITE} />
          <Text style={styles.title}>Payment Management</Text>
          
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <BlurView intensity={100} style={styles.filterButtonContent}>
              <Icon 
                name="filter-list" 
                size={24} 
                color={COLORS.WHITE} 
              />
            </BlurView>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isFiltered && selectedDate && (
        <Animated.View 
          entering={FadeInDown.springify()}
          exiting={FadeOutUp.springify()}
          style={styles.filterIndicator}
        >
          <BlurView intensity={100} style={styles.filterContent}>
            <View style={styles.filterTextContainer}>
              <Icon name="event" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.filterText}>
                Showing payments for {selectedDate.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={clearDateFilter}
            >
              <LinearGradient
                colors={[COLORS.ERROR, '#ff6b6b']}
                style={styles.clearFilterGradient}
              >
                <Icon name="close" size={20} color={COLORS.WHITE} />
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}
    </>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.emptyIconContainer}
      >
        <Icon name="inbox" size={50} color={COLORS.WHITE} />
      </LinearGradient>
      <Text style={styles.emptyText}>
        {isFiltered 
          ? "No payments found for selected date" 
          : "No payments available"
        }
      </Text>
      {isFiltered && (
        <TouchableOpacity
          style={styles.clearEmptyFilterButton}
          onPress={clearDateFilter}
        >
          <LinearGradient
            colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
            style={styles.clearEmptyFilterGradient}
          >
            <Icon name="refresh" size={20} color={COLORS.WHITE} />
            <Text style={styles.clearEmptyFilterText}>
              Clear Filter
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
    // Loading State
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <LinearGradient
            colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color={COLORS.WHITE} />
            <View style={styles.loadingTextContainer}>
              <Icon name="hourglass-empty" size={30} color={COLORS.WHITE} />
              <Text style={styles.loadingText}>Loading Payments...</Text>
            </View>
          </LinearGradient>
        </View>
      );
    }
  
    // Error State
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <LinearGradient
            colors={[COLORS.ERROR, '#ff6b6b']}
            style={styles.errorGradient}
          >
            <Icon name="error-outline" size={50} color={COLORS.WHITE} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onRefresh}
            >
              <BlurView intensity={100} style={styles.retryButtonContent}>
                <Icon name="refresh" size={20} color={COLORS.WHITE} />
                <Text style={styles.retryText}>Tap to Retry</Text>
              </BlurView>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }
  
    // Main Render
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
              title="Pull to refresh"
              titleColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
  
        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate || new Date()}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            textColor={COLORS.TEXT_PRIMARY}
          />
        )}
      </SafeAreaView>
    );
  }
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUND,
    },
    listContainer: {
      paddingBottom: 20,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.BACKGROUND,
      padding: 20,
    },
    titleContainer: {
      paddingTop: Platform.OS === 'ios' ? 50 : 16,
      paddingBottom: 16,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    titleContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginLeft: 10,
      color: COLORS.WHITE,
      flex: 1,
    },
    paymentCardContainer: {
      marginHorizontal: 15,
      marginVertical: 8,
    },
    paymentCard: {
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: COLORS.CARD_BG,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    amountText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.WHITE,
      marginLeft: 8,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      color: COLORS.WHITE,
      marginLeft: 8,
      fontSize: 14,
    },
    paymentDetails: {
      padding: 15,
    },
    detailRow: {
      marginVertical: 6,
    },
    detailGradient: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
    },
    iconLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    labelText: {
      color: COLORS.WHITE,
      fontWeight: '600',
      marginLeft: 10,
      fontSize: 14,
    },
    valueText: {
      color: COLORS.WHITE,
      fontWeight: '500',
      fontSize: 14,
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
    },
    loadingText: {
      marginLeft: 10,
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
      borderRadius: 12,
    },
    retryText: {
      color: COLORS.WHITE,
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
    },
    filterButton: {
      overflow: 'hidden',
      borderRadius: 12,
    },
    filterButtonContent: {
      padding: 8,
      borderRadius: 12,
    },
    filterIndicator: {
      margin: 15,
    },
    filterContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: COLORS.CARD_BG,
    },
    filterTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterText: {
      color: COLORS.TEXT_PRIMARY,
      marginLeft: 8,
      fontSize: 14,
    },
    clearFilterButton: {
      overflow: 'hidden',
      borderRadius: 8,
    },
    clearFilterGradient: {
      padding: 8,
      borderRadius: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 30,
    },
    emptyIconContainer: {
      padding: 20,
      borderRadius: 50,
      marginBottom: 15,
    },
    emptyText: {
      color: COLORS.TEXT_SECONDARY,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    clearEmptyFilterButton: {
      overflow: 'hidden',
      borderRadius: 12,
    },
    clearEmptyFilterGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
    },
    clearEmptyFilterText: {
      color: COLORS.WHITE,
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
    },
    separator: {
      height: 8,
    },
  });