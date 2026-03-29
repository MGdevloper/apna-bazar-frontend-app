import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Config from 'react-native-config';
import { io } from 'socket.io-client';
import keychain from 'react-native-keychain';
import Geolocation from 'react-native-geolocation-service';
import Logout from './Logout';

const DeliverypartnerHome = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const [orders, setOrders] = useState([]);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState('');

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
      customerName: orderData.customerName || 'Customer',
      itemsCount: orderData.items.length,
      total: Number(orderData.total || 0),
      status: orderData.status || 'assigned_to_delivery',
      date: formatDate(orderData.createdAt),
      createdAt: orderData.createdAt || null,
      earning: Number(orderData.deliveryPartnerEarning || 25),
      rawItems: orderData.items,
    };
  };

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      try {
        const pass = await keychain.getGenericPassword();
        const token = JSON.parse(pass.password).token;

        const res = await axios.post(`${Config.API_URL}/getdeliverypartnerorders`, { token });

        if (res.data?.success) {
          const mappedOrders = (res.data.orders || [])
            .map(normalizeOrder)
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          setOrders(mappedOrders);
        }
      } catch (error) {
        console.log('fetch delivery orders failed', error);
      }
    };

    fetchAssignedOrders();
  }, []);

  useEffect(() => {
    const socket = io(`${Config.API_URL}`);

    const joinRoom = async () => {
      try {
        const pass = await keychain.getGenericPassword();
        if (pass?.password) {
          const { token } = JSON.parse(pass.password);
          socket.emit('join_deliverypartner', token);
        }
      } catch (error) {
        console.log('join_deliverypartner failed', error);
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
    };

    socket.on('order_assigned', upsertFromSocket);
    socket.on('order_status_updated', upsertFromSocket);

    return () => {
      socket.off('order_assigned', upsertFromSocket);
      socket.off('order_status_updated', upsertFromSocket);
      socket.disconnect();
    };
  }, []);

  const updateDeliveryStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      const pass = await keychain.getGenericPassword();
      const token = JSON.parse(pass.password).token;

      const res = await axios.post(`${Config.API_URL}/updatedeliveryorderstatus`, {
        token,
        orderId,
        status,
      });

      if (res.data?.success && res.data?.order) {
        const formatted = normalizeOrder(res.data.order);
        if (!formatted) return;

        setOrders(prev => {
          const existingIndex = prev.findIndex(
            order => order._id === formatted._id || order.id === formatted.id,
          );

          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = formatted;
            return next;
          }

          return [formatted, ...prev];
        });

        if (status === 'out_for_delivery') {
          setActiveTrackingOrderId(orderId);
        }
      }
    } catch (error) {
      console.log('update delivery status failed', error);
    } finally {
      setUpdatingOrderId('');
    }
  };

  const stats = useMemo(() => {
    const assigned = orders.filter(order => order.status === 'assigned_to_delivery').length;
    const outForDelivery = orders.filter(order => order.status === 'out_for_delivery').length;
    const delivered = orders.filter(order => order.status === 'delivered').length;
    const earnings = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + Number(order.earning || 25), 0);

    return { assigned, outForDelivery, delivered, earnings };
  }, [orders]);

  useEffect(() => {
    const firstOutForDelivery = orders.find(order => order.status === 'out_for_delivery');

    if (!activeTrackingOrderId && firstOutForDelivery) {
      setActiveTrackingOrderId(firstOutForDelivery._id);
      return;
    }

    if (activeTrackingOrderId && !firstOutForDelivery) {
      setActiveTrackingOrderId('');
    }
  }, [orders, activeTrackingOrderId]);

  useEffect(() => {
    const activeOrder = orders.find(order => order._id === activeTrackingOrderId);
    if (!activeOrder || activeOrder.status !== 'out_for_delivery') {
      return;
    }

    let cancelled = false;
    let intervalId = null;

    const ensureLocationPermission = async () => {
      if (Platform.OS !== 'android') {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    };

    const sendCurrentLocation = async () => {
      try {
        const pass = await keychain.getGenericPassword();
        const token = JSON.parse(pass.password).token;

        Geolocation.getCurrentPosition(
          async position => {
            if (cancelled) {
              return;
            }

            const { latitude, longitude, heading, speed } = position.coords;

            await axios.post(`${Config.API_URL}/updatedeliverylocation`, {
              token,
              orderId: activeOrder._id,
              latitude,
              longitude,
              heading,
              speed,
            });
          },
          error => {
            console.log('location fetch failed', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 2000,
            forceRequestLocation: true,
          },
        );
      } catch (error) {
        console.log('location push failed', error);
      }
    };

    const init = async () => {
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) {
        return;
      }

      await sendCurrentLocation();
      intervalId = setInterval(sendCurrentLocation, 7000);
    };

    init();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTrackingOrderId, orders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned_to_delivery':
        return '#0284c7';
      case 'out_for_delivery':
        return '#2563eb';
      case 'delivered':
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

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.orderMeta}>{item.customerName} • {item.date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replaceAll('_', ' ')}</Text>
          </View>
        </View>

        <Text style={styles.itemsText}>{itemsPreview}</Text>

        <View style={styles.orderBottom}>
          <Text style={styles.totalText}>Order Total: ₹{item.total}</Text>
          <Text style={styles.earningText}>Your earning: ₹{item.earning}</Text>
        </View>

        {item.status === 'assigned_to_delivery' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickupButton]}
            disabled={updatingOrderId === item._id}
            onPress={() => updateDeliveryStatus(item._id, 'out_for_delivery')}
          >
            <Text style={styles.actionButtonText}>Mark Out for Delivery</Text>
          </TouchableOpacity>
        ) : null}

        {item.status === 'out_for_delivery' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveredButton]}
            disabled={updatingOrderId === item._id}
            onPress={() => updateDeliveryStatus(item._id, 'delivered')}
          >
            <Text style={styles.actionButtonText}>Mark Delivered</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f5f12', '#3f8a22']} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.brand}>Apna Bazar</Text>
            <Text style={styles.role}>Delivery Partner</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="bike-fast" size={22} color="#1f5f12" />
          </View>
        </View>
        <Text style={styles.greeting} numberOfLines={1}>
          Ready for deliveries{email ? `, ${email}` : ''}
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery Dashboard</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.outForDelivery}</Text>
            <Text style={styles.statLabel}>On Route</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.delivered}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Icon name="cash-multiple" size={20} color="#0f8a37" />
          <Text style={styles.earningsText}>Today Earnings: ₹{stats.earnings}</Text>
          <Text style={styles.earningRule}>₹25 per delivered order</Text>
          <Text style={styles.trackingText}>
            {activeTrackingOrderId ? 'Live GPS tracking active' : 'Tracking starts when order is out for delivery'}
          </Text>
        </View>

        <Text style={styles.listTitle}>Assigned Orders</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No assigned deliveries yet.</Text>}
        />

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
    backgroundColor: '#eef4ec',
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
    color: '#e5f6df',
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
    color: '#ecfbe8',
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
    color: '#1f4f12',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eef8ec',
    borderWidth: 1,
    borderColor: '#d5e9d1',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f8a37',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f705f',
  },
  earningsCard: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f5fbf3',
    borderWidth: 1,
    borderColor: '#d8ebd5',
  },
  earningsText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#1d3b1f',
  },
  earningRule: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7a6d',
  },
  trackingText: {
    marginTop: 6,
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '700',
  },
  listTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#22352a',
  },
  listContent: {
    paddingBottom: 8,
    gap: 10,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#dde9da',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3023',
  },
  orderMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#6d7a6f',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  itemsText: {
    marginTop: 8,
    fontSize: 12,
    color: '#304235',
  },
  orderBottom: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 12,
    color: '#5b6d5d',
    fontWeight: '600',
  },
  earningText: {
    fontSize: 12,
    color: '#0f8a37',
    fontWeight: '700',
  },
  actionButton: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickupButton: {
    backgroundColor: '#0284c7',
  },
  deliveredButton: {
    backgroundColor: '#0f766e',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7b887d',
    paddingVertical: 18,
    fontSize: 13,
  },
  logout: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1f5f12',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
