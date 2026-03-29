import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import keychain from 'react-native-keychain';
import axios from 'axios';
import Config from 'react-native-config';
import { Linking } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);

  // Request location permission

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Apna Bazar needs access to your location to show nearby shops',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationPermission(true);
          return true;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Location permission denied',
            text2: 'Enable location to see nearby shops',
          });
          return false;
        }
      } else {
        // iOS requests permission automatically when using Geolocation
        setLocationPermission(true);
        return true;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Get customer's current location
  const getCustomerLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCustomerLocation(location);
          resolve(location);
        },
        error => {
          console.error('Location error:', error);
          Toast.show({
            type: 'error',
            text1: 'Location Error',
            text2: 'Unable to get your location',
          });
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  // Fetch nearby shops from backend
  const fetchNearbyShops = async (location) => {
    try {
      let pass = await keychain.getGenericPassword()
      let token = JSON.parse(pass.password).token
      const response = await axios.post(`${Config.API_URL}/getshops`, { token, location })

      if (response.data.success) {
        // Transform backend data to match shop card structure
        const transformedShops = (response.data.shops || []).map(shop => ({
          _id: shop._id,
          shopName: shop.shopname || 'Shop',
          shopkeeperName: shop.name || 'Shopkeeper',
          category: shop.category || 'General Store',
          distance: shop.distance ? String(shop.distance) : null,
          phone: shop.phone || '',
          address: shop.shopaddress?.area || shop.shopaddress?.city || '',
          isOpen: shop.isOpen !== undefined ? shop.isOpen : true,
        }));
        setShops(transformedShops);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to fetch shops',
          text2: response.data.message || 'Please try again later',
        });
      }
    } catch (error) {
      console.error('Fetch shops error:', error);

      // Mock data for development (remove when backend is ready)
      const mockShops = [
        {
          _id: '1',
          shopName: 'Fresh Vegetables Store',
          shopkeeperName: 'Rajesh Kumar',
          category: 'Grocery & Vegetables',
          location: { latitude: 28.7041, longitude: 77.1025 },
          distance: '0.5',
          phone: '+91 9876543210',
          address: 'Shop 12, Market Road, Delhi',
          isOpen: true,
        },
        {
          _id: '2',
          shopName: 'Daily Needs Mart',
          shopkeeperName: 'Amit Sharma',
          category: 'General Store',
          location: { latitude: 28.7051, longitude: 77.1035 },
          distance: '1.2',
          phone: '+91 9876543211',
          address: 'Shop 5, Main Bazaar, Delhi',
          isOpen: true,
        },
        {
          _id: '3',
          shopName: 'Organic Farm Products',
          shopkeeperName: 'Sunita Devi',
          category: 'Organic Store',
          location: { latitude: 28.7031, longitude: 77.1015 },
          distance: '2.1',
          phone: '+91 9876543212',
          address: 'Shop 8, Green Market, Delhi',
          isOpen: false,
        },
      ];

      // Use mock data as fallback
      setShops(mockShops);
    }
  };
  // 
  // Initialize on mount
  useEffect(() => {

    // console.log("refraceing");

    const initialize = async () => {
      setIsLoading(true);
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        try {
          const location = await getCustomerLocation();
          await fetchNearbyShops(location);
        } catch (error) {
          // Use default location or show shops without distance
          await fetchNearbyShops(null);
        }
      } else {
        await fetchNearbyShops(null);
      }
      setIsLoading(false);
    };

    initialize();
  }, []);

  // Refresh shops
  const handleRefresh = async () => {
    console.log('====================================');
    console.log("refrace");
    console.log('====================================');
    setIsRefreshing(true);
    if (locationPermission) {
      try {
        const location = await getCustomerLocation();
        await fetchNearbyShops(location);
      } catch (error) {
        await fetchNearbyShops(customerLocation);
      }
    } else {
      await fetchNearbyShops(null);
    }
    setIsRefreshing(false);
  };

  const handlecall = async (phone) => {



    let canCall = await Linking.canOpenURL(`tel:${phone}`);
    if (canCall) {
      Linking.openURL(`tel:${phone}`);
      return
    }
    else {
      Toast.show({
        type: 'info',
        text1: 'You can call on this number',
        text2: phone,
      })

      return
    }
  }

  // Filter shops by search query
  const filteredShops = shops.filter(
    shop =>
      shop.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.shopkeeperName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render shop card
  const renderShopCard = ({ item: shop }) => {
    return (
      <TouchableOpacity
        style={styles.shopCard}
        activeOpacity={0.8}
        
      >
        <View style={styles.shopCardHeader}>
          <View style={styles.shopIconWrap}>
            <Icon name="store" size={26} color="#2f6d1a" />
          </View>
          <View style={styles.shopHeaderInfo}>
            <View style={styles.shopNameRow}>
              <Text style={styles.shopName} numberOfLines={1}>
                {shop.shopName || 'Shop'}
              </Text>
              {shop.isOpen !== undefined && (
                <View style={[styles.statusBadge, shop.isOpen ? styles.openBadge : styles.closedBadge]}>
                  <Text style={[styles.statusText, shop.isOpen ? styles.openText : styles.closedText]}>
                    {shop.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.shopkeeperRow}>
              <Icon name="account" size={13} color="#6b7280" />
              <Text style={styles.shopkeeper} numberOfLines={1}>
                {shop.shopkeeperName || 'Shopkeeper'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.shopDetailsContainer}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailBadge}>
              <Icon name="tag" size={14} color="#2f6d1a" />
              <Text style={styles.detailText}>{shop.category || 'Store'}</Text>
            </View>

            {shop.distance && (
              <View style={styles.detailBadge}>
                <Icon name="map-marker" size={14} color="#2f6d1a" />
                <Text style={styles.detailText}>{String(Number(shop.distance).toFixed(2))} km away</Text>
              </View>
            )}
          </View>

          {shop.address && shop.address.trim() !== '' && (
            <View style={styles.addressRow}>
              <Icon name="map-marker-outline" size={13} color="#6b7280" />
              <Text style={styles.addressText} numberOfLines={2}>
                {String(shop.address)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.shopCardActions}>
          <TouchableOpacity onPress={() => handlecall(shop.phone)} style={styles.actionButton}>
            <Icon name="phone" size={16} color="#2f6d1a" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonPrimary}
            onPress={() => navigation.navigate('shopProducts', { shopId: shop._id, shopName: shop.shopName })}
          >
            <Icon name="shopping" size={16} color="#fff" />
            <Text style={styles.actionButtonTextPrimary}>View Products</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f6d1a" />
        <Text style={styles.loadingText}>Finding nearby shops...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops, categories..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Location Info */}
      {customerLocation && (
        <View style={styles.locationBanner}>
          <Icon name="map-marker-check" size={16} color="#2f6d1a" />
          <Text style={styles.locationText}>
            Showing shops near your location
          </Text>
          <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
            <Icon
              name={isRefreshing ? 'loading' : 'refresh'}
              size={16}
              color="#2f6d1a"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Shops List */}
      <FlatList
        data={filteredShops}
        renderItem={renderShopCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          () => (
            <View style={styles.emptyState}>
              <Icon name="store-off" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No shops found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'No shops available in your area'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1c2b1f',
  },
  locationBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: '#2f6d1a',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#2f6d1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  shopCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shopIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  shopHeaderInfo: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  shopName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1c2b1f',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openBadge: {
    backgroundColor: '#d1fae5',
  },
  closedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  openText: {
    color: '#065f46',
  },
  closedText: {
    color: '#991b1b',
  },
  shopkeeper: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  shopkeeperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopDetailsContainer: {
    marginBottom: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 8,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  shopCardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#2f6d1a',
    borderRadius: 10,
    gap: 6,
    backgroundColor: '#ffffff',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2f6d1a',
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#2f6d1a',
    borderRadius: 10,
    gap: 6,
    shadowColor: '#2f6d1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
  },
});