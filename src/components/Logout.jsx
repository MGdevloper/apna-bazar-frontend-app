import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import keychain from 'react-native-keychain';

const Logout = ({
  label = 'Log Out',
  style,
  textStyle,
  navigation,
  confirmTitle = 'Logout',
  confirmMessage = 'Are you sure you want to log out?',
}) => {
  const performLogout = async () => {
    try {
      await keychain.resetGenericPassword();
    } catch (error) {
      console.log('Error removing keychain password:', error);
    }
    
    if (navigation?.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }
  };

  const handleLogout = () => {
    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: performLogout,
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={[styles.button, style]}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default Logout;

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
