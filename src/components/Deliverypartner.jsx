import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';

const Deliverypartner = ({ navigation }) => {
  const [email, setEmail] = useState('');
  async function submithandle() {

    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Email is required',
      });
      return;
    }
    console.log('====================================');
    console.log(email);
    console.log('====================================');
    let res = await axios.post(`${Config.API_URL}/deliverypartnerlogin`, { email })
    
    if(res.data.success==true){

      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: res.data.message,
      });

      navigation.navigate("otp",{email,role:"deliverypartnerLogin"})  
    }
    else{
      Toast.show({
        type: 'error',
        text1: 'failed to send OTP',
        text2: res.data.message,
      });
    }

  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Apna Bazar</Text>
        <Text style={styles.subBrand}>Delivery Partner</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={20}
      >
        <View style={styles.card}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Enter your email address</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <View style={styles.iconBadge}>
                <Icon name="email-outline" size={18} color="#2f6a1b" />
              </View>
              <TextInput
                placeholder="Enter your email address"
                placeholderTextColor="#9aa3b5"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity onPress={submithandle} style={styles.btnWrap}>
            <LinearGradient
              colors={['#2f6d1a', '#7cc957']}
              style={styles.loginBtn}
            >
              <Text style={styles.loginText}>Log In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Deliverypartner;

const GREEN = '#3a7d0a';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  brand: {
    fontSize: 42,
    fontWeight: '500',
    color: GREEN,
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Medium',
  },
  subBrand: {
    fontSize: 14,
    color: '#6c7685',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    boxShadow: '0px 1px 13px 1px #00000024',
  },
  titleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: GREEN,
  },
  subtitle: {
    fontSize: 13,
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
  btnWrap: {
    marginTop: 6,
  },
  loginBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    textAlign: 'center',
    color: '#4f9b2f',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
});
