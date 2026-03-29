import {
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import GradientBtn from './gradiantbtn/GradientBtn';
import Toast from 'react-native-toast-message';
import RegisterContext from '../context/RegisterContext.js';

const Register = ({ navigation }) => {
  const [flag, setflag] = useState(true)
  const { registerData, setRegisterData } = useContext(RegisterContext)
  const updateRegisterData = (updates) => {
    setRegisterData(prev => ({ ...prev, ...updates }))
  }
  const checkPasswordStrength = (password) => {
    const result = {
      isValid: true,
      errors: [],
    };

    if (password.length !== 6) {
      result.isValid = false;
      result.errors.push('Password must be exactly 6 characters long');
      return result
    }

    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
      return result
    }

    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
      return result
    }

    if (!/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
      return result
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one special character');
      return result
    }

    return result;
  };
  function isValidEmail(email) {
    if (typeof email !== "string") return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function handleContinue() {
    if (registerData.email == "" || registerData.fullname == "" || registerData.password == "" || registerData.role == "") {
      Toast.show({
        type: "error",
        text1: "fill all the details"
      })
      return
    }

    let res = checkPasswordStrength(registerData.password)
    console.log(res)

    if (res.isValid == false) {


      Toast.show({
        type: "error",
        text1: res.errors[0]
      })
      return
    }

    if(isValidEmail(registerData.email)==false){
      Toast.show({
        type:"error",
        text1:"check email formet"
      })
      return
    }
      if (registerData.role == "customer") {

        navigation.navigate("customer", registerData)
      }
      else {

        navigation.navigate("shopkeeper", registerData)
      }


  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* HEADER */}
          <LinearGradient
            colors={['#2f6d1a', '#4f9b2f']}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
              >
                <Icon name="arrow-left" size={22} color="#2f6d1a" />
              </Pressable>

              <View>
                <Text style={styles.headerTitle}>Register</Text>
                <Text style={styles.headerSubtitle}>
                  Create account in simple steps
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* CARD (NORMAL FLOW + OVERLAP) */}
          <View style={styles.card}>
            {/* STEP */}
            <View style={styles.stepRow}>
              <Text style={styles.stepText}>Step 1 of 3</Text>
            </View>

            <Text style={styles.cardTitle}>Select Role</Text>

            {/* ROLE */}
            <View style={styles.roleRow}>
              <Pressable
                onPress={() => updateRegisterData({ role: "customer" })}
                style={[
                  styles.roleCard,
                  registerData.role === 'customer' && styles.roleActive,
                ]}
              >
                <Icon
                  name="account"
                  size={26}
                  color={registerData.role === 'customer' ? '#4f9b2f' : '#777'}
                />
                <Text
                  style={[
                    styles.roleText,
                    registerData.role === 'customer' && styles.roleTextActive,
                  ]}
                >
                  Customer
                </Text>
              </Pressable>

              <Pressable
                onPress={() => updateRegisterData({ role: "shopkeeper" })}
                style={[
                  styles.roleCard,
                  registerData.role === 'shopkeeper' && styles.roleActive,
                ]}
              >
                <Icon
                  name="storefront-outline"
                  size={26}
                  color={registerData.role === 'shopkeeper' ? '#4f9b2f' : '#777'}
                />
                <Text
                  style={[
                    styles.roleText,
                    registerData.role === 'shopkeeper' && styles.roleTextActive,
                  ]}
                >
                  Shopkeeper
                </Text>
              </Pressable>
            </View>

            <Text style={styles.cardTitle}>Basic Information</Text>

            <TextInput
              value={registerData.fullname}
              placeholder="Full Name"
              placeholderTextColor="#999"
              onChangeText={(text) => updateRegisterData({ fullname: text })}
              style={styles.input}
            />

            <TextInput
              value={registerData.email}
              placeholder="Email Address"
              placeholderTextColor="#999"
              keyboardType="email-address"

              onChangeText={(text) => updateRegisterData({ email: text })}
              style={styles.input}
            />

            <View style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>

              <TextInput
              
                maxLength={6}

                value={registerData.password}
                placeholder="Password"
                placeholderTextColor="#999"
                
                secureTextEntry={flag}

                onChangeText={(text) => updateRegisterData({ password: text })}
                style={[styles.input, { width: "100%" }]}


              />

              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ position: "absolute", right: 10, top: '15' }} onPress={() => setflag(prev => !prev)}>
                <Icon name={flag ? 'eye-outline' : 'eye-off-outline'} size={20} color='#777' />
              </TouchableOpacity>
            </View>
            <GradientBtn text={"Continue"} func={handleContinue} />


            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.goBack()}
              >
                Login
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },

  /* HEADER */
  header: {
    height: 240,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 15,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backBtn: {
    backgroundColor: '#ffffffcc',
    height: 38,
    width: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e7f3e1',
    marginTop: 4,
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -80, // ✅ overlap effect (SAFE)
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  /* STEP */
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

  /* ROLE */
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleActive: {
    borderColor: '#4f9b2f',
    backgroundColor: '#f1f8ec',
  },
  roleText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#4f9b2f',
    fontWeight: '600',
  },

  /* INPUT */
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    color: 'black',
    flexShrink: 0
  },

  /* BUTTON */
  primaryBtn: {
    backgroundColor: '#4f9b2f',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  footerText: {
    textAlign: 'center',
    marginTop: 18,
    color: '#666',
  },
  link: {
    color: '#4f9b2f',
    fontWeight: '600',
  },
});
