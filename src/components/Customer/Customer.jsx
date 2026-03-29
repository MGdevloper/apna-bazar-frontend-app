import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { request, RESULTS } from 'react-native-permissions';
import { PERMISSIONS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';

import axios from 'axios';
import RegisterContext from '../../context/RegisterContext.js';
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';
const Customer = ({ navigation, route }) => {
  const { customerData, setCustomerData } = useContext(RegisterContext)
  const { phone, house, area, city, pincode, landmark, state: customerState, latLong } = customerData
  const [lodding, setlodding] = useState(false)
  const updateCustomerData = (updates) => {
    setCustomerData(prev => ({ ...prev, ...updates }))
  }


  async function handleSubmit() {
    const payload = { ...customerData, ...route?.params, role: 'customer' }
    console.log("data goigto backend", payload);
    

    if (!phone || !house || !area || !city || !pincode || !customerState) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields', visibilityTime: 2000 })
      return
    }

    try {

      let res = await axios.post(`${Config.API_URL}/savecustomer`, payload)
      console.log('====================================');
      console.log(res.data);
      console.log('====================================');

      if (res.data.reason == "not verified") {
        navigation.navigate('otp', { email: route?.params?.email,role:"customer"})
      }
      else if (res.data.reason == 'already exists') {
        Toast.show({ type: 'error', text1: res.data.message, visibilityTime: 2000 })



      }
      else {

        Toast.show({type:'success', text1:'Saved successfully',visibilityTime:2000})
        navigation.navigate('otp', { email: route?.params?.email || '',role:"customer" })
      }
    }
    catch (err) {
      console.log('====================================');
      console.log("servererror:", err);
      console.log('====================================');
      return
    }



  }

  const useCurrentLocation = async () => {
    setlodding(true)
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE



    let permissonresult = await request(permission);

    if (permissonresult != RESULTS.GRANTED) {
      setlodding(false)
      return
    }

    Geolocation.getCurrentPosition(async (pos) => {

      try {
        let info = await axios.get("https://nominatim.openstreetmap.org/reverse", {
          params: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            format: "json",
          },
          headers: {
            "User-Agent": "ApnaBazar/1.0 (apnabazar@gmail.com)",
            "Accept": "application/json",
          },
          timeout: 15000,
        });

        updateCustomerData({
          state: info.data.address.state,
          city: info.data.address.city,
          pincode: info.data.address.postcode,
          area: info.data.display_name,
          latLong: {
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
          },
        })
      } catch (error) {
        Alert.alert("Network error", "Unable to fetch address. Please try again.")
      }

      setlodding(false)
    },
      (err) => {

        if (err.message == "No location provider available.") {
          Alert.alert("enable location from setting")
        }

        setlodding(false)
      }

    );



  };




  return (
    <>

      <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={20}>
        {
          lodding &&
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        }
        <ScrollView style={{ elevation: 6, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <LinearGradient colors={['#2f6d1a', '#4f9b2f']} style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => { navigation.goBack() }} style={styles.backBtn}>
                <Icon name="arrow-left" size={24} color="#2f6d1a" />
              </Pressable>

              <View>
                <Text style={styles.headerTitle}>Register</Text>
                <Text style={styles.headerSub}>
                  Contact & Address
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* FORM CARD */}
          <View style={styles.card}>
            <View style={styles.stepRow}>
              <Text style={styles.stepText}>Step 2 of 3</Text>
            </View>

            <TextInput
              placeholder="Phone Number"
              maxLength={10}
              keyboardType="number-pad"
              value={phone}
              onChangeText={(text) => updateCustomerData({ phone: text })}
              style={styles.input}
              placeholderTextColor={"#00000079"}
            />
            <TextInput
              placeholder="State"

              value={customerState}
              onChangeText={(text) => updateCustomerData({ state: text })}
              style={styles.input}
              placeholderTextColor={"#00000079"}
            />

            <TextInput
              placeholder="House / Flat / Building No."
              value={house}
              onChangeText={(text) => updateCustomerData({ house: text })}
              style={styles.input}

              placeholderTextColor={"#00000079"}
            />

            <TextInput
              placeholder="Area / Street / Locality"
              value={area}
              onChangeText={(text) => updateCustomerData({ area: text })}
              style={styles.input}

              placeholderTextColor={"#00000079"}
            />

            <TextInput
              placeholder="City"
              value={city}
              onChangeText={(text) => updateCustomerData({ city: text })}
              style={styles.input}

              placeholderTextColor={"#00000079"}
            />

            <TextInput
              placeholder="Pincode"
              keyboardType="number-pad"
              value={pincode}
              onChangeText={(text) => updateCustomerData({ pincode: text })}
              style={styles.input}

              placeholderTextColor={"#00000079"}
            />

            <TextInput
              placeholder="Nearby Landmark (Optional)"
              value={landmark}
              onChangeText={(text) => updateCustomerData({ landmark: text })}
              style={styles.input}

              placeholderTextColor={"#00000079"}
            />

            <TouchableOpacity style={styles.locationBtn} onPress={useCurrentLocation}>
              <Icon name="crosshairs-gps" size={20} color="#2f6d1a" />
              <Text style={styles.locationText}>Use Current Address</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit}>

              <LinearGradient
                colors={['#2f6d1a', '#7cc957']}
                style={styles.continueBtn}>
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


    </>


  );
};

export default Customer;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.38)", // 55% transparent
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Android
    elevation: 10, // Android
    borderWidth: 0
  },
  header: {
    height: 260,
    paddingLeft: 20,
    justifyContent: 'center',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,


  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#ffffffcc',
    width: 38,
    height: 38,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#e7f3e1',
    marginTop: 4,
  },
  card: {
    marginTop: -90,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 6,
  },
  stepRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#eaf4e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f6d1a',
  },
  input: {
    height: 48,

    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,

  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f8ec',
    marginBottom: 16,
  },
  locationText: {
    color: '#2f6d1a',
    fontWeight: '600',
  },
  continueBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
