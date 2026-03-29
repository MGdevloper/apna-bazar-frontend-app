import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Config from 'react-native-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { io } from 'socket.io-client';
import keychain from 'react-native-keychain';
import axios from 'axios';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [assigningOrderId, setAssigningOrderId] = useState('');

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
      status: orderData.status || 'pending',
      date: formatDate(orderData.createdAt),
      createdAt: orderData.createdAt || null,
      deliveryPartnerId: orderData.deliveryPartnerId || null,
      deliveryPartnerName: orderData.deliveryPartnerName || '',
      deliveryPartnerEarning: Number(orderData.deliveryPartnerEarning || 25),
      rawItems: orderData.items,
    };
  };

  useEffect(() => {
    async function getorders() {


      let pass = await keychain.getGenericPassword()
      let token = JSON.parse(pass.password).token

      try {
        let res = await axios.post(`${Config.API_URL}/getorders`, { customerId: token })
        if (res.data?.success) {
          const mappedOrders = (res.data.orders || [])
            .map(normalizeOrder)
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

          setOrders(mappedOrders);
        }



      } catch (error) {
        console.log(error);

      }
    }


    getorders()
  }, []);

  useEffect(() => {
    async function loadDeliveryPartners() {
      try {
        const pass = await keychain.getGenericPassword();
        const token = JSON.parse(pass.password).token;
        const profileRes = await axios.post(`${Config.API_URL}/getprofile`, { token });

        if (profileRes.data?.success) {
          const partners = profileRes.data?.user?.deliverypartners || [];
          setDeliveryPartners(partners);
        }
      } catch (error) {
        console.log('failed to load delivery partners', error);
      }
    }

    loadDeliveryPartners();
  }, []);

  useEffect(() => {
    const socket = io(`${Config.API_URL}`);

    // Step 1: Connect and join room with shopkeeper token
    const joinRoom = async () => {
      try {
        const pass = await keychain.getGenericPassword();
        if (pass?.password) {
          const { token } = JSON.parse(pass.password);
          console.log('Shopkeeper joining room with token');
          // Emit join_shopkeeper to backend to add socket to room
          socket.emit('join_shopkeeper', token);
        }
      } catch (error) {
        console.error('Failed to join shopkeeper room:', error);
      }
    };

    // Step 2: Join room immediately
    joinRoom();

    // Step 3: Listen for new orders AFTER joined
    socket.on('new_order', (orderData) => {
      console.log('====================================');
      console.log('NEW ORDER RECEIVED:', orderData);
      console.log('====================================');

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
    });

    socket.on('order_status_updated', (orderData) => {
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
    });

    // Cleanup on unmount
    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
      socket.disconnect();
    };
  }, []);

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

  const getStatusLabel = (status) => {
    const readable = String(status || '').replaceAll('_', ' ');
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      const pass = await keychain.getGenericPassword();
      const token = JSON.parse(pass.password).token;

      const res = await axios.post(`${Config.API_URL}/updateorderstatus`, {
        token,
        orderId,
        status,
      });

      if (res.data?.success && res.data?.order) {
        const formattedOrder = normalizeOrder(res.data.order);
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
      }
    } catch (error) {
      console.log('status update failed', error);
    } finally {
      setUpdatingOrderId('');
    }
  };

  const assignDeliveryPartner = async (orderId, partner) => {
    try {
      setAssigningOrderId(orderId);
      const pass = await keychain.getGenericPassword();
      const token = JSON.parse(pass.password).token;

      const res = await axios.post(`${Config.API_URL}/assigndeliverypartner`, {
        token,
        orderId,
        deliveryPartnerId: partner?._id,
      });

      if (res.data?.success && res.data?.order) {
        const formattedOrder = normalizeOrder(res.data.order);
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

        setSelectedOrder(formattedOrder);
      }
    } catch (error) {
      console.log('assign delivery partner failed', error);
    } finally {
      setAssigningOrderId('');
    }
  };

  const renderOrderCard = ({ item }) => {
    // Get first few items to display
    const displayItems = item?.rawItems || [];
    const itemsPreview = displayItems
      .slice(0, 2)
      .map(it => `${it.itemName} x${it.count || 1}`)
      .join(', ');
    const moreItems = displayItems.length > 2 ? `+${displayItems.length - 2} more` : '';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.id}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {/* Items Preview */}
        <View style={styles.itemsPreviewContainer}>
          <Icon name="package-variant-closed" size={14} color="#2f6d1a" />
          <Text style={styles.itemsPreviewText}>
            {itemsPreview} {moreItems}
          </Text>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Icon name="package-variant" size={16} color="#6b7280" />
            <Text style={styles.detailLabel}>{item.itemsCount} items</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="currency-inr" size={16} color="#2f6d1a" />
            <Text style={styles.detailAmount}>₹{item.total}</Text>
          </View>
          <Text style={styles.detailDate}>{item.date}</Text>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => setSelectedOrder(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#2f6d1a" />
        </TouchableOpacity>

        {item.status === 'pending' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              activeOpacity={0.85}
              disabled={updatingOrderId === item._id}
              onPress={() => updateOrderStatus(item._id, 'rejected')}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              activeOpacity={0.85}
              disabled={updatingOrderId === item._id}
              onPress={() => updateOrderStatus(item._id, 'accepted')}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedOrder) {
      return null;
    }

    return (
      <Modal
        visible={Boolean(selectedOrder)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedOrder(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.85}
              >
                <Icon name="close" size={18} color="#1c2b1f" />
              </TouchableOpacity>
            </View>

            <Text style={styles.metaText}>Order: {selectedOrder.id}</Text>
            <Text style={styles.metaText}>Customer: {selectedOrder.customerName}</Text>
            <Text style={styles.metaText}>Status: {getStatusLabel(selectedOrder.status)}</Text>
            <Text style={styles.metaText}>Date: {selectedOrder.date}</Text>
            {selectedOrder.deliveryPartnerName ? (
              <Text style={styles.metaText}>Delivery Partner: {selectedOrder.deliveryPartnerName}</Text>
            ) : null}

            <View style={styles.modalDivider} />

            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              {selectedOrder.rawItems.map((product, index) => {
                const count = Number(product?.count || 1);
                const unitPrice = Number(product?.price || 0);
                const lineTotal = count * unitPrice;

                return (
                  <View style={styles.detailRow} key={`${selectedOrder._id}-${product?._id || index}`}>
                    <View style={styles.detailLeft}>
                      <Text style={styles.detailName}>{product?.itemName || 'Item'}</Text>
                      <Text style={styles.detailMeta}>
                        {product?.variant || '-'} • Qty {count}
                      </Text>
                    </View>
                    <View style={styles.detailRight}>
                      <Text style={styles.detailPrice}>₹{unitPrice}</Text>
                      <Text style={styles.detailLineTotal}>₹{lineTotal}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{selectedOrder.total}</Text>
            </View>

            {selectedOrder.status === 'accepted' ? (
              <>
                <View style={styles.modalDivider} />
                <Text style={styles.assignTitle}>Assign Delivery Partner</Text>
                <View style={styles.assignWrap}>
                  {deliveryPartners.length ? deliveryPartners.map((partner) => (
                    <TouchableOpacity
                      key={String(partner?._id || partner?.email)}
                      style={styles.assignChip}
                      activeOpacity={0.85}
                      disabled={assigningOrderId === selectedOrder._id}
                      onPress={() => assignDeliveryPartner(selectedOrder._id, partner)}
                    >
                      <Text style={styles.assignChipText}>{partner?.name || 'Partner'}</Text>
                    </TouchableOpacity>
                  )) : (
                    <Text style={styles.assignHint}>No delivery partner found in your profile.</Text>
                  )}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Orders</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>{orders.length}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />

      {renderDetailModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  headerBadge: {
    backgroundColor: '#2f6d1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemsPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2f6d1a',
  },
  itemsPreviewText: {
    fontSize: 12,
    color: '#1c2b1f',
    fontWeight: '500',
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  customerName: {
    fontSize: 12,
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
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8df',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#708076',
    fontWeight: '500',
  },
  detailAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2f6d1a',
  },
  detailDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e8df',
    marginTop: 8,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f6d1a',
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef3ed',
  },
  metaText: {
    fontSize: 12,
    color: '#55635a',
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e5ece2',
    marginVertical: 10,
  },
  itemsList: {
    maxHeight: 280,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3ef',
  },
  detailLeft: {
    flex: 1,
    marginRight: 10,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  detailName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c2b1f',
  },
  detailMeta: {
    fontSize: 11,
    color: '#708076',
    marginTop: 1,
  },
  detailPrice: {
    fontSize: 12,
    color: '#708076',
  },
  detailLineTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2f6d1a',
    marginTop: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignTitle: {
    fontSize: 13,
    color: '#1c2b1f',
    fontWeight: '700',
  },
  assignWrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#e8f5ec',
    borderWidth: 1,
    borderColor: '#b4dfc0',
  },
  assignChipText: {
    color: '#116734',
    fontWeight: '700',
    fontSize: 12,
  },
  assignHint: {
    color: '#7b827d',
    fontSize: 12,
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#b42318',
  },
  acceptButton: {
    backgroundColor: '#0f8a37',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
