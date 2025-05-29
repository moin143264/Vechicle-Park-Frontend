import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert, 
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#4F46E5',
  SECONDARY: '#7C3AED',
  ACCENT: '#2563EB',
  ERROR: '#EF4444',
  TEXT_PRIMARY: '#1E293B',
  TEXT_SECONDARY: '#64748B',
  WHITE: '#FFFFFF',
};

const ManageUsers = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      const response = await axios.get('https://vehicles-tau.vercel.app/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      await axios.delete(`https://vehicles-tau.vercel.app/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      Alert.alert('Success', 'User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  const confirmDelete = (userId) => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteUser(userId), style: "destructive" }
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    return (
      <Animated.View
        style={[
          styles.userCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.userIconContainer}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.iconGradient}
              >
                <Icon name="account-circle" size={30} color={COLORS.WHITE} />
              </LinearGradient>
            </View>
            <View style={styles.userMainInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDelete(item._id)}
              >
                <LinearGradient
                  colors={[COLORS.ERROR, '#DC2626']}
                  style={styles.deleteGradient}
                >
                  <Icon name="delete-outline" size={24} color={COLORS.WHITE} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.userDetails}>
            <View style={styles.detailRow}>
              <Icon name="email" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="lock" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.userPassword}>{item.password}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Manage Users</Text>
          <Text style={styles.subHeader}>Total Users: {users.length}</Text>
        </View>

        <View style={styles.contentContainer}>
          <BlurView intensity={100} style={styles.blurContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </BlurView>
        </View>
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
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.PRIMARY,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  userCard: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userIconContainer: {
    marginRight: 15,
  },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMainInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 65,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 10,
  },
  userPassword: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 10,
  },
  deleteButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  deleteGradient: {
    padding: 8,
    borderRadius: 12,
  }
});

export default ManageUsers;