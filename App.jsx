import React, { use, useEffect, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import Login from './src/components/Login';
import Register from './src/components/Register';
import Delivery from './src/components/Shopkeeper/Delivery';
import Deliverypartner from './src/components/Deliverypartner';
import DeliverypartnerHome from './src/components/DeliverypartnerHome';
import Otp from './src/components/Otp';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomerCartContext from "./src/context/CustomerCart.js"
import Customer from './src/components/Customer/Customer';
import CustomerHome from './src/components/Customer/CustomerHome';
import Shopekeeper from './src/components/Shopkeeper/Shopekeeper';
import ShopkeeperHome from './src/components/Shopkeeper/ShopkeeperHome';
import Forgotpassword from './src/components/Forgotpassword';
import DeliveryContext from './src/context/DeliveryContext.js'
import RegisterContext from './src/context/RegisterContext.js'
import Resetpass from './src/components/Resetpass.jsx';
import CustomerProfile from './src/components/Customer/CustomerProfile.jsx';
import ShopkeeperProfile from './src/components/Shopkeeper/ShopkeeperProfile.jsx';
import ShopProducts from './src/components/Customer/ShopProducts.jsx';
import CartScreen from './src/components/Customer/CartScreen.jsx';
import axios from 'axios';
import Config from 'react-native-config';
import keychain from 'react-native-keychain';
import { set } from 'pm2';
const Stack = createNativeStackNavigator();

const App = () => {

  useEffect(() => {
    (async () => {

      try {

        let pass = await keychain.getGenericPassword()
        let token = JSON.parse(pass.password)

        let cart = await axios.post(`${Config.API_URL}/getcart`, token)

        const backendItems = cart?.data?.cart?.items
        setCustomerCart(Array.isArray(backendItems) ? backendItems : [])
      }
      catch (err) {
        console.log("user not logding..", err);

        setCustomerCart([])


      }



    })()

  }, [])
  useEffect(() => {
    Orientation.lockToPortrait();



  }, []);

  const [registerData, setRegisterData] = useState({
    role: 'customer',
    fullname: '',
    password: '',
    email: '',
  })

  const [customerData, setCustomerData] = useState({
    phone: '',
    house: '',
    area: '',
    city: '',
    pincode: '',
    landmark: '',
    state: '',
    latLong: { lat: '', long: '' },
  })

  const [shopkeeperData, setShopkeeperData] = useState({
    shopName: '',
    categorie: null,
    phone: '',
    state: '',
    city: '',
    pincode: '',
    area: '',
    address: '',
    latLong: { lat: '', long: '' },
  })

  const [customerCart, setCustomerCart] = useState([]);

  useEffect(() => {
    console.log('====================================');
    console.log(customerCart);
    console.log('====================================');
  }, [customerCart]);

  const [deliverypartners, setDeliverypartners] = useState([]);

  function addDeliverypartner(partner) {
    setDeliverypartners(prev => [...prev, partner]);
  }

  function removeDeliverypartner(partnerId) {
    setDeliverypartners(prev => prev.filter(partner => partner.id != partnerId));
  }

  function editDeliverypartner(partnerId, updatedPartner) {
    setDeliverypartners(prev => prev.map(partner => partner.id === partnerId ? updatedPartner : partner));
  }

  // item shape: { itemName, variantId, variant, quantity, price, shopkeeperId, customerId }
  async function addToCart(item) {

    const unitQty = Number(item.quantity ?? 1);
    const unitPrice = Number(item.price ?? 0);

    const entry = {
      variantId: item.variantId,
      itemName: item.itemName,
      variant: item.variant,
      shopkeeperId: item.shopkeeperId,
      customerId: item.customerId,
      unitQty,
      unitPrice,
      quantity: unitQty,
      price: unitPrice,
      cartCount: 1,
    };



    console.log('====================================');
    console.log(customerCart);
    console.log('====================================');
    const exists = customerCart.some(i => i.variantId === entry.variantId);

    if (!exists) {
      try {
        console.log("item", item);


        let res = await axios.post(`${Config.API_URL}/addtocart`, item)
        if (res.data.success) {
          Toast.show({
            type: 'success',
            text1: 'Added to cart',
            text2: res.data.message,
          });
        }

        console.log('====================================');
        console.log("Cart after adding item:", res.data.cart);
        console.log('====================================');
        setCustomerCart(res.data.cart);
        return
      }
      catch (err) {
        console.log('Error adding to cart:', err);
      }
    }




    let res = await axios.post(`${Config.API_URL}/addtocart`, item)

    if (res.data.success) {
      Toast.show({
        type: 'success',
        text1: 'Cart updated',
        text2: res.data.message,
      });
    }

    setCustomerCart(res.data.cart);


    // setCustomerCart(prev => {

    //   console.log(prev);

    //   const exists = prev.some(i => i.variantId === entry.variantId);

    //   if (!exists) {
    //     // try {

    //     //  let res= await axios.post(`${Config.API_URL}/addtocart`, {
    //     //     shopkeeperId: entry.shopkeeperId,
    //     //     customerId: entry.customerId,
    //     //     variantId: entry.variantId,
    //     //     quantity: entry.quantity,
    //     //     itemName: entry.itemName,
    //     //     variant: entry.variant,
    //     //     quantity: entry.cartCount,
    //     //     variantId: entry.variantId,
    //     //     price: entry.price,

    //     //   })
    //     //   console.log(res);

    //     // } catch (error) {
    //     //   console.log('Error adding to cart:', error);
    //     // }

    //     return [...prev, entry];

    //   }

    //   return prev.map(i => {
    //     if (i.variantId !== entry.variantId) return i;
    //     return {
    //       ...i,
    //       quantity: i.quantity + unitQty,
    //       price: i.price + unitPrice,
    //       cartCount: i.cartCount + 1,
    //     };
    //   });
    // });
  }



  async function updateCartItem(variantId) {
    
    let token=await keychain.getGenericPassword()
    token=JSON.parse(token.password).token

    let res=await axios.post(`${Config.API_URL}/updatecart`, { customerId: token, variantId })

    if(res.data.success){
      Toast.show({
        type: 'success',
        text1: 'Cart updated',
        text2: res.data.message,
      });

      setCustomerCart(res.data.cart);
    }
    else{
      Toast.show({
        type: 'error',
        text1: 'Failed to update cart',
        text2: res.data.message,
      });
    }


  }

  async function removeFromCart(variantId) {

    let pass = await keychain.getGenericPassword()
    // let token=JSON.parse(pass).token
    let token = JSON.parse(pass.password).token

    let res = await axios.post(`${Config.API_URL}/removefromcart`, { customerId: token, variantId })

    if(res.data.success){
      Toast.show({
        type: 'success',
        text1: 'Removed from cart',
        text2: res.data.message,
      });

      setCustomerCart(res.data.cart);
    }
    else{
      Toast.show({
        type: 'error',
        text1: 'Failed to remove item',
        text2: res.data.message,
      });
    }
    // setCustomerCart(prev => prev.filter(item => item.variantId !== variantId));
  }

  async function clearCart() {

    let pass = await keychain.getGenericPassword()
    let token = JSON.parse(pass.password).token
    try{

     let res=await axios.post(`${Config.API_URL}/clearcart`, { customerId: token })

     if(res.data.success){

      Toast.show({
        type: 'success',
        text1: 'Cart cleared',
        text2: res.data.message,
      });

      setCustomerCart(res.data.cart);
     }

    }
    catch(err){
      console.log("Error clearing cart:", err);
      Toast.show({
        type: 'error',
        text1: 'Failed to clear cart',
        text2: 'Please try again later.',
      });
    }
  }

  const toastConfig = {
    success: ({ text1, text2 }) => (
      <View style={styles.toastContainer}>
        <View style={styles.leftBarSuccess} />

        <Icon name="check-circle-outline" size={22} color="#4f9b2f" />

        <View style={styles.textWrap}>
          <Text style={styles.title}>{text1}</Text>
          {text2 ? <Text style={styles.message}>{text2}</Text> : null}
        </View>
      </View>
    ),
    error: ({ text1, text2 }) => (
      <View style={styles.toastContainer}>
        <View style={styles.leftBarError} />

        <Icon name="alert-circle-outline" size={22} color="#d32f2f" />

        <View style={styles.textWrap}>
          <Text style={styles.title}>{text1}</Text>
          {text2 ? <Text style={styles.message}>{text2}</Text> : null}
        </View>
      </View>
    ),

  }
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent={false}
        backgroundColor="#f4f7f4"
        barStyle="dark-content"
      />
      <CustomerCartContext.Provider value={{ cartItem: Array.isArray(customerCart) ? customerCart : [], setCustomerCart, addToCart, removeFromCart, clearCart, updateCartItem }}>


        <RegisterContext.Provider value={{ registerData, setRegisterData, customerData, setCustomerData, shopkeeperData, setShopkeeperData }}>
          <DeliveryContext.Provider value={{ deliverypartners, addDeliverypartner, removeDeliverypartner, editDeliverypartner, setDeliverypartners }}>


            <NavigationContainer

            >
              <Stack.Navigator initialRouteName="Login">

                {/* Login */}
                <Stack.Screen
                  name="Login"
                  component={Login}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="customerHome"
                  component={CustomerHome}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="shopkeeperHome"
                  component={ShopkeeperHome}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="deliverypartnerHome"
                  component={DeliverypartnerHome}
                  options={{ headerShown: false }}
                />

                {/* Register */}
                <Stack.Screen
                  name="Register"
                  component={Register}
                  options={{ headerShown: false }}

                />
                {/* Register2 */}

                <Stack.Screen
                  name='customer'
                  component={Customer}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name='shopkeeper'
                  component={Shopekeeper}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='forgotpassword'
                  component={Forgotpassword}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='delivery'
                  component={Delivery}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='deliverypartner'
                  component={Deliverypartner}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='otp'
                  component={Otp}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name='resetpass'
                  component={Resetpass}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="customerprofile"
                  component={CustomerProfile}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="shopkeeperprofile"
                  component={ShopkeeperProfile}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="shopProducts"
                  component={ShopProducts}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="Cart"
                  component={CartScreen}
                  options={{ headerShown: false }}
                />

              </Stack.Navigator>
            </NavigationContainer>

            <Toast config={toastConfig} autoHide={true} visibilityTime={2000} />
          </DeliveryContext.Provider>
        </RegisterContext.Provider>
      </CustomerCartContext.Provider>


    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  headerContainer: {

    justifyContent: 'center',

  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)', // glass effect
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  headerSubtitle: {
    color: '#e6f5ea',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 50, // aligns under title (very pro look)
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  leftBarSuccess: {
    width: 4,
    height: '100%',
    backgroundColor: '#4f9b2f',
    borderRadius: 4,
    marginRight: 10,
  },

  leftBarError: {
    width: 4,
    height: '100%',
    backgroundColor: '#d32f2f',
    borderRadius: 4,
    marginRight: 10,
  },

  textWrap: {
    marginLeft: 10,
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  message: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

});
