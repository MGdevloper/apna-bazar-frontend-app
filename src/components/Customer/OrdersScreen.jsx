import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import { io } from 'socket.io-client';
import keychain from 'react-native-keychain';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

let MapViewModule = null;
try {
  MapViewModule = require('react-native-maps');
} catch (error) {
  MapViewModule = null;
}

const MapView = MapViewModule?.default || null;
const Marker = MapViewModule?.Marker || null;
const AnimatedRegionClass = MapViewModule?.AnimatedRegion || null;

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mapPreviewFailed, setMapPreviewFailed] = useState(false);
  const bikeCoordinateRef = useRef(
    AnimatedRegionClass
      ? new AnimatedRegionClass({
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
      : null,
  );

  const formatDate = (isoDate) => {
    if (!isoDate) return '-';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-IN');
  };

  const normalizeOrder = (orderData) => {
    if (!orderData || !Array.isArray(orderData.items)) {
      return null;
    }

    const normalizedId = String(orderData._id || orderData.orderNumber || Date.now());

    return {
      _id: normalizedId,
      id: orderData.orderNumber || normalizedId,
      customerName: orderData.customerName || 'You',
      itemsCount: orderData.items.length,
      total: Number(orderData.total || 0),
      status: orderData.status || 'pending',
      date: formatDate(orderData.createdAt),
      createdAt: orderData.createdAt || null,
      deliveryLocation: orderData.deliveryLocation || null,
      rawItems: orderData.items,
    };
  };

  const animateBikeTo = (deliveryLocation) => {
    if (!bikeCoordinateRef.current) {
      return;
    }

    if (!deliveryLocation?.latitude || !deliveryLocation?.longitude) {
      return;
    }

    bikeCoordinateRef.current.timing({
      latitude: Number(deliveryLocation.latitude),
      longitude: Number(deliveryLocation.longitude),
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const pass = await keychain.getGenericPassword();
        const token = JSON.parse(pass.password).token;

        const res = await axios.post(`${Config.API_URL}/getcustomerorders`, { token });

        if (res.data?.success) {
          const mappedOrders = (res.data.orders || [])
            .map(normalizeOrder)
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          setOrders(mappedOrders);
        }
      } catch (error) {
        console.log('fetch customer orders failed', error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const socket = io(`${Config.API_URL}`);

    const joinRoom = async () => {
      try {
        const pass = await keychain.getGenericPassword();
        if (pass?.password) {
          const { token } = JSON.parse(pass.password);
          socket.emit('join_customer', token);
        }
      } catch (error) {
        console.log('join_customer failed', error);
      }
    };

    joinRoom();

    const upsertFromSocket = (orderData) => {
      const formattedOrder = normalizeOrder(orderData);
      if (!formattedOrder) return;

      setOrders(prev => {
        const existingIndex = prev.findIndex(
          order => order._id === formattedOrder._id || order.id === formattedOrder.id,
        );

        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = formattedOrder;
          return next;
        }

        return [formattedOrder, ...prev];
      });

      setSelectedOrder(prev => {
        if (!prev) return prev;
        if (prev._id === formattedOrder._id || prev.id === formattedOrder.id) {
          return formattedOrder;
        }
        return prev;
      });
    };

    socket.on('new_order', upsertFromSocket);
    socket.on('order_status_updated', upsertFromSocket);
    socket.on('delivery_location_updated', upsertFromSocket);

    return () => {
      socket.off('new_order', upsertFromSocket);
      socket.off('order_status_updated', upsertFromSocket);
      socket.off('delivery_location_updated', upsertFromSocket);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedOrder?.deliveryLocation) {
      return;
    }

    animateBikeTo(selectedOrder.deliveryLocation);
  }, [selectedOrder]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
        return '#10b981';
      case 'assigned_to_delivery':
        return '#0ea5e9';
      case 'out_for_delivery':
        return '#0284c7';
      case 'delivered':
        return '#0f766e';
      case 'rejected':
        return '#ef4444';
      case 'completed':
        return '#0f766e';
      default:
        return '#6b7280';
    }
  };

  const renderOrderCard = ({ item }) => {
    const itemsPreview = (item.rawItems || [])
      .slice(0, 2)
      .map(product => `${product.itemName} x${product.count || 1}`)
      .join(', ');
    const moreItems = (item.rawItems || []).length > 2
      ? `+${(item.rawItems || []).length - 2} more`
      : '';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.orderDate}>{item.date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{String(item.status).replaceAll('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.itemsPreviewContainer}>
          <Icon name="package-variant-closed" size={14} color="#2f6d1a" />
          <Text style={styles.itemsPreviewText}>{itemsPreview} {moreItems}</Text>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.itemsCount}>{item.itemsCount} items</Text>
          <Text style={styles.totalText}>₹{item.total}</Text>
        </View>

        {(item.status === 'assigned_to_delivery' || item.status === 'out_for_delivery') ? (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => {
              setMapPreviewFailed(false);
              setSelectedOrder(item);
              if (item?.deliveryLocation) {
                animateBikeTo(item.deliveryLocation);
              }
            }}
          >
            <Icon name="map-marker-path" size={16} color="#fff" />
            <Text style={styles.trackButtonText}>Track Delivery</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderTrackingModal = () => {
    if (!selectedOrder) {
      return null;
    }

    const lat = Number(selectedOrder?.deliveryLocation?.latitude || 20.5937);
    const lng = Number(selectedOrder?.deliveryLocation?.longitude || 78.9629);
    const heading = Number(selectedOrder?.deliveryLocation?.heading || 0);
    const speed = Number(selectedOrder?.deliveryLocation?.speed || 0);
    const lastUpdated = selectedOrder?.deliveryLocation?.updatedAt
      ? new Date(selectedOrder.deliveryLocation.updatedAt).toLocaleTimeString('en-IN')
      : '-';
    const staticMapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=650,350&z=15&l=map&pt=${lng},${lat},pm2rdm`;
    const openStreetViewUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

    return (
      <Modal
        visible={Boolean(selectedOrder)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Live Delivery Tracking</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
                <Icon name="close" size={18} color="#1c2b1f" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalOrderId}>Order: {selectedOrder.id}</Text>
            <View style={styles.mapWrap}>
              {Platform.OS === 'android' ? (
                <View style={styles.androidMapContainer}>
                  {!mapPreviewFailed ? (
                    <Image
                      source={{ uri: staticMapUrl }}
                      resizeMode="cover"
                      style={styles.androidMapImage}
                      onError={() => setMapPreviewFailed(true)}
                    />
                  ) : (
                    <View style={styles.androidMapErrorWrap}>
                      <Icon name="map-off" size={24} color="#8a8f95" />
                      <Text style={styles.androidMapErrorText}>Map preview unavailable right now.</Text>
                      <TouchableOpacity
                        style={styles.openMapBtn}
                        onPress={() => Linking.openURL(openStreetViewUrl)}
                      >
                        <Text style={styles.openMapBtnText}>Open In Browser</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.androidBikeOverlay}>
                    <Icon
                      name="bike-fast"
                      size={24}
                      color="#0f8a37"
                      style={{ transform: [{ rotate: `${heading}deg` }] }}
                    />
                  </View>
                </View>
              ) : MapView && Marker ? (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  {Marker.Animated && bikeCoordinateRef.current ? (
                    <Marker.Animated coordinate={bikeCoordinateRef.current}>
                      <View style={styles.bikeMarker}>
                        <Icon
                          name="bike-fast"
                          size={22}
                          color="#0f8a37"
                          style={{ transform: [{ rotate: `${heading}deg` }] }}
                        />
                      </View>
                    </Marker.Animated>
                  ) : (
                    <Marker
                      coordinate={{
                        latitude: lat,
                        longitude: lng,
                      }}
                    >
                      <View style={styles.bikeMarker}>
                        <Icon
                          name="bike-fast"
                          size={22}
                          color="#0f8a37"
                          style={{ transform: [{ rotate: `${heading}deg` }] }}
                        />
                      </View>
                    </Marker>
                  )}
                </MapView>
              ) : (
                <View style={styles.mapFallback}>
                  <Icon name="map-off" size={24} color="#8a8f95" />
                  <Text style={styles.mapFallbackText}>
                    Map module is not linked in this build yet.
                  </Text>
                  <Text style={styles.mapFallbackSubText}>
                    Rebuild app after installing react-native-maps.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.locationMetaRow}>
              <Text style={styles.locationMeta}>Speed: {Number.isFinite(speed) ? speed.toFixed(1) : '0'} m/s</Text>
              <Text style={styles.locationMeta}>Updated: {lastUpdated}</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
      />

      {renderTrackingModal()}
    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7f4',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8df',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  orderDate: {
    fontSize: 11,
    color: '#708076',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemsPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2f6d1a',
  },
  itemsPreviewText: {
    fontSize: 12,
    color: '#1c2b1f',
    fontWeight: '500',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsCount: {
    fontSize: 12,
    color: '#708076',
    fontWeight: '600',
  },
  totalText: {
    fontSize: 14,
    color: '#0f8a37',
    fontWeight: '700',
  },
  trackButton: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#0f8a37',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef3ed',
  },
  modalOrderId: {
    marginTop: 6,
    fontSize: 12,
    color: '#607062',
    fontWeight: '600',
  },
  mapWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d9e6d6',
  },
  map: {
    width: '100%',
    height: 280,
  },
  androidMapContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: '#e8efe7',
  },
  androidMapImage: {
    width: '100%',
    height: '100%',
  },
  androidMapErrorWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f4f7f4',
    paddingHorizontal: 20,
  },
  androidMapErrorText: {
    color: '#4f5b51',
    fontSize: 13,
    fontWeight: '600',
  },
  openMapBtn: {
    marginTop: 4,
    backgroundColor: '#0f8a37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openMapBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  androidBikeOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffea',
    borderWidth: 1,
    borderColor: '#cde5cf',
  },
  mapFallback: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7f4',
    gap: 8,
  },
  mapFallbackText: {
    color: '#4f5b51',
    fontSize: 13,
    fontWeight: '600',
  },
  mapFallbackSubText: {
    color: '#7b867e',
    fontSize: 12,
  },
  bikeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffee',
    borderWidth: 1,
    borderColor: '#cde5cf',
  },
  locationMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationMeta: {
    fontSize: 12,
    color: '#5e6f60',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#708076',
    fontSize: 14,
  },
});