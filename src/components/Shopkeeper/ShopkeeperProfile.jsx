import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import keychain from 'react-native-keychain';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { Dropdown } from 'react-native-element-dropdown';

const categoriesData = [
    { label: 'Grocery', value: 'grocery' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Pharmacy', value: 'Pharmacy' },
    { label: 'stationery', value: 'stationery' },
    { label: 'clothes', value: 'clothes' },
    { label: 'Fruits & Vegetables', value: 'Fruits & Vegetables' },
    { label: 'others', value: 'others' },
];

const defaultProfile = {
    shopname: 'My Shop',
    name: 'N/A',
    email: 'N/A',
    phone: 'N/A',
    category: 'General',
    isVerified: false,
    createdAt: '',
    shopaddress: {
        area: '',
        city: '',
        state: '',
        pincode: '',
        location: {
            type: 'Point',
            coordinates: [],
        },
    },
};

const formatJoinDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const ShopkeeperProfile = ({ route, navigation }) => {
    const [profileData, setProfileData] = useState(route?.params?.profile || null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const profile = profileData || defaultProfile;
    const shopName = profile?.shopname || 'My Shop';
    const ownerName = profile?.name || 'N/A';
    const email = profile?.email || 'N/A';
    const isVerified = Boolean(profile?.isVerified);
    const joinedDate = formatJoinDate(profile?.createdAt);
    const category = profile?.category || 'General';

    const [phone, setPhone] = useState(profile?.phone || '');
    const [draftPhone, setDraftPhone] = useState(profile?.phone || '');
    const [isEditingPhone, setIsEditingPhone] = useState(false);

    const [ownerNameValue, setOwnerNameValue] = useState(ownerName || '');
    const [draftOwnerName, setDraftOwnerName] = useState(ownerName || '');
    const [isEditingOwnerName, setIsEditingOwnerName] = useState(false);

    const [shopInfo, setShopInfo] = useState(() => ({
        shopName: profile?.shopname || '',
        category: profile?.category || '',
    }));
    const [draftShopInfo, setDraftShopInfo] = useState(shopInfo);
    const [isEditingShop, setIsEditingShop] = useState(false);

    const [address, setAddress] = useState(() => ({
        area: profile?.shopaddress?.area || profile?.shopaddress?.address || '',
        city: profile?.shopaddress?.city || '',
        state: profile?.shopaddress?.state || '',
        pincode: profile?.shopaddress?.pincode || '',
        location: profile?.shopaddress?.location || { type: 'Point', coordinates: [] },
    }));
    const [draftAddress, setDraftAddress] = useState(address);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [latLong, setLatLong] = useState(() => {
        const coords = profile?.shopaddress?.location?.coordinates || [];
        return coords.length === 2 ? { lat: coords[1], long: coords[0] } : { lat: '', long: '' };
    });

    const fullAddress = [address?.area, address?.city, address?.state, address?.pincode]
        .filter(Boolean)
        .join(', ');

    const userInitial = (shopName?.trim()?.charAt(0) || 'S').toUpperCase();

    useEffect(() => {
        if (route?.params?.profile) {
            const incomingProfile = route.params.profile;
            console.log('====================================');
            console.log(incomingProfile);
            console.log('====================================');
            setProfileData(incomingProfile);

            // Update all dependent states when profile data changes
            setShopInfo({
                shopName: incomingProfile?.shopname || '',
                category: incomingProfile?.category || '',
            });
            setDraftShopInfo({
                shopName: incomingProfile?.shopname || '',
                category: incomingProfile?.category || '',
            });

            const newAddress = {
                area:
                    incomingProfile?.shopaddress?.area ||
                    incomingProfile?.shopaddress?.address ||
                    incomingProfile?.shopaddress?.display_name ||
                    '',
                city: incomingProfile?.shopaddress?.city || '',
                state: incomingProfile?.shopaddress?.state || '',
                pincode: incomingProfile?.shopaddress?.pincode || '',
                location: incomingProfile?.shopaddress?.location || { type: 'Point', coordinates: [] },
            };
            setAddress(newAddress);
            setDraftAddress(newAddress);
            const incomingCoords = incomingProfile?.shopaddress?.location?.coordinates || [];
            setLatLong(
                incomingCoords.length === 2
                    ? { lat: incomingCoords[1], long: incomingCoords[0] }
                    : { lat: '', long: '' }
            );

            const profilePhone = incomingProfile?.phone || '';
            setPhone(profilePhone);
            setDraftPhone(profilePhone);
        }
    }, [route?.params?.profile]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setIsProfileLoading(true);
                const keychainRes = await keychain.getGenericPassword();
                if (!keychainRes?.password) {
                    setIsProfileLoading(false);
                    return;
                }

                const token = JSON.parse(keychainRes.password).token;
                const userRes = await axios.post(`${Config.API_URL}/getprofile`, {
                    token,
                });
                if (userRes?.data?.user) {
                    const loadedProfile = userRes.data.user;
                    setProfileData(loadedProfile);

                    // Update all dependent states
                    setShopInfo({
                        shopName: loadedProfile?.shopname || '',
                        category: loadedProfile?.category || '',
                    });
                    setDraftShopInfo({
                        shopName: loadedProfile?.shopname || '',
                        category: loadedProfile?.category || '',
                    });

                    const newAddress = {
                        area:
                            loadedProfile?.shopaddress?.area ||
                            loadedProfile?.shopaddress?.address ||
                            loadedProfile?.shopaddress?.display_name ||
                            '',
                        city: loadedProfile?.shopaddress?.city || '',
                        state: loadedProfile?.shopaddress?.state || '',
                        pincode: loadedProfile?.shopaddress?.pincode || '',
                        location: loadedProfile?.shopaddress?.location || { type: 'Point', coordinates: [] },
                    };
                    setAddress(newAddress);
                    setDraftAddress(newAddress);
                    const loadedCoords = loadedProfile?.shopaddress?.location?.coordinates || [];
                    setLatLong(
                        loadedCoords.length === 2
                            ? { lat: loadedCoords[1], long: loadedCoords[0] }
                            : { lat: '', long: '' }
                    );

                    const profilePhone = loadedProfile?.phone || '';
                    setPhone(profilePhone);
                    setDraftPhone(profilePhone);
                }
            } catch (error) {
            } finally {
                setIsProfileLoading(false);
            }
        };

        loadProfile();
    }, []);

    const requestLocationPermission = async () => {
        const permission =
            Platform.OS === 'android'
                ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
                : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

        const permissionResult = await request(permission);
        if (permissionResult === RESULTS.GRANTED) return true;

        if (permissionResult === RESULTS.BLOCKED) {
            Alert.alert('Permission required', 'Please enable location from settings', [
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
                { text: 'Cancel', style: 'cancel' },
            ]);
        } else {
            Alert.alert('Permission Denied', 'Please allow location permission to use this feature.');
        }

        return false;
    };

    const useCurrentLocation = async () => {
        if (isLoadingLocation) return;

        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            setIsLoadingLocation(false);
            Alert.alert('Permission Denied', 'Please allow location permission to use this feature.');
            return;
        }

        setIsLoadingLocation(true);

        Geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos?.coords?.latitude;
                const lon = pos?.coords?.longitude;

                if (!lat || !lon) {
                    setIsLoadingLocation(false);
                    Toast.show({
                        type: 'error',
                        text1: 'Location error',
                        text2: 'Unable to get your current location.',
                    });
                    return;
                }

                setLatLong({ lat, long: lon });
                setIsLoadingLocation(false)

                try {
                    let info = await axios.get('https://nominatim.openstreetmap.org/reverse', {
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
                    });

                    const geoAddress = info?.data?.address || {};
                    const newAddress = {
                        area: info?.data?.display_name || '',
                        city:
                            geoAddress?.city ||
                            geoAddress?.town ||
                            geoAddress?.village ||
                            geoAddress?.county ||
                            geoAddress?.municipality ||
                            geoAddress?.region ||
                            geoAddress?.district ||
                            '',
                        state: geoAddress?.state || '',
                        pincode: geoAddress?.postcode || '',
                        location: {
                            type: 'Point',
                            coordinates: [lon, lat],
                        },
                    };

                    console.log("newadd:",newAddress);
                    
                    setDraftAddress(newAddress);

                    try {
                        const keychainRes = await keychain.getGenericPassword();
                        const token = JSON.parse(keychainRes.password).token;

                        await axios.post(`${Config.API_URL}/updateprofile`, {
                            token,
                            shopaddress: newAddress,
                        });

                        setAddress(newAddress);
                        setProfileData({ ...profileData, shopaddress: newAddress });

                        Toast.show({
                            type: 'success',
                            text1: 'Location updated successfully',
                            visibilityTime: 2000,
                        });
                    } catch (saveError) {
                        console.log(saveError);
                        setAddress(newAddress);
                        Toast.show({
                            type: 'error',
                            text1: 'Location fetched but failed to save',
                            text2: 'Please try again',
                        });
                    }
                } catch (error) {
                    console.log(error);
                    
                    Toast.show({
                        type: 'error',
                        text1: 'Network error',
                        text2: 'Unable to fetch address. Please try again.',
                    });
                }
                setIsLoadingLocation(false);
            },
            () => {
                Toast.show({
                    type: 'error',
                    text1: 'Location error',
                    text2: 'Unable to get your location. Please enable location services.',
                });
                setIsLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
                forceRequestLocation: true,
            }
        );
    };

    const openPhoneEditor = () => {
        setDraftPhone(phone);
        setIsEditingPhone(true);
    };

    const openOwnerNameEditor = () => {
        setDraftOwnerName(ownerNameValue);
        setIsEditingOwnerName(true);
    };

    const openShopEditor = () => {
        setDraftShopInfo(shopInfo);
        setIsEditingShop(true);
    };

    const openAddressEditor = () => {
        setDraftAddress(address);
        setIsEditingAddress(true);
    };

    const handleSubmit = async (type, value, data) => {
        try {
            if (type === 'phone') {
                console.log('📞 Phone save btn click');
                console.log('Edited phone number:', value);
                setPhone(value);
                setProfileData({ ...profileData, phone: value });

                await axios.post(`${Config.API_URL}/updateprofile`, {

                    phone: value,
                    role: "shopkeeper",
                    _id: route?.params?.profile._id,
                });

                setIsEditingPhone(false);


                Toast.show({
                    type: 'success',
                    text1: 'Phone number updated',
                    visibilityTime: 2000,
                });
                return;
            }

            if (type === 'ownerName') {
                setOwnerNameValue(value);
                setProfileData({ ...profileData, name: value });
                await axios.post(`${Config.API_URL}/updateprofile`, {
                    ownername: value,
                    role: "shopkeeper",
                    _id: route?.params?.profile._id,
                })
                setIsEditingOwnerName(false);
                Toast.show({
                    type: 'success',
                    text1: 'Owner name updated',
                    visibilityTime: 2000,
                });
                return;
            }

            if (type === 'shop') {
                console.log('🏪 Shop Details save btn click');
                console.log('Edited shop details:', data);
                setShopInfo(data);
                setProfileData({
                    ...profileData,
                    shopname: data.shopName,
                    category: data.category,
                });

                await axios.post(`${Config.API_URL}/updateprofile`, {
                    shopname: data.shopName,
                    category: data.category,
                    role: "shopkeeper",
                    _id: route?.params?.profile._id,
                })
                setIsEditingShop(false);
                Toast.show({
                    type: 'success',
                    text1: 'Shop details updated',
                    visibilityTime: 2000,
                });
                return;
            }

            if (type === 'address') {
                console.log('📍 Shop Address save btn click');
                console.log('Edited address:', data);
                setAddress(data);
                setProfileData({ ...profileData, shopaddress: data });
                await axios.post(`${Config.API_URL}/updateprofile`, {
                    address: data,
                    role: "shopkeeper",
                    _id: profileData?._id || route?.params?.profile?._id,

                })
                setIsEditingAddress(false);

                Toast.show({
                    type: 'success',
                    text1: 'Address updated',
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.log('Error updating profile:', error.message);
            Toast.show({
                type: 'error',
                text1: 'Failed to update',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const savePhone = async () => {
        if (!draftPhone.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Phone number cannot be empty',
            });
            return;
        }

        try {
            setIsSaving(true);
            await handleSubmit('phone', draftPhone);
        } finally {
            setIsSaving(false);
        }
    };

    const saveOwnerName = async () => {
        if (!draftOwnerName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Owner name cannot be empty',
            });
            return;
        }

        try {
            setIsSaving(true);
            await handleSubmit('ownerName', draftOwnerName);
        } finally {
            setIsSaving(false);
        }
    };

    const saveShopInfo = async () => {
        if (!draftShopInfo.shopName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Shop name cannot be empty',
            });
            return;
        }

        try {
            setIsSaving(true);
            await handleSubmit('shop', null, draftShopInfo);
        } finally {
            setIsSaving(false);
        }
    };

    const saveAddress = async () => {
        if (
            !draftAddress.area.trim() ||
            !draftAddress.city.trim() ||
            !draftAddress.state.trim() ||
            !draftAddress.pincode.trim()
        ) {
            Toast.show({
                type: 'error',
                text1: 'Please fill address fields',
            });
            return;
        }

        const coordFromDraft = draftAddress?.location?.coordinates || [];
        const hasDraftCoords = coordFromDraft.length === 2;
        const hasLatLong = Boolean(latLong?.lat && latLong?.long);

        if (!hasDraftCoords && !hasLatLong) {
            Toast.show({
                type: 'error',
                text1: 'Please use current location to set coordinates',
            });
            return;
        }

        const coordinates = hasDraftCoords
            ? [Number(coordFromDraft[0]), Number(coordFromDraft[1])]
            : [Number(latLong.long), Number(latLong.lat)];

        const payloadAddress = {
            area: draftAddress.area,
            city: draftAddress.city,
            state: draftAddress.state,
            pincode: draftAddress.pincode,
            location: {
                type: 'Point',
                coordinates,
            },
        };

        try {
            setIsSaving(true);
            await handleSubmit('address', null, payloadAddress);
        } finally {
            setIsSaving(false);
        }
    };

    const cancelPhoneEdit = () => {
        setDraftPhone(phone);
        setIsEditingPhone(false);
    };

    const cancelOwnerNameEdit = () => {
        setDraftOwnerName(ownerNameValue);
        setIsEditingOwnerName(false);
    };

    const cancelShopEdit = () => {
        setDraftShopInfo(shopInfo);
        setIsEditingShop(false);
    };

    const cancelAddressEdit = () => {
        setDraftAddress(address);
        setIsEditingAddress(false);
    };

    const updateDraftAddressField = (field, value) => {
        setDraftAddress((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setIsLoggingOut(true);
                        await keychain.resetGenericPassword();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    } catch (error) {
                        Toast.show({
                            type: 'error',
                            text1: 'Logout failed',
                        });
                    } finally {
                        setIsLoggingOut(false);
                    }
                },
            },
        ]);
    };

    if (isProfileLoading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2f6d1a" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={60}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{userInitial}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.shopName}>{shopName}</Text>
                            {ownerName !== 'N/A' && (
                                <Text style={styles.ownerNameText}>Owner: {ownerName}</Text>
                            )}
                            <View style={styles.verificationRow}>
                                {isVerified ? (
                                    <>
                                        <Icon name="check-circle" size={14} color="#10b981" />
                                        <Text style={styles.verifiedText}>Verified</Text>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="alert-circle" size={14} color="#f59e0b" />
                                        <Text style={styles.unverifiedText}>Not Verified</Text>
                                    </>
                                )}
                            </View>
                            <Text style={styles.emailText}>{email}</Text>
                            <Text style={styles.joinedText}>Joined {joinedDate}</Text>
                        </View>
                    </View>

                    {/* Owner Name Card */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Owner Information</Text>
                            {!isEditingOwnerName && (
                                <TouchableOpacity onPress={openOwnerNameEditor}>
                                    <Icon name="pencil" size={18} color="#2f6d1a" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditingOwnerName ? (
                            <View style={styles.editContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter owner name"
                                    value={draftOwnerName}
                                    onChangeText={setDraftOwnerName}
                                    editable={!isSaving}
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelOwnerNameEdit}
                                        disabled={isSaving}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={saveOwnerName}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoCard}>
                                <Icon name="account" size={18} color="#2f6d1a" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Owner Name</Text>
                                    <Text style={styles.infoValue}>{ownerNameValue}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Email Card */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Email Address</Text>
                        <View style={styles.infoCard}>
                            <Icon name="email" size={18} color="#2f6d1a" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Phone Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Contact Number</Text>
                            {!isEditingPhone && (
                                <TouchableOpacity onPress={openPhoneEditor}>
                                    <Icon name="pencil" size={18} color="#2f6d1a" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditingPhone ? (
                            <View style={styles.editContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter phone number"
                                    value={draftPhone}
                                    onChangeText={setDraftPhone}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    editable={!isSaving}
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelPhoneEdit}
                                        disabled={isSaving}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={savePhone}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoCard}>
                                <Icon name="phone" size={18} color="#2f6d1a" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Phone</Text>
                                    <Text style={styles.infoValue}>{phone}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Shop Information Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Shop Details</Text>
                            {!isEditingShop && (
                                <TouchableOpacity onPress={openShopEditor}>
                                    <Icon name="pencil" size={18} color="#2f6d1a" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditingShop ? (
                            <View style={styles.editContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Shop Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter shop name"
                                        value={draftShopInfo.shopName}
                                        onChangeText={(text) =>
                                            setDraftShopInfo({ ...draftShopInfo, shopName: text })
                                        }
                                        editable={!isSaving}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Category</Text>
                                    <Dropdown
                                        style={[styles.input, { textAlign: 'left' }]}
                                        placeholderStyle={{ color: '#8ba095', textAlign: 'left' }}
                                        data={categoriesData}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select Category"
                                        value={draftShopInfo.category}
                                        onChange={(item) =>
                                            setDraftShopInfo({ ...draftShopInfo, category: item.value })
                                        }
                                    />
                                </View>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={cancelShopEdit}
                                        disabled={isSaving}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={saveShopInfo}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.infoCard}>
                                    <Icon name="store" size={18} color="#2f6d1a" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Shop Name</Text>
                                        <Text style={styles.infoValue}>{shopInfo.shopName}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoCard}>
                                    <Icon name="tag" size={18} color="#2f6d1a" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Category</Text>
                                        <Text style={styles.infoValue}>{shopInfo.category}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Address Section */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Shop Address</Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.editAddressBtn}
                                onPress={() => {
                                    setDraftAddress(address);
                                    setIsEditingAddress(true);
                                }}
                            >
                                <Icon name="pencil-outline" size={14} color="#2f6d1a" />
                                <Text style={styles.editAddressText}>Change Address</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <Icon name="home-city-outline" size={18} color="#2f6d1a" />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Location</Text>
                                <Text style={styles.rowValue}>
                                    {[address?.city, address?.state, address?.pincode].filter(Boolean).join(', ') || 'N/A'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <Icon name="map-marker-outline" size={18} color="#2f6d1a" />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Area/Address</Text>
                                <Text style={styles.rowValue}>{address?.area || 'Not Added'}</Text>
                            </View>
                        </View>

                        {isEditingAddress ? (
                            <View style={styles.editCard}>
                                <Text style={styles.editTitle}>Update Shop Address</Text>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={styles.currentLocationBtn}
                                    onPress={useCurrentLocation}
                                    disabled={isLoadingLocation}
                                >
                                    {isLoadingLocation ? (
                                        <ActivityIndicator size="small" color="#2f6d1a" />
                                    ) : (
                                        <Icon name="crosshairs-gps" size={16} color="#2f6d1a" />
                                    )}
                                    <Text style={styles.currentLocationText}>
                                        {isLoadingLocation ? 'Detecting Location...' : 'Use Current Location'}
                                    </Text>
                                </TouchableOpacity>

                                <TextInput
                                    value={draftAddress.area}
                                    onChangeText={(text) => updateDraftAddressField('area', text)}
                                    placeholder="Area / Address"
                                    placeholderTextColor="#8ba095"
                                    style={[styles.input, styles.multilineInput]}
                                    multiline
                                />
                                <TextInput
                                    value={draftAddress.city}
                                    onChangeText={(text) => updateDraftAddressField('city', text)}
                                    placeholder="City"
                                    placeholderTextColor="#8ba095"
                                    style={styles.input}
                                />
                                <TextInput
                                    value={draftAddress.state}
                                    onChangeText={(text) => updateDraftAddressField('state', text)}
                                    placeholder="State"
                                    placeholderTextColor="#8ba095"
                                    style={styles.input}
                                />
                                <TextInput
                                    value={draftAddress.pincode}
                                    onChangeText={(text) => updateDraftAddressField('pincode', text)}
                                    placeholder="Pincode"
                                    placeholderTextColor="#8ba095"
                                    keyboardType="number-pad"
                                    style={styles.input}
                                />

                                <View style={styles.actionRow}>
                                    <TouchableOpacity activeOpacity={0.85} style={styles.cancelBtn} onPress={cancelAddressEdit}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.85} style={styles.saveBtn} onPress={saveAddress} disabled={isSaving}>
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveBtnText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="logout" size={18} color="#fff" />
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ShopkeeperProfile;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#f4f7f4',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: 12,
        paddingBottom: 20,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e8df',
    },
    badge: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#edf6eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2f6d1a',
    },
    headerInfo: {
        flex: 1,
    },
    shopName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c2b1f',
    },
    ownerNameText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#708076',
        marginTop: 2,
        marginBottom: 2,
    },
    verificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        marginBottom: 4,
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
    unverifiedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#f59e0b',
    },
    emailText: {
        fontSize: 12,
        color: '#708076',
        marginBottom: 2,
    },
    joinedText: {
        fontSize: 10,
        color: '#9ca3af',
    },
    section: {
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c2b1f',
        marginBottom: 12,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e1e8df',
        marginBottom: 8,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        color: '#708076',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1c2b1f',
        marginTop: 2,
    },
    editContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e1e8df',
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1c2b1f',
        marginBottom: 6,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e1e8df',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#1c2b1f',
        backgroundColor: '#ffffff',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2f6d1a',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#2f6d1a',
        fontWeight: '700',
        fontSize: 12,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#2f6d1a',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#ef4444',
        borderRadius: 10,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    sectionCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e8df',
        padding: 14,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    editAddressBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#edf6eb',
    },
    editAddressText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2f6d1a',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 11,
        color: '#708076',
        fontWeight: '600',
        marginBottom: 4,
    },
    rowValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1c2b1f',
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#e1e8df',
        marginVertical: 8,
    },
    editCard: {
        backgroundColor: '#f9fbf8',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e1e8df',
        marginTop: 12,
    },
    editTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c2b1f',
        marginBottom: 12,
    },
    currentLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#edf6eb',
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#d4e8cc',
    },
    currentLocationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2f6d1a',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e1e8df',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#1c2b1f',
        backgroundColor: '#ffffff',
        marginBottom: 12,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2f6d1a',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#2f6d1a',
        fontWeight: '700',
        fontSize: 12,
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#2f6d1a',
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    bottomPadding: {
        height: 40,
    },
});
