import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import keychain from 'react-native-keychain';
import axios from 'axios';
import Config from 'react-native-config';
import CustomerCartContext from '../../context/CustomerCart';
import { SafeAreaView } from 'react-native-safe-area-context';
const ShopProducts = ({ navigation, route }) => {
  const { shopId, shopName } = route.params;
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  let cart = useContext(CustomerCartContext)

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {

    try {
      setIsLoading(true);
      console.log(route.params.shopId);

      const response = await axios.post(`${Config.API_URL}/getproducts`, { id: route.params.shopId });
      if (response.data.success) {
        console.log(response.data);

        setProducts(response.data.products || []);
      } else {
        Toast.show({ type: 'error', text1: 'Failed to load products' });
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      // Mock fallback
      setProducts([
        { _id: 'p1', name: 'Fresh Tomatoes', price: 40, unit: 'kg', stock: 50, description: 'Farm fresh tomatoes' },
        { _id: 'p2', name: 'Onions', price: 30, unit: 'kg', stock: 100, description: 'Premium quality onions' },
        { _id: 'p3', name: 'Potatoes', price: 25, unit: 'kg', stock: 80, description: 'Good quality potatoes' },
        { _id: 'p4', name: 'Green Chillies', price: 20, unit: '250g', stock: 30, description: 'Spicy green chillies' },
        { _id: 'p5', name: 'Coriander Leaves', price: 15, unit: 'bunch', stock: 20, description: 'Fresh coriander' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      {/* Product Header */}
      <View style={styles.productHeader}>
        <View style={styles.productIconWrap}>
          <Icon name="package-variant" size={26} color="#2f6d1a" />
        </View>
        <Text style={styles.productName}>{item.name}</Text>
      </View>

      {/* Variants */}
      {item.variants && item.variants.length > 0 ? (
        <View style={styles.variantsContainer}>
          {item.variants.map((variant) => (
            <View key={variant._id} style={styles.variantRow}>
              <View style={styles.variantLeft}>
                <Icon name="scale" size={13} color="#2f6d1a" />
                <Text style={styles.variantQtyUnit}>
                  {String(variant.quantity)} {variant.unit}
                </Text>
              </View>
              <View style={styles.variantRight}>
                <Text style={styles.variantPrice}>₹{String(variant.price)}</Text>
                <TouchableOpacity onPress={async () => {
                  // console.log("item", { item: item.name, ...variant });

                  let pass = await keychain.getGenericPassword()
                  let token = JSON.parse(pass.password)
                  console.log('====================================');
                  console.log({itemName:item.name,variant:variant.unit,quantity:variant.quantity,price:variant.price, shopkeeperId:route.params.shopId, customerId:token.token});
                  console.log('====================================');

                  cart.addToCart({itemName:item.name,variant:variant.unit,quantity:variant.quantity,variantId:variant._id,price:variant.price, shopkeeperId:route.params.shopId, customerId:token.token})
                }}
                  style={styles.addBtn}>
                  <Icon name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noVariants}>No variants available</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>


      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#1c2b1f" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{shopName || 'Shop'}</Text>
            <Text style={styles.headerSub}>Products</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Icon name="cart-outline" size={22} color="#2f6d1a" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2f6d1a" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Icon name="package-variant-closed" size={52} color="#9ca3af" />
                <Text style={styles.emptyText}>No products available</Text>
                <Text style={styles.emptySubText}>This shop has not added any products yet</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>

  );
};

export default ShopProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  headerSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#2f6d1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  variantsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    gap: 8,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  variantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variantQtyUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  variantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2f6d1a',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#2f6d1a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2f6d1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  noVariants: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
  },
});
