import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  StatusBar, 
  SafeAreaView,
  Dimensions,
  FlatList
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const AdminPanel = ({ navigation }) => {
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'name', 'role', '_id']);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const cardData = [
    {
      id: '1',
      title: 'Parking Management',
      subtitle: 'Add, Edit or Remove Parking Spaces',
      icon: 'local-parking',
      screen: 'ManageParkingSpacesScreen'
    },
    {
      id: '2',
      title: 'User Management',
      subtitle: 'Manage User Accounts & Access',
      icon: 'people',
      screen: 'ManageUsers'
    },
    {
      id: '3',
      title: 'Payment Management',
      subtitle: 'Track & Process Payments',
      icon: 'payments',
      screen: 'ManagePayment'
    }
  ];

  const renderCard = ({ item: card }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate(card.screen)}
      activeOpacity={0.9}
    >
      <Animated.View 
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradient}
        >
          <View style={styles.iconContainer}>
            <Icon name={card.icon} size={32} color="#FFFFFF" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
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
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.iconBackground}
            >
              <Icon 
                name="dashboard" 
                size={60} 
                color="#FFFFFF" 
                style={styles.headerIcon} 
              />
            </LinearGradient>
            <Text style={styles.headerText}>Admin Dashboard</Text>
            <Text style={styles.subHeaderText}>Smart Parking Management</Text>
          </Animated.View>
        </View>

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
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome Admin</Text>
              <Text style={styles.welcomeSubText}>Manage your parking system</Text>
            </View>

            <FlatList
              data={cardData}
              renderItem={renderCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.cardsContainer}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logoutGradient}
              >
                <Icon name="logout" size={24} color="#FFFFFF" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
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
  headerContainer: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    transform: [{ rotate: '-10deg' }],
  },
  headerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subHeaderText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    marginTop: -30,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  welcomeSection: {
    padding: 24,
    paddingBottom: 0,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  welcomeSubText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  cardsContainer: {
    padding: 24,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  logoutButton: {
    margin: 24,
    borderRadius: 15,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default AdminPanel;