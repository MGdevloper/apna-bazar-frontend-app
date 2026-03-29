import React, { useContext, useEffect, useRef, useState } from 'react';
import { BackHandler, processColor } from 'react-native';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';
import DeliveryContext from '../context/DeliveryContext';
import RegisterContext from '../context/RegisterContext';
import keychain from 'react-native-keychain';
const Otp = ({ navigation, route }) => {

  let { setDeliverypartners } = useContext(DeliveryContext)
  let { setCustomerData, setRegisterData, setShopkeeperData } = useContext(RegisterContext)
  const rawEmail = route?.params?.email || '';
  const role = route?.params?.role || '';
  const email = rawEmail.trim();


  useEffect(() => {
    console.log("route:", route);

    try {
      if (route.params?.role != "deliverypartnerlogin") {
        (async () => {
          let res = await axios.post(`${Config.API_URL}/sendotp`, { email, role })
          console.log(res);
        })()
      }
    }
    catch (err) {
      console.log("error in hiting email api");
    }
  }, [])
  // React.useEffect(() => {
  //   const onBackPress = () => true; // Block back action
  //   BackHandler.addEventListener('hardwareBackPress', onBackPress);
  //   return () => {
  //     BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  //   };
  // }, []);
  const MAX_EMAIL_DISPLAY = 30;
  const displayEmail =
    email.length > MAX_EMAIL_DISPLAY
      ? `${email.slice(0, 12)}...${email.slice(-12)}`
      : email || 'your email';
  const [otp, setOtp] = useState(['', '', '', '']);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  async function handlesubmit() {
    if (otp.includes('')) {
      Toast.show({
        type: 'error',
        text1: "give 4-digit otp"
      })
      return

    }

    if (role == "deliverypartnerLogin") {

      let res = await axios.post(`${Config.API_URL}/deliverypartnerotpverify`, { email, otp: otp.toLocaleString().replaceAll(',', '') })

      if (res.data.success == true) {

        Toast.show({
          type: 'success',
          text1: 'OTP Verified',
          text2: res.data.message,
        });

        await keychain.setGenericPassword('auth', JSON.stringify({
          token: res.data.token
        }))

        navigation.replace("deliverypartnerHome", { email })
        return;

      }

      else {
        Toast.show({
          type: 'error',
          text1: 'OTP Verification Failed',
          text2: res.data.message,
        });
        return;
      }

    }


    if (role == "forgotpassword") {

      let response = await axios.post(`${Config.API_URL}/forgotpass_otpverify`, { email, otp: otp.toLocaleString().replaceAll(',', '') })

      if (response.data.success == false) {
        Toast.show({
          type: "error",
          text1: response.data.message
        })
        return
      }

      if (response.data.success == true) {
        Toast.show({
          type: "success",
          text1: response.data.message
        })

        navigation.navigate("resetpass", { email })
      }



    }


    try {

      let result = await axios.post(`${Config.API_URL}/verifyotp`, { email: route.params.email, otp: otp.toLocaleString().replaceAll(',', ''), role: role })
      console.log(result);

      if (result.data.message == "otp Verifyed" && result.data.success == true) {
        Toast.show({
          type: "success",
          text1: "Otp Verifyed ✅"
        })


        navigation.navigate("Login")
        setDeliverypartners([])
        setCustomerData({
          phone: '',
          house: '',
          area: '',
          city: '',
          pincode: '',
          landmark: '',
          state: '',
          password: '',
          latLong: { lat: '', long: '' },
        })

        setRegisterData({
          role: 'customer',
          fullname: '',
          password: '',
          email: '',
        })

        setShopkeeperData({
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

      }
      else {
        Toast.show({
          type: "error",
          text1: result.data.message
        })
      }

    }
    catch (err) {
      console.log("error in verify API:", err);

    }
  }

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <LinearGradient colors={['#2f6d1a', '#4f9b2f']} style={styles.hero}>
          <View style={styles.topRow}>
            {/* Back button removed intentionally to prevent navigation back from OTP */}
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>Apna Bazar</Text>
              <Text style={styles.heroSub}>OTP Verification</Text>
            </View>
            <View style={styles.badge}>
              <Icon name="shield-check" size={22} color="#2f6d1a" />
            </View>
          </View>

          <Text style={styles.heroText}>
            We sent a 4-digit code to <Text style={{ fontWeight: '600' }}>{displayEmail}</Text>
          </Text>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={20}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Enter OTP</Text>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  value={digit}
                  onChangeText={(value) => handleChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpBox}
                  placeholder="•"
                  placeholderTextColor="#c7ced8"
                />
              ))}
            </View>

            <TouchableOpacity onPress={handlesubmit} style={styles.btnWrap}>
              <LinearGradient colors={['#2f6d1a', '#7cc957']} style={styles.registerBtn}>
                <Text style={styles.registerText}>Verify OTP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default Otp;

const GREEN = '#3a7d0a';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6faf4',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 80,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  brandWrap: {
    gap: 4,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Medium',
  },
  heroSub: {
    fontSize: 14,
    color: '#e7f3e1',
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffffcc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    fontSize: 14,
    color: '#eaf4e6',
    marginTop: 18,
  },
  emailText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 6,
  },
  card: {
    marginTop: -50,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderColor: '#dfe9d7',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2430',
    backgroundColor: '#f7faf5',
  },
  btnWrap: {
    marginTop: 6,
  },
  registerBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
