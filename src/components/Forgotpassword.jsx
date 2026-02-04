import { View, Text, Pressable, ScrollView, KeyboardAvoidingView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'

import { TextInput } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import LinearGradient from 'react-native-linear-gradient'
import GradientBtn from './gradiantbtn/GradientBtn'
const Forgotpassword = ({ navigation }) => {
    return (
        // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                                <Text style={styles.headerTitle}>Recover password</Text>
                                <Text style={styles.headerSubtitle}>
                                    Enter your registered mobile number.
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* CARD (NORMAL FLOW + OVERLAP) */}
                    <View style={[styles.card]}>
                        <View style={styles.inputrow}>

                            <View style={styles.iconBadge}>
                                <Icon name="phone" size={23} color="#2f6a1b" />
                            </View>
                            <View style={styles.codeBox}>
                                <Text style={styles.codeText}>+91</Text>
                            </View>
                            <TextInput
                                maxLength={10}

                                placeholder="Enter your mobile number"
                                placeholderTextColor="#9aa3b5"
                                keyboardType="phone-pad"
                                style={styles.input}
                            />
                        </View>
                        <GradientBtn text={'continue'} />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
    },
    ctn: {
        width: '85%',
        height: '40%',
        boxShadow: '0px 1px 13px 1px #00000024',
        borderRadius: 20
    },
    inputrow: {

        display: "flex",
        flexDirection: 'row',
        gap:10,
        alignItems: 'center',
        backgroundColor: '#fafafa',
    
        height: 47,

        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
    },
    iconBadge: {
        backgroundColor: '#dfe9d7',
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft:5
    },
    codeText: {
        fontSize: 15,
        color: 'white',
        fontWeight: '600',

        color: '#3d4654',
    },
    codeBox: {
        // paddingHorizontal: 10,
        // paddingVertical: 14,
        height: 32,
        width: 40,
        borderRadius: 10,
        backgroundColor: '#eef2f7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1f2430',
        paddingVertical: 0,
        height: 40,
        width: 100,
        // backgroundColor:'red'


    },
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
    card: {
        display: "flex",
        flexDirection: 'column',

        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -40, // ✅ overlap effect (SAFE)
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        gap: 10

    },
})
export default Forgotpassword