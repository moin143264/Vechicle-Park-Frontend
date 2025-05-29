import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';

const PenaltyPayment = ({ route, navigation }) => {
  const { clientSecret, bookingId, amount } = route.params;
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (loading) {
        e.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation, loading]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card'
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      await axios.post(`https://vehicles-tau.vercel.app/checkout/${bookingId}`, {
        overtimeCharges: amount,
        paymentIntentId: paymentIntent.id
      });

      Alert.alert('Success', 'Payment successful and vehicle checked out', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('ManageParking', { refresh: true });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Penalty Payment</Text>
      <Text style={styles.amount}>Amount to Pay: ₹{amount}</Text>
      
      <CardField
        postalCodeEnabled={false}
        style={styles.cardField}
        onCardChange={(cardDetails) => {
          console.log('cardDetails', cardDetails);
        }}
      />

      <TouchableOpacity
        style={[styles.payButton, loading && styles.disabledButton]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  amount: {
    fontSize: 18,
    marginBottom: 30,
  },
  cardField: {
    height: 50,
    marginBottom: 30,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PenaltyPayment;