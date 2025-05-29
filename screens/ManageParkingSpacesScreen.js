import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#4F46E5',
  SECONDARY: '#7C3AED',
  ACCENT: '#2563EB',
  SUCCESS: '#10B981',
  INFO: '#3B82F6',
  TEXT_PRIMARY: '#1E293B',
  TEXT_SECONDARY: '#64748B',
  BACKGROUND: '#F8FAFC',
  WHITE: '#FFFFFF',
};

const ManageParkingSpacesScreen = ({ navigation }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const renderCard = (icon, title, colors, onPress, index) => {
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY }, { scale: scaleAnim }],
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.card} 
          onPress={onPress}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Icon name={icon} size={32} color={COLORS.WHITE} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>
                  {title === 'Add Parking' 
                    ? 'Create a new parking space' 
                    : 'View and manage parking spaces'}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={COLORS.WHITE} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY, COLORS.ACCENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <Text style={styles.header}>Manage Parking Spaces</Text>
          <Text style={styles.subHeader}>Add or manage your parking spaces</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.contentContainer,
            {
              transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <BlurView intensity={100} style={styles.blurContainer}>
            <View style={styles.cardsContainer}>
              {renderCard(
                'add-location-alt',
                'Add Parking',
                [COLORS.SUCCESS, '#059669'],
                () => navigation.navigate('AddParkingSpaceScreen'),
                0
              )}
              {renderCard(
                'local-parking',
                'All Parking Spaces',
                [COLORS.PRIMARY, COLORS.SECONDARY],
                () => navigation.navigate('ParkingSpaceList'),
                1
              )}
            </View>
          </BlurView>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
  },
  gradient: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subHeader: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  cardsContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default ManageParkingSpacesScreen;