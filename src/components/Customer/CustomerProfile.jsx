import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Geolocation from 'react-native-geolocation-service'
import { request, RESULTS, PERMISSIONS } from 'react-native-permissions'
import axios from 'axios'
import keychain from 'react-native-keychain'
import Config from 'react-native-config'

const defaultProfile = {
  name: 'Customer',
  email: 'N/A',
  phone: 'N/A',
  isVerified: false,
  createdAt: '',
  address: {
    house: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  },
}

const formatJoinDate = dateString => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const CustomerProfile = ({ route, navigation }) => {
  const [profileData, setProfileData] = useState(route?.params?.profile || null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profile = profileData || defaultProfile
  const name = profile?.name || 'Customer'
  const email = profile?.email || 'N/A'
  const isVerified = Boolean(profile?.isVerified)
  const joinedDate = formatJoinDate(profile?.createdAt)
  const [phone, setPhone] = useState(profile?.phone || '')
  const [draftPhone, setDraftPhone] = useState(profile?.phone || '')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [address, setAddress] = useState(() => ({
    house: profile?.address?.house || '',
    area: profile?.address?.area || '',
    landmark: profile?.address?.landmark || '',
    city: profile?.address?.city || '',
    state: profile?.address?.state || '',
    pincode: profile?.address?.pincode || '',
  }))
  const [draftAddress, setDraftAddress] = useState(address)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [latLong, setLatLong] = useState({ lat: '', long: '' })

  const fullAddress = [address?.house, address?.area, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(', ')
  const hasLandmark = Boolean(address?.landmark?.trim())
  const userInitial = (email?.trim()?.charAt(0) || name?.charAt(0) || 'C').toUpperCase()

  useEffect(() => {
    if (route?.params?.profile) {
      setProfileData(route.params.profile)
    }
  }, [route?.params?.profile])

  useEffect(() => {
    setAddress({
      house: profile?.address?.house || '',
      area: profile?.address?.area || '',
      landmark: profile?.address?.landmark || '',
      city: profile?.address?.city || '',
      state: profile?.address?.state || '',
      pincode: profile?.address?.pincode || '',
    })
  }, [profile?.address])

  useEffect(() => {
    const profilePhone = profile?.phone || ''
    setPhone(profilePhone)
    setDraftPhone(profilePhone)
  }, [profile?.phone])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsProfileLoading(true)
        const keychainRes = await keychain.getGenericPassword()
        if (!keychainRes?.password) {
          setIsProfileLoading(false)
          return
        }

        const token = JSON.parse(keychainRes.password).token
        const userRes = await axios.post(`${Config.API_URL}/getprofile`, { token })
        if (userRes?.data?.user) {
          setProfileData(userRes.data.user)
        }
      } catch (error) {
      } finally {
        setIsProfileLoading(false)
      }
    }

    loadProfile()
  }, [])

  const openAddressEditor = () => {
    setDraftAddress(address)
    setIsEditingAddress(true)
  }

  const openPhoneEditor = () => {
    setDraftPhone(phone)
    setIsEditingPhone(true)
  }

  const cancelPhoneEdit = () => {
    setDraftPhone(phone)
    setIsEditingPhone(false)
  }

  const handleSubmit = async (type, value, addressData) => {
    try {
      if (type === 'phone') {
        console.log('phone save btn click')
        console.log('edited phone number:', value)
        
        const response = await axios.post(`${Config.API_URL}/updateprofile`, {
          phone: value,
          role: 'customer',
          _id: profileData?._id
        })
        
        console.log('phone update response:', response.data)
        if (response.data.success) {
          Alert.alert('Success', 'Phone number updated successfully')
        }
        return
      }
      if (type === 'address') {
        console.log('address save btn click')
        console.log('edited address:', addressData)
        
        const response = await axios.post(`${Config.API_URL}/updateprofile`, {
          address: addressData,
          role: 'customer',
          _id: profileData?._id
        })
        
        console.log('address update response:', response.data)
        if (response.data.success) {
          Alert.alert('Success', 'Address updated successfully')
        }
      }
    } catch (error) {
      console.log('error updating profile:', error.message)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    }
  }

  const savePhoneEdit = () => {
    const cleanedPhone = (draftPhone || '').replace(/\D/g, '')
    if (cleanedPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.')
      return
    }
    setPhone(cleanedPhone)
    setDraftPhone(cleanedPhone)
    handleSubmit('phone', cleanedPhone)
    setIsEditingPhone(false)
  }

  const cancelAddressEdit = () => {
    setDraftAddress(address)
    setIsEditingAddress(false)
  }

  const saveAddressEdit = async () => {
    // If no coordinates yet, get current location
    if (!latLong.lat || !latLong.long) {
      setIsLocating(true)
      try {
        const position = await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
              forceRequestLocation: true,
            }
          )
        })
        
        const { latitude: lat, longitude: lon } = position.coords
        setLatLong({ lat, long: lon })
        
        // Clean address fields by trimming whitespace
        const cleanedAddress = {
          house: (draftAddress.house || '').trim(),
          area: (draftAddress.area || '').trim(),
          landmark: (draftAddress.landmark || '').trim(),
          city: (draftAddress.city || '').trim(),
          state: (draftAddress.state || '').trim(),
          pincode: (draftAddress.pincode || '').trim(),
          location: {
            type: 'Point',
            coordinates: [lon, lat], // [longitude, latitude] format
          },
        }
        
        setAddress(cleanedAddress)
        setDraftAddress(cleanedAddress)
        handleSubmit('address', null, cleanedAddress)
        setIsEditingAddress(false)
        setIsLocating(false)
      } catch (error) {
        setIsLocating(false)
        Alert.alert('Location Error', 'Unable to get your location. Please try again.')
      }
    } else {
      // Coordinates already exist, use them
      const cleanedAddress = {
        house: (draftAddress.house || '').trim(),
        area: (draftAddress.area || '').trim(),
        landmark: (draftAddress.landmark || '').trim(),
        city: (draftAddress.city || '').trim(),
        state: (draftAddress.state || '').trim(),
        pincode: (draftAddress.pincode || '').trim(),
        location: {
          type: 'Point',
          coordinates: [latLong.long, latLong.lat], // [longitude, latitude] format
        },
      }
      
      setAddress(cleanedAddress)
      setDraftAddress(cleanedAddress)
      handleSubmit('address', null, cleanedAddress)
      setIsEditingAddress(false)
    }
  }

  const updateDraftField = (field, value) => {
    setDraftAddress(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const requestLocationPermission = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE

    const permissionResult = await request(permission)
    return permissionResult === RESULTS.GRANTED
  }

  const useCurrentLocation = async () => {
    if (isLocating) return

    const hasPermission = await requestLocationPermission()
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please allow location permission to use this feature.')
      return
    }

    setIsLocating(true)

    Geolocation.getCurrentPosition(
      async position => {
        const lat = position?.coords?.latitude
        const lon = position?.coords?.longitude

        if (!lat || !lon) {
          setIsLocating(false)
          Alert.alert('Location Error', 'Unable to get your current location.')
          return
        }

        setLatLong({ lat, long: lon })

        let nextAddress = { ...draftAddress }
        try {
          const info = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
              lat,
              lon,
              format: 'json',
            },
            headers: {
              'User-Agent': 'ApnaBazar/1.0 (apnabazar@gmail.com)',
              Accept: 'application/json',
            },
            timeout: 15000,
          })

          const geoAddress = info?.data?.address || {}
          const houseValue =
            geoAddress?.house_number ||
            geoAddress?.building ||
            geoAddress?.amenity ||
            geoAddress?.road ||
            nextAddress.house

          nextAddress = {
            ...nextAddress,
            house: houseValue,
            area: info?.data?.display_name || nextAddress.area || `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            city:
              geoAddress?.city ||
              geoAddress?.town ||
              geoAddress?.village ||
              geoAddress?.county ||
              geoAddress?.municipality ||
              geoAddress?.region ||
              geoAddress?.district ||
              nextAddress.city,
            state: geoAddress?.state || nextAddress.state,
            pincode: geoAddress?.postcode || nextAddress.pincode,
            landmark:
              geoAddress?.landmark ||
              geoAddress?.suburb ||
              geoAddress?.neighbourhood ||
              geoAddress?.road ||
              nextAddress.landmark,
          }
        } catch (error) {
          nextAddress = {
            ...nextAddress,
            area: nextAddress.area || `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
          }
        }

        setDraftAddress(nextAddress)
        setIsLocating(false)
      },
      error => {
        setIsLocating(false)
        Alert.alert('Location Error', error?.message || 'Unable to fetch current location.')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      },
    )
  }

  const logoutUser = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true)
            await keychain.resetGenericPassword()
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          } catch (error) {
            Alert.alert('Logout Failed', 'Unable to logout right now. Please try again.')
          } finally {
            setIsLoggingOut(false)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>

          <View style={styles.identityWrap}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email} numberOfLines={1}>{email}</Text>
            {isProfileLoading ? (
              <View style={styles.profileLoadingRow}>
                <ActivityIndicator size="small" color="#2f6d1a" />
                <Text style={styles.profileLoadingText}>Refreshing profile...</Text>
              </View>
            ) : null}
            <View style={[styles.statusPill, isVerified ? styles.statusVerified : styles.statusPending]}>
              <Icon
                name={isVerified ? 'check-decagram' : 'clock-outline'}
                size={14}
                color={isVerified ? '#206235' : '#8a6112'}
              />
              <Text style={[styles.statusText, isVerified ? styles.statusTextVerified : styles.statusTextPending]}>
                {isVerified ? 'Verified Account' : 'Verification Pending'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editAddressBtn}
              onPress={openPhoneEditor}
            >
              <Icon name="phone-edit-outline" size={14} color="#2f6d1a" />
              <Text style={styles.editAddressText}>Change Phone</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <Icon name="phone-outline" size={18} color="#2f6d1a" />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{phone || 'N/A'}</Text>
            </View>
          </View>

          {isEditingPhone ? (
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Update Phone Number</Text>
              <TextInput
                value={draftPhone}
                onChangeText={text => setDraftPhone(text.replace(/\D/g, ''))}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#8ba095"
                keyboardType="number-pad"
                maxLength={10}
                style={styles.input}
              />
              <View style={styles.actionRow}>
                <TouchableOpacity activeOpacity={0.85} style={styles.cancelBtn} onPress={cancelPhoneEdit}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={styles.saveBtn} onPress={savePhoneEdit}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Icon name="calendar-month-outline" size={18} color="#2f6d1a" />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Joined On</Text>
              <Text style={styles.rowValue}>{joinedDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Address</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editAddressBtn}
              onPress={openAddressEditor}
            >
              <Icon name="pencil-outline" size={14} color="#2f6d1a" />
              <Text style={styles.editAddressText}>Change Address</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Icon name="home-city-outline" size={18} color="#2f6d1a" />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Primary Address</Text>
              <Text style={styles.rowValue}>{fullAddress || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Icon name="map-marker-outline" size={18} color="#2f6d1a" />
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Landmark</Text>
              <Text style={styles.rowValue}>{address?.landmark || 'Not Added'}</Text>

              {!hasLandmark ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.addLandmarkBtn}
                  onPress={openAddressEditor}
                >
                  <Icon name="plus-circle-outline" size={14} color="#2f6d1a" />
                  <Text style={styles.addLandmarkText}>Add Landmark</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {isEditingAddress ? (
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Update Address</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.currentLocationBtn}
                onPress={useCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#2f6d1a" />
                ) : (
                  <Icon name="crosshairs-gps" size={16} color="#2f6d1a" />
                )}
                <Text style={styles.currentLocationText}>
                  {isLocating ? 'Detecting Location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>

              <TextInput
                value={draftAddress.house}
                onChangeText={text => updateDraftField('house', text)}
                placeholder="House / Flat"
                placeholderTextColor="#8ba095"
                style={styles.input}
              />
              <TextInput
                value={draftAddress.area}
                onChangeText={text => updateDraftField('area', text)}
                placeholder="Area / Street"
                placeholderTextColor="#8ba095"
                style={[styles.input, styles.multilineInput]}
                multiline
              />
              <TextInput
                value={draftAddress.city}
                onChangeText={text => updateDraftField('city', text)}
                placeholder="City"
                placeholderTextColor="#8ba095"
                style={styles.input}
              />
              <TextInput
                value={draftAddress.state}
                onChangeText={text => updateDraftField('state', text)}
                placeholder="State"
                placeholderTextColor="#8ba095"
                style={styles.input}
              />
              <TextInput
                value={draftAddress.pincode}
                onChangeText={text => updateDraftField('pincode', text)}
                placeholder="Pincode"
                placeholderTextColor="#8ba095"
                keyboardType="number-pad"
                style={styles.input}
              />
              <TextInput
                value={draftAddress.landmark}
                onChangeText={text => updateDraftField('landmark', text)}
                placeholder="Landmark (optional)"
                placeholderTextColor="#8ba095"
                style={styles.input}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity activeOpacity={0.85} style={styles.cancelBtn} onPress={cancelAddressEdit}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={styles.saveBtn} onPress={saveAddressEdit}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutBtn}
          onPress={logoutUser}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Icon name="logout" size={18} color="#ffffff" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default CustomerProfile

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f7f3',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#deeadc',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#e8f4e6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfe3cb',
  },
  avatarText: {
    color: '#2f6d1a',
    fontSize: 30,
    fontWeight: '800',
  },
  identityWrap: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#1c2b1f',
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: '#5f7368',
    fontSize: 12,
    marginTop: 2,
  },
  profileLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  profileLoadingText: {
    color: '#5f7368',
    fontSize: 11,
    fontWeight: '500',
  },
  statusPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusVerified: {
    backgroundColor: '#eaf6ed',
    borderColor: '#c6e5cf',
  },
  statusPending: {
    backgroundColor: '#fbf4e4',
    borderColor: '#ebd6a8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextVerified: {
    color: '#206235',
  },
  statusTextPending: {
    color: '#8a6112',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#deeadc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    color: '#1e321f',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  editAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecf6ea',
    borderWidth: 1,
    borderColor: '#d1e4cd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  editAddressText: {
    color: '#2f6d1a',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowContent: {
    marginLeft: 10,
    flex: 1,
  },
  rowLabel: {
    color: '#6a7e72',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowValue: {
    color: '#213322',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  addLandmarkBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecf6ea',
    borderWidth: 1,
    borderColor: '#d1e4cd',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addLandmarkText: {
    color: '#2f6d1a',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#edf2ec',
    marginVertical: 10,
  },
  editCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#deeadc',
    backgroundColor: '#f8fbf8',
    borderRadius: 12,
    padding: 10,
  },
  editTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#234225',
    marginBottom: 8,
  },
  currentLocationBtn: {
    marginBottom: 8,
    backgroundColor: '#eef7ec',
    borderColor: '#d1e4cd',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  currentLocationText: {
    color: '#2f6d1a',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe8d8',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: '#1f3322',
    fontSize: 14,
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4dfd2',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    color: '#61756a',
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#2f6d1a',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#d64747',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
})