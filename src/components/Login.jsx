import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView } from 'react-native';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import keychain from 'react-native-keychain';
import GradientBtn from "./gradiantbtn/GradientBtn"
import axios from 'axios';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';
const Login = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {


    (async () => {
      let res = await keychain.getGenericPassword()
      
      console.log(Config.API_URL);
      
      if (!res) {
        return
      }

       let token= JSON.parse(res.password).token
      console.log(token);
      
      if(!token){
        
        return;
      }

      try{
        console.log("token in try",token);
        
        let userRes = await axios.post(`${Config.API_URL}/getuser`,{token})
        let role=userRes.data.user.role
        if(role=="customer"){
            navigation.navigate("customerHome",{email:userRes.data.user.email})
        }
        else if(role=="shopkeeper"){
          navigation.navigate("shopkeeperHome",{email:userRes.data.user.email})
        }
        else if(role=="deliverypartner"){
          navigation.navigate("deliverypartnerHome",{email:userRes.data.user.email})
        }
        else{
          return;
        }
        
      }catch(err){
        // await keychain.resetGenericPassword();
        return;
      }



       



        
    })()
  }, [])


  async function handlesubmit() {
    console.log(email, password);

    if (!email || !password) {
      Alert.alert("Please fill all the fields")
      return;
    }

    try {
      console.log(Config.API_URL)
      let res = await axios.post(`${Config.API_URL}/login`, { email, password })
      
      if (res.data.success == false) {

        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: res.data.message,
        });
        return;
      }

      const userType = res?.data?.type || res?.data?.user?.type || res?.data?.role;

      await keychain.setGenericPassword(  'auth' ,JSON.stringify({
        token: res.data.token,
      }));

      if (userType == "customer") {
        navigation.replace("customerHome", { email })
        return;
      }
      if (userType == "shopkeeper") {
        navigation.replace("shopkeeperHome", { email })
        return;
      }
      if (userType == "deliverypartner") {
        navigation.replace("deliverypartnerHome", { email })
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Unknown account type',
      });
    }
    catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Unable to reach server',
      });
    }
  }
  return (
    // <KeyboardAvoidingView >

    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Apna Bazar</Text>
      </View>

      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={20} >

        <View style={styles.card}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login in to continue</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <View style={styles.iconBadge}>
                <Icon name="email-outline" size={18} color="#2f6a1b" />
              </View>
              <TextInput
                value={email}
                onChangeText={(t) => setEmail(t)}
                placeholder="Enter your email address"
                placeholderTextColor="#9aa3b5"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <View style={styles.iconBadge}>
                <Icon name="lock" size={18} color="#2f6a1b" />
              </View>
              <TextInput
                value={password}
                onChangeText={(t) => setPassword(t)}
                placeholder="Enter your password"
                placeholderTextColor="#9aa3b5"
                secureTextEntry={!passwordVisible}
                style={[styles.input, styles.inputGrow]}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(v => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#7e8a9a"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("forgotpassword")}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <GradientBtn func={handlesubmit} text={"Log In"} padding_x={6} padding_y={6} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
          {/* Continue as Delivery Partner link at the bottom */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <TouchableOpacity onPress={() => navigation.navigate('deliverypartner')}>
              <Text style={styles.linkText}>Continue as Delivery Partner</Text>
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>

    // </KeyboardAvoidingView>


  );
};

export default Login;

const GREEN = '#3a7d0a';
const LIGHT = '#f7f8fa';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    display: 'flex ',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // backgroundColor:'red',
    width: '100%',

    height: '10%',

  },
  brand: {
    fontSize: 50,
    fontWeight: '500',
    color: GREEN,
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Medium'
  },
  logoWrap: {
    width: '100%',
    height: '35%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  card: {

    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    boxShadow: '0px 1px 13px 1px #00000024',

  },
  titleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: GREEN,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c7685',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3142',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d5d9e2',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    height: 52,
    gap: 10,
  },
  iconBadge: {
    backgroundColor: '#dfe9d7',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2430',
    paddingVertical: 0,
  },
  inputGrow: {
    marginLeft: -6,
  },
  forgot: {
    textAlign: 'right',
    color: '#6c7685',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    // backgroundColor: '#4f9b2f',

    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',


  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,

  },
  footerText: {
    color: '#6c7685',
    fontSize: 13,
  },
  linkText: {
    color: '#4f9b2f',
    fontSize: 13,
    fontWeight: '700',
  },
});
