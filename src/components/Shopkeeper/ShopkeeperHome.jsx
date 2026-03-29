import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OrdersScreen from './OrdersScreen.jsx';
import InventoryScreen from './InventoryScreen.jsx';
import DeliveryPartnersScreen from './DeliveryPartnersScreen.jsx';
import keychain from 'react-native-keychain';
import axios from 'axios';
import Config from 'react-native-config';
import { io } from 'socket.io-client';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Orders: 'clipboard-list',
  Inventory: 'package-variant-closed',
  Delivery: 'bike-fast',
};

function AnimatedTabBarIcon({ name, color, focused }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.72)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.08 : 1,
        useNativeDriver: true,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.72,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacityAnim, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <Icon name={name} size={focused ? 25 : 23} color={color} />
    </Animated.View>
  );
}

function AnimatedTabLabel({ label, color, focused }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.94)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.75)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.94,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.75,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacityAnim, scaleAnim]);

  return (
    <Animated.Text
      style={[
        styles.tabLabel,
        { color, transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      {label}
    </Animated.Text>
  );
}

function AnimatedTabButton({ children, onPress, accessibilityState }) {
  const focused = Boolean(accessibilityState?.selected);
  const pillScale = useRef(new Animated.Value(focused ? 1 : 0.96)).current;
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale, {
        toValue: focused ? 1 : 0.96,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, pillOpacity, pillScale]);

  return (
    <Pressable onPress={onPress} style={styles.tabPressable}>
      <Animated.View
        style={[
          styles.tabPill,
          {
            opacity: pillOpacity,
            transform: [{ scale: pillScale }],
          },
        ]}
      />
      {children}
    </Pressable>
  );
}

const ShopkeeperHome = ({ route, navigation }) => {
  const email = route?.params?.email || '';
  const greetingEmoji = '🏪';
  const userInitial = (email?.trim()?.charAt(0) || 'S').toUpperCase();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 0)
    : insets.top;
  const tabBarBottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 6);
  const tabBarHeight = 60 + tabBarBottomPadding;

  React.useEffect(() => {
    (async () => {

      let res = await keychain.getGenericPassword();
      let token = JSON.parse(res.password).token;
      console.log('====================================');
      console.log(token);
      console.log('====================================');

      const socket=io(Config.API_URL)

      socket.emit("join_shopkeeper",token)
    })()

  }, [])
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.topBarWrap, { paddingTop: topInset + 8 }]}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarCaption}>Shopkeeper</Text>
            <Text style={styles.brand}>Apna Bazar</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              {greetingEmoji} Welcome{email ? `, ${email}` : ''}
            </Text>
          </View>
          <View style={styles.badgeShadow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  let res = await keychain.getGenericPassword();
                  let token = JSON.parse(res.password).token;
                  let userRes = await axios.post(
                    `${Config.API_URL}/getprofile`,
                    {},
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  navigation.navigate('shopkeeperprofile', {
                    profile: userRes.data.user,
                  });
                } catch (error) {
                  navigation.navigate('shopkeeperprofile', {
                    profile: {
                      email,
                      shopName: email ? email.split('@')[0] : 'Shop',
                      isVerified: true,
                    },
                  });
                }
              }}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeInitial}>{userInitial}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#2f6d1a',
          tabBarInactiveTintColor: '#72807a',
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: tabBarBottomPadding,
            },
          ],
          tabBarItemStyle: styles.tabBarItem,
          tabBarIconStyle: styles.tabBarIconStyle,
          tabBarLabel: ({ color, focused }) => (
            <AnimatedTabLabel label={route.name} color={color} focused={focused} />
          ),
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name={tabIcons[route.name]}
              color={color}
              focused={focused}
            />
          ),
        })}
      >
        <Tab.Screen name="Orders" component={OrdersScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Delivery" component={DeliveryPartnersScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default ShopkeeperHome;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7f4',
  },
  topBarWrap: {
    backgroundColor: '#f4f7f4',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
  },
  topBar: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e1e8df',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  topBarLeft: {
    flex: 1,
    paddingRight: 10,
  },
  topBarCaption: {
    color: '#708076',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
    letterSpacing: 0.3,
  },
  badgeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 14,
  },
  brand: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1c2b1f',
    letterSpacing: 0.1,
    fontFamily: 'Poppins-Medium',
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#edf6eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4e4d0',
  },
  badgeInitial: {
    color: '#2f6d1a',
    fontSize: 22,
    fontWeight: '800',
  },
  greeting: {
    color: '#56695f',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  tabBar: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e4ebe3',
    backgroundColor: '#ffffff',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBarItem: {
    marginHorizontal: 4,
  },
  tabBarIconStyle: {
    marginTop: 2,
    marginBottom: 2,
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 8,
    right: 8,
    borderRadius: 12,
    backgroundColor: '#eaf5e8',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
});
