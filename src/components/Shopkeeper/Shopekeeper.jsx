import { Alert, Linking, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { use, useEffect, useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { ActivityIndicator } from 'react-native'
import { ScrollView } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { TextInput } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import GradientBtn from '../gradiantbtn/GradientBtn'
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions'
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios'
import { useContext } from 'react'
import DeliveryContext from '../../context/DeliveryContext.js'

import Toast from 'react-native-toast-message'
const Shopekeeper = (route) => {


  let {deliverypartners}=useContext(DeliveryContext)


  let [loading, setLoading] = useState(false)

  let [categorie, setCategorie] = useState(null)
  let [city, setCity] = useState('');
  let [state, setState] = useState('');
  let [pincode, setPincode] = useState('');
  let [area, setArea] = useState('');
  let [latLong, setLatLong] = useState({ lat: '', long: '' });
  let [shopName, setShopName] = useState('');
  let [phone, setPhone] = useState('');
  let [address, setAddress] = useState('');
  let [locationpermission, setLocationpermission] = useState(false);
  const categoriesdata = [
    { label: 'Grocery', value: 'grocery' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Pharmacy', value: 'Pharmacy' },
    { label: 'stationery', value: 'stationery' },
    { label: 'clothes', value: 'clothes' },
    { label: 'Fruits & Vegetables', value: 'Fruits & Vegetables' },
    { label: 'others', value: 'others' },
  ];


  useEffect(() => {
    console.log(shopName)
  }, [shopName])

  useEffect(() => {
    console.log(loading);

  }, [loading])
  useEffect(() => {
    const permission = Platform.OS === 'android' ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    let result = request(permission)

    if (result == RESULTS.GRANTED) {
      setLocationpermission(true)
    }

  }, [])



  const useCurrentLocation = async () => {
    setLoading(true)
    let response = await check(Platform.OS === 'android' ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
    if (response != RESULTS.GRANTED) {
      setLoading(false)
      Alert.alert(
        "Permission required",
        "Please enable location from settings",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
      return
    }
    if (response == RESULTS.GRANTED) {
      setLocationpermission(true)
    }
    setLoading(true)
    console.log("pressed");

    Geolocation.getCurrentPosition(async (pos) => {

      console.log(pos.coords.longitude);
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
      });


      setState(info.data.address.state)
      setCity(info.data.address.city || info.data.address.town || info.data.address.village || info.data.address.county || info.data.address.municipality || info.data.address.region || info.data.address.district)
      setPincode(info.data.address.postcode)
      setArea(info.data.display_name)
      setAddress(info.data.display_name)

      setLatLong({
        lat: pos.coords.latitude,
        long: pos.coords.longitude,
      });

      setLoading(false)
    },
      (err) => {

        if (err.message == "No location provider available.") {
          Alert.alert("enable location from setting")
        }

        setLoading(false)
      }

    );



  };




  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior='height' keyboardVerticalOffset={0} >
      {
        loading &&
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      }
      <ScrollView stickyHeaderIndices={[0]} style={{ elevation: 6, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}

        <View style={{ width: '100%' }}>
          <View style={[styles.headerRow, { height: 100, width: '100%', display: 'flex', flexDirection: 'row' }]}>
            <View >

              <Pressable onPress={() => { route.navigation.goBack() }} style={styles.backBtn}>
                <Icon name="arrow-left" size={24} color="#2f6d1a" />
              </Pressable>
            </View>
            <View >
              <Text style={styles.headerTitle}>Register</Text>
              <Text style={styles.headerSub}>Shop Info and Delivery Partner</Text>
            </View>
          </View>
        </View>
        <LinearGradient colors={['#2f6d1a', '#4f9b2f']} style={styles.header}>

        </LinearGradient>
        {/* FORM CARD */}

        <View style={[styles.card,]}>
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          <View><Text style={styles.cardTitle}>Shop Information</Text></View>
          <TextInput
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="Shop Name"
            placeholderTextColor="#7d8a99"
            value={shopName}

            onChangeText={(e) => {

              setShopName(e)
            }}
          />

          <View>

            <Dropdown
              // style={styles.input}
              style={[styles.input, { textAlign: 'left' }]}
              placeholderStyle={{ color: '#5a6b7a', textAlign: 'left' }}
              data={categoriesdata}
              labelField="label"
              valueField="value"
              placeholder="Select Category"
              value={categorie}
              onChange={item => setCategorie(item.value)}
            />
          </View>

          <TextInput
            keyboardType='phone-pad'
            maxLength={10}
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="Phone Number"
            placeholderTextColor="#7d8a99"
            value={phone}
            onChangeText={(t) => {
              setPhone(t)
            }}
          />

          <View><Text style={styles.cardTitle}>Shop Address</Text></View>

          <TextInput
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="State"
            placeholderTextColor="#7d8a99"
            value={state}
            onChangeText={(t) => {
              setState(t)
            }}
          />

          <TextInput
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="City"
            placeholderTextColor="#7d8a99"
            value={city}
            onChangeText={(t) => {
              setCity(t)
            }}
          />
          <TextInput
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="Pincode"
            placeholderTextColor="#7d8a99"
            value={pincode}
            onChangeText={(t) => {
              setPincode(t)
            }}
          />
          <TextInput
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="Full Address"
            placeholderTextColor="#7d8a99"
            value={address}
            onChangeText={(t) => {
              setAddress(t)
            }}
          />

          <TouchableOpacity onPress={useCurrentLocation} style={styles.locationBtn}>
            <Icon name="crosshairs-gps" size={20} color="#2f6d1a" />
            <Text style={styles.locationText}>Use Current Location</Text>
          </TouchableOpacity>
          <View><Text style={styles.cardTitle}>Delivery partner</Text></View>
          <View>
            {/* <TouchableOpacity style={styles.continueBtn}> */}

            <View>
              <Text style={styles.deliveryPartnerCount}>there are {deliverypartners ? deliverypartners.length : 0} delivery partner{deliverypartners && deliverypartners.length !== 1 ? 's' : ''}</Text>
            </View>
            <GradientBtn func={() => route.navigation.navigate("delivery")} text={' Delivery Partners'} height={50} width='100%' />
            {/* </TouchableOpacity> */}
          </View>


          <View style={{ marginTop: 5 }}>
            <GradientBtn text={'Continue'} />
          </View>
        </View>



      </ScrollView>


    </KeyboardAvoidingView>
  )
}

export default Shopekeeper

const styles = StyleSheet.create({
  deliveryPartnerCount: {
    marginBottom: 10,
    fontSize: 14,
    color: '#3a4a5a',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1a3a1a',
  },
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
    // display:'flex',
    //  // position:'static',
    height: 260,
    // paddingLeft: 20,
    justifyContent: 'center',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    // zIndex: 30


  },
  headerRow: {
    paddingLeft: 20,
    paddingVertical: 15,
    backgroundColor: '#2f6d1a',
    paddingTop: 40,
    // solid so it looks clean when stuck
    zIndex: 100,
    alignSelf: 'stretch',
    // justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // elevation: 8,
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
    marginTop: -250,
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
    borderColor: '#d0d8e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    color: '#1a1a1a', // Strong visible color for input text
    backgroundColor: '#fafbfc',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.1,
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
    fontWeight: '700',
    fontSize: 15,
  },
  continueBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
