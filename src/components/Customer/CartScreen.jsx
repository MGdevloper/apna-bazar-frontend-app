import React, { use, useContext, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import CustomerCartContext from '../../context/CustomerCart';
import keychain from 'react-native-keychain';
import { io } from 'socket.io-client';
import Config from 'react-native-config';
import axios from 'axios';
const formatCurrency = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatNumber = value => {
  const numericValue = Number(value || 0);

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return numericValue.toFixed(2).replace(/\.0+$|0+$/g, '').replace(/\.$/, '');
};

const getPackCount = item => Number(item?.count ?? item?.cartCount ?? 1);

const getVariantIdValue = variantId => {
  if (variantId && typeof variantId === 'object') {
    return variantId?.$oid || variantId?._id || '';
  }

  return variantId || '';
};

const getPerPackQty = item => Number(item?.unitQty ?? item?.quantity ?? 1);

const getUnitPrice = item => Number(item?.unitPrice ?? item?.price ?? 0);

const getLineTotal = item => {
  // If unitPrice exists, price is already tracked as line total in current app state.
  if (item?.unitPrice != null) {
    return Number(item?.price ?? 0);
  }

  return getUnitPrice(item) * getPackCount(item);
};

const getTotalQty = item => {
  if (item?.unitQty != null) {
    return Number(item?.quantity ?? 0);
  }

  return getPerPackQty(item) * getPackCount(item);
};

const CartScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomTabBarHeight = useContext(BottomTabBarHeightContext);
  const tabBarHeight = bottomTabBarHeight ?? 0;
  const isStandaloneCartScreen = bottomTabBarHeight == null;
  const {
    cartItem = [],
    updateCartItem,
    removeFromCart,
    clearCart,
    addToCart
  } = useContext(CustomerCartContext);

  
  const cartSummary = useMemo(() => {
    const subtotal = cartItem.reduce((sum, item) => sum + getLineTotal(item), 0);
    const totalPacks = cartItem.reduce((sum, item) => sum + getPackCount(item), 0);
    const grandTotal = subtotal;

    return {
      subtotal,
      totalPacks,
      grandTotal,
      uniqueItems: cartItem.length,
    };
  }, [cartItem]);



  const handleCheckout = async (items) => {
    if (!items || items.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
      });
      return;
    }

    try {
      // ✅ Use local variable, NOT state
      const groupedOrders = {};

      // Step 1: Group items by shopkeeperId
      items.forEach(item => {
        const shopId = String(item?.shopkeeperId || '');
        if (!shopId) return;

        if (!groupedOrders[shopId]) {
          groupedOrders[shopId] = [];
        }
        groupedOrders[shopId].push(item);
      });

      // Step 2: Calculate totals for each shopkeeper
      Object.keys(groupedOrders).forEach(shopId => {
        const total = groupedOrders[shopId].reduce(
          (sum, item) => sum + Number(item?.price || 0) * Number(item?.count || 1),
          0,
        );

        groupedOrders[shopId] = {
          items: groupedOrders[shopId],
          total,
        };
      });

      console.log('Sending grouped orders:', groupedOrders);
      let pass = await keychain.getGenericPassword()
      let token = JSON.parse(pass.password).token
      // Step 3: Send to backend
      const res = await axios.post(`${Config.API_URL}/placeorder`, { order:groupedOrders , customerId: token});

      if (res.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Order placed successfully!',
          text2: 'Shopkeeper will accept soon',
        });

        // Step 4: Clear cart
        clearCart();

        // Step 5: Navigate to Orders
        // setTimeout(() => {
        //   navigation.navigate('Orders');
        // }, 1000);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Order failed',
        text2: error?.response?.data?.message || 'Try again',
      });
    }
  };

  const renderHeader = () => (
    <>
      {isStandaloneCartScreen ? (
        <View style={styles.stackHeader}>
          <TouchableOpacity
            style={styles.stackBackBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="#1c2b1f" />
          </TouchableOpacity>

          <View style={styles.stackHeaderTextWrap}>
            <Text style={styles.stackHeaderTitle}>Cart</Text>
            <Text style={styles.stackHeaderSubTitle}>Review your selected products</Text>
          </View>
        </View>
      ) : null}

      <LinearGradient
        colors={['#1f5f12', '#3f8a22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroEyebrow}>Fresh picks</Text>
            <Text style={styles.heroTitle}>Your Cart</Text>
            <Text style={styles.heroSubtitle}>
              Review items, adjust quantities and place your order with confidence.
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Icon name="cart-heart" size={28} color="#1f5f12" />
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{cartSummary.uniqueItems}</Text>
            <Text style={styles.heroStatLabel}>Products</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{cartSummary.totalPacks}</Text>
            <Text style={styles.heroStatLabel}>Packs</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{formatCurrency(cartSummary.subtotal)}</Text>
            <Text style={styles.heroStatLabel}>Subtotal</Text>
          </View>
        </View>
      </LinearGradient>

      {cartItem.length > 0 ? (
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Cart items</Text>
            <Text style={styles.sectionSubTitle}>Professionally organized for quick review</Text>
          </View>

          <TouchableOpacity style={styles.clearBtn} activeOpacity={0.85} onPress={clearCart}>
            <Icon name="trash-can-outline" size={16} color="#b42318" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Icon name="cart-outline" size={48} color="#2f6d1a" />
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyText}>
        Start adding fresh products from nearby shops to see them here.
      </Text>
      <TouchableOpacity
        style={styles.shopNowBtn}
        activeOpacity={0.9}
        onPress={() => {
          if (isStandaloneCartScreen && navigation.canGoBack()) {
            navigation.goBack();
            return;
          }

          navigation.navigate('Home');
        }}
      >
        <Icon name="shopping-outline" size={18} color="#fff" />
        <Text style={styles.shopNowText}>Browse products</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!cartItem.length) {
      return null;
    }

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(cartSummary.subtotal)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryDivider]}>
          <Text style={styles.totalLabel}>Total payable</Text>
          <Text style={styles.totalValue}>{formatCurrency(cartSummary.grandTotal)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.92} onPress={() => handleCheckout(cartItem)}>
          <Text style={styles.checkoutBtnText}>Place Order</Text>
          <Icon name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const packCount = getPackCount(item);
    const unitQty = getPerPackQty(item);
    const unitPrice = getUnitPrice(item);
    const totalQty = getTotalQty(item);
    const variantId = item?.variantId;
    const lineTotal = getLineTotal(item);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTopRow}>
          <View style={styles.itemIconWrap}>
            <Icon name="package-variant-closed" size={22} color="#2f6d1a" />
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item?.itemName || 'Product'}</Text>
            <Text style={styles.itemMeta}>
              {formatNumber(totalQty)} {item?.variant || 'unit'} total • {packCount} pack{packCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.itemPackInfo}>
              {formatNumber(unitQty)} {item?.variant || 'unit'} per pack • {formatCurrency(unitPrice)} each
            </Text>
          </View>

          <TouchableOpacity
            style={styles.removeBtn}
            activeOpacity={0.85}
            onPress={() => removeFromCart(variantId)}
          >
            <Icon name="close" size={16} color="#b42318" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemBottomRow}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              disabled={packCount == 1}
              style={styles.quantityBtn}
              activeOpacity={0.85}
              onPress={() => updateCartItem(variantId)}
            >
              <Icon name="minus" size={18} color="#1c2b1f" />
            </TouchableOpacity>

            <View style={styles.quantityValueWrap}>
              <Text style={styles.quantityValue}>{packCount}</Text>
              <Text style={styles.quantityCaption}>pack{packCount > 1 ? 's' : ''}</Text>
            </View>

            <TouchableOpacity
              style={[styles.quantityBtn, styles.quantityBtnActive]}
              activeOpacity={0.85}
              onPress={async () => {
                let pass = await keychain.getGenericPassword()
                let token = JSON.parse(pass.password).token

                addToCart({ ...item, customerId: token })
              }}
            >
              <Icon name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceWrap}>
            <Text style={styles.priceLabel}>Line total</Text>
            <Text style={styles.priceValue}>{formatCurrency(lineTotal)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={cartItem}
        renderItem={renderItem}
        keyExtractor={item => getVariantIdValue(item?.variantId) || `${item?.itemName}-${item?.variant}`}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: tabBarHeight + insets.bottom + (Platform.OS === 'android' ? 24 : 18),
          flexGrow: 1,
        }}
      />
    </SafeAreaView>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7f4',
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stackBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2ebe0',
    marginRight: 12,
  },
  stackHeaderTextWrap: {
    flex: 1,
  },
  stackHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c2b1f',
  },
  stackHeaderSubTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 3,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#1f5f12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 7,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    color: '#d8f3cf',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#eef8ea',
    marginTop: 6,
    maxWidth: 240,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#f4fff0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#ddf0d8',
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c2b1f',
  },
  sectionSubTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff2f1',
    borderWidth: 1,
    borderColor: '#ffd5d2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearBtnText: {
    color: '#b42318',
    fontWeight: '700',
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5ece3',
    shadowColor: '#203124',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eff9ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c2b1f',
  },
  itemMeta: {
    fontSize: 13,
    color: '#4b6352',
    marginTop: 4,
  },
  itemPackInfo: {
    fontSize: 12,
    color: '#7b8a82',
    marginTop: 5,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff5f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemBottomRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#edf2ec',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7faf7',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2ebe0',
  },
  quantityBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnActive: {
    backgroundColor: '#2f6d1a',
  },
  quantityValueWrap: {
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c2b1f',
  },
  quantityCaption: {
    fontSize: 11,
    color: '#708076',
    marginTop: 1,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#708076',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f5f12',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e4ebe3',
    shadowColor: '#203124',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c2b1f',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#55695d',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#edf2ec',
    paddingTop: 14,
    marginTop: 2,
    marginBottom: 18,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f5f12',
  },
  checkoutBtn: {
    backgroundColor: '#2f6d1a',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#eaf5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c2b1f',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  shopNowBtn: {
    marginTop: 22,
    backgroundColor: '#2f6d1a',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopNowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});