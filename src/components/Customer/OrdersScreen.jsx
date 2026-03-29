import React, { useEffect, useState } from 'react';
import {
  FlatList,
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

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);

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
      rawItems: orderData.items,
    };
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
    };

    socket.on('new_order', upsertFromSocket);
    socket.on('order_status_updated', upsertFromSocket);

    return () => {
      socket.off('new_order', upsertFromSocket);
      socket.off('order_status_updated', upsertFromSocket);
      socket.disconnect();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
        return '#10b981';
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
            <Text style={styles.statusText}>{item.status}</Text>
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
      </View>
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
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#708076',
    fontSize: 14,
  },
});