import React, { useEffect, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import Login from './src/components/Login';
import Register from './src/components/Register';
import Delivery from './src/components/Shopkeeper/Delivery';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Customer from './src/components/Customer/Customer';
import Shopekeeper from './src/components/Shopkeeper/Shopekeeper';
import Forgotpassword from './src/components/Forgotpassword';
import DeliveryContext from './src/context/DeliveryContext.js'
const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);


  const [deliverypartners, setDeliverypartners] = useState([]);

  function addDeliverypartner(partner) {
    setDeliverypartners(prev=>[...prev,partner]);
  }

  function removeDeliverypartner(partnerId) {
    setDeliverypartners(prev=>prev.filter(partner=>partner.id!=partnerId));
  }

  function editDeliverypartner(partnerId, updatedPartner) {
    setDeliverypartners(prev=>prev.map(partner=>partner.id===partnerId ? updatedPartner : partner));
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
    <>
      <DeliveryContext.Provider value={{deliverypartners, addDeliverypartner, removeDeliverypartner, editDeliverypartner}}>


        <NavigationContainer

        >
          <Stack.Navigator initialRouteName="Login">

            {/* Login */}
            <Stack.Screen
              name="Login"
              component={Login}
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


          </Stack.Navigator>
        </NavigationContainer>

        <Toast config={toastConfig} />
      </DeliveryContext.Provider>

    </>
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
