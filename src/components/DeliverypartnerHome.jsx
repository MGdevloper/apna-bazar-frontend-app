import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Logout from './Logout';

const DeliverypartnerHome = ({ navigation, route }) => {
  const email = route?.params?.email || '';

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#4a2f7c', '#7a51c6']} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.brand}>Apna Bazar</Text>
            <Text style={styles.role}>Delivery Partner</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="bike-fast" size={22} color="#4a2f7c" />
          </View>
        </View>
        <Text style={styles.greeting} numberOfLines={1}>
          Ready for deliveries{email ? `, ${email}` : ''}
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today</Text>

        <TouchableOpacity style={styles.tile}>
          <Icon name="truck-fast" size={22} color="#4a2f7c" />
          <Text style={styles.tileText}>Assigned Deliveries</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile}>
          <Icon name="map" size={22} color="#4a2f7c" />
          <Text style={styles.tileText}>Route Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile}>
          <Icon name="cash" size={22} color="#4a2f7c" />
          <Text style={styles.tileText}>Earnings</Text>
        </TouchableOpacity>

        <Logout
          style={styles.logout}
          textStyle={styles.logoutText}
          navigation={navigation}
        />
      </View>
    </SafeAreaView>
  );
};

export default DeliverypartnerHome;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7f5fb',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 70,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Medium',
  },
  role: {
    fontSize: 14,
    color: '#e8defa',
    marginTop: 2,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffffcc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    marginTop: 18,
    color: '#efe7ff',
    fontSize: 14,
  },
  card: {
    marginTop: -40,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b2a63',
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f2ecff',
  },
  tileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2a1f',
  },
  logout: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#4a2f7c',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
