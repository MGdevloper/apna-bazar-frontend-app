import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import keychain from "react-native-keychain"
import axios from 'axios';
import Config from 'react-native-config';
import { requestAuthorization } from 'react-native-geolocation-service';
import { set } from 'pm2';

const DeliveryPartnersScreen = ({ navigation }) => {
    const [shopkeeperId, setShopkeeperId] = useState(null);
    const [partners, setPartners] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [editingPartnerId, setEditingPartnerId] = useState(null);

    const getStoredToken = async () => {
        const credentials = await keychain.getGenericPassword();
        const parsedCredentials = credentials?.password ? JSON.parse(credentials.password) : null;
        const token = parsedCredentials?.token;

        if (!token || typeof token !== 'string') {
            throw new Error('Session expired');
        }

        return token;
    };

    const fetchProfileAndPartners = async (existingToken) => {
        const token = existingToken || (await getStoredToken());

        const userRes = await axios.post(
            `${Config.API_URL}/getprofile`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const user = userRes?.data?.user;
        setPartners(user?.deliverypartners || []);
        setShopkeeperId(user?._id || null);
        return { token, user };
    };

    useEffect(() => {
        (async () => {
            try {
                const { user } = await fetchProfileAndPartners();
                console.log('Profile loaded in DeliveryPartnersScreen:', user?.deliverypartners);
            } catch (error) {
                if (error?.message === 'Session expired') {
                    Toast.show({
                        type: 'error',
                        text1: 'Session expired',
                        text2: 'Please login again',
                    });
                    return;
                }
                console.log('Failed to load profile in DeliveryPartnersScreen:', error?.response?.data || error?.message);
            }
        })();
    }, [])

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setEditingPartnerId(null);
    };

    const openAddPartnerModal = () => {
        resetForm();
        setIsModalVisible(true);
    };

    const openEditPartnerModal = (partner) => {

        setName(partner?.name || '');
        setEmail(partner?.email || '');
        setPhone(String(partner?.phone || '').replace(/[^0-9]/g, '').slice(-10));
        setEditingPartnerId(partner?._id || partner?.id || null);
        setIsModalVisible(true);
    };

    const validateForm = () => {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const digitsOnly = phone.replace(/[^0-9]/g, '');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!trimmedName) {
            Toast.show({ type: 'error', text1: 'Please enter partner name' });
            return false;
        }

        if (!trimmedEmail) {
            Toast.show({ type: 'error', text1: 'Please enter email address' });
            return false;
        }

        if (!emailPattern.test(trimmedEmail)) {
            Toast.show({ type: 'error', text1: 'Please enter a valid email address' });
            return false;
        }

        if (digitsOnly.length !== 10) {
            Toast.show({ type: 'error', text1: 'Phone number must be 10 digits' });
            return false;
        }

        return { name: trimmedName, email: trimmedEmail, phone: digitsOnly };
    };

    const handlePartner = async (role) => {
        const validatedData = validateForm();
        if (!validatedData) return;

        const { name: validName, email: validEmail, phone: validPhone } = validatedData;

        if(role === 'add') {
            try {
                const token = await getStoredToken();

                let res = await axios.post(
                    `${Config.API_URL}/updateprofile`,
                    {
                        role: "add_deliverypartner",
                        deliverypartner_phone: validPhone,
                        deliverypartner_email: validEmail,
                        deliverypartner_name: validName,
                        _id: shopkeeperId
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if(res.data.success === false){
                    Toast.show({
                        type: "error",
                        text1: 'Failed to add partner',
                        text2: res.data?.message || 'Please try again',
                    });
                    return;
                }

                console.log("updateduser", res.data.data);
                
                setPartners(res.data.data || []);
                Toast.show({
                    type: 'success',
                    text1: res.data?.message || 'Partner added successfully',
                });
                resetForm();
                setIsModalVisible(false);
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: error?.response?.data?.message || 'Failed to add partner',
                });
            }
        }

        if(role === 'edit'){
            try {
                const token = await getStoredToken();

                let res = await axios.post(
                    `${Config.API_URL}/updateprofile`,
                    {
                        role: "edit_deliverypartner",
                        _id: shopkeeperId,
                        deliverypartner_id: editingPartnerId,
                        deliverypartner_phone: validPhone,
                        deliverypartner_email: validEmail,
                        deliverypartner_name: validName,
                        phone: validPhone,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if(res.data.success === false){
                    Toast.show({
                        type: "error",
                        text1: 'Failed to update partner',
                        text2: res.data?.message || 'Please try again',
                    });
                    return;
                }   
                
                console.log(res);
                
                setPartners(res.data.data || []);
                Toast.show({
                    type: 'success',
                    text1: res.data?.message || 'Partner updated successfully',
                });
                resetForm();
                setIsModalVisible(false);
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: error?.response?.data?.message || 'Failed to update partner',
                });
            }
        }
    };

    const handleCallPartner = async (partnerPhone) => {
        const phoneNumber = String(partnerPhone || '').replace(/[^0-9]/g, '');

        if (!phoneNumber) {
            Toast.show({ type: 'error', text1: 'Phone number not available' });
            return;
        }

        const primaryDialUrl = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
        const fallbackDialUrl = `tel:${phoneNumber}`;

        try {
            await Linking.openURL(primaryDialUrl);
        } catch (error) {
            try {
                await Linking.openURL(fallbackDialUrl);
            } catch (fallbackError) {
                Toast.show({ type: 'error', text1: 'Unable to open dialer' });
            }
        }
    };

    const handleDeletePartner = (partner) => {
        Alert.alert(
            'Delete Partner',
            `Are you sure you want to remove ${partner?.name || 'this partner'}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await getStoredToken();
                            const partnerId = partner?._id || partner?.id;

                            if (!shopkeeperId || !partnerId) {
                                throw new Error('Missing required IDs');
                            }

                            const res = await axios.post(
                                `${Config.API_URL}/updateprofile`,
                                {
                                    role: 'delete_deliverypartner',
                                    _id: shopkeeperId,
                                    deliverypartner_id: partnerId,
                                },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );

                            if (res.data.success === false) {
                                Toast.show({
                                    type: 'error',
                                    text1: res.data?.message || 'Failed to delete partner',
                                });
                                return;
                            }

                            setPartners(res.data.data || []);
                            Toast.show({
                                type: 'success',
                                text1: res.data?.message || 'Partner deleted successfully',
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: error?.response?.data?.message || 'Failed to delete partner',
                            });
                        }
                    },
                },
            ]
        );
    };

    const renderPartnerCard = ({ item }) => (
        <TouchableOpacity
            style={styles.partnerCard}
            activeOpacity={0.7}
        >
            <View style={styles.partnerHeader}>
                <View style={styles.avatarSection}>
                    <View style={[styles.avatar, { backgroundColor: '#edf6eb' }]}>
                        <Icon name="account" size={24} color="#2f6d1a" />
                    </View>
                    <View style={styles.partnerInfo}>
                        <Text style={styles.partnerName}>{item.name}</Text>
                        <Text style={styles.partnerPhone}>{item.phone}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCallPartner(item.phone)}
                >
                    <Icon name="phone" size={16} color="#2f6d1a" />
                    <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditPartnerModal(item)}
                >
                    <Icon name="pencil" size={16} color="#2f6d1a" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeletePartner(item)}
                >
                    <Icon name="delete" size={16} color="#dc2626" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const totalPartners = partners.length;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Delivery Partners</Text>
                    <Text style={styles.headerSubtitle}>
                        {totalPartners} {totalPartners === 1 ? 'partner' : 'partners'}
                    </Text>
                </View>
                <View style={styles.headerBadge}>
                    <Text style={styles.badgeText}>{totalPartners}</Text>
                </View>
            </View>

            <FlatList
                data={partners}
                renderItem={renderPartnerCard}
                keyExtractor={(item) => String(item?._id || item?.id)}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true}
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={openAddPartnerModal}
            >
                <Icon name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Partner</Text>
            </TouchableOpacity>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    resetForm();
                    setIsModalVisible(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingPartnerId ? 'Edit Delivery Partner' : 'Add Delivery Partner'}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    resetForm();
                                    setIsModalVisible(false);
                                }}
                            >
                                <Icon name="close" size={24} color="#1c2b1f" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.formContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Partner Name *</Text>
                                <View style={styles.inputWrapper}>
                                    <Icon name="account" size={18} color="#2f6d1a" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter partner name"
                                        value={name}
                                        onChangeText={setName}
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email Address *</Text>
                                <View style={styles.inputWrapper}>
                                    <Icon name="email" size={18} color="#2f6d1a" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter email address"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone Number *</Text>
                                <View style={styles.inputWrapper}>
                                    <Icon name="phone" size={18} color="#2f6d1a" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 10 digit phone number"
                                        value={phone}
                                        onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    resetForm();
                                    setIsModalVisible(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.addButtonModal}
                                onPress={() => handlePartner(editingPartnerId ? 'edit' : 'add')}
                            >
                                <Text style={styles.addButtonModalText}>{editingPartnerId ? 'Save Changes' : 'Add Partner'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default DeliveryPartnersScreen;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#f4f7f4',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c2b1f',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#708076',
        marginTop: 2,
    },
    headerBadge: {
        backgroundColor: '#2f6d1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 80,
    },
    partnerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e1e8df',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    partnerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1c2b1f',
    },
    partnerPhone: {
        fontSize: 11,
        color: '#708076',
        marginTop: 3,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2f6d1a',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2f6d1a',
    },
    deleteButton: {
        borderColor: '#dc2626',
    },
    deleteButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#dc2626',
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2f6d1a',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#2f6d1a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8df',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c2b1f',
    },
    formContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 16,
    },
    inputGroup: {
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1c2b1f',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e1e8df',
        borderRadius: 10,
        backgroundColor: '#f4f7f4',
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1c2b1f',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e1e8df',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2f6d1a',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#2f6d1a',
        fontSize: 13,
        fontWeight: '700',
    },
    addButtonModal: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#2f6d1a',
        alignItems: 'center',
    },
    addButtonModalText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
