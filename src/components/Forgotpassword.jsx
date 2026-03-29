import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'

import { TextInput } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import LinearGradient from 'react-native-linear-gradient'
import GradientBtn from './gradiantbtn/GradientBtn'
import axios from 'axios'
import Config from 'react-native-config'
import Toast from 'react-native-toast-message'
const Forgotpassword = (route ) => {
    let [email,setemail]=useState("")
    function isValidEmail(value) {
        if (typeof value !== "string") return false
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    }
   async function handlesubmit(){

        if(isValidEmail(email)==false){
            Toast.show({
                type:"error",
                text1:"check email formet"
            })
            return
        }
        try{

            let result=await axios.post(`${Config.API_URL}/forgotpass_sendemail`,{email})
            console.log(result);
            
            if(result.data.success==false)
            {
                Toast.show({
                    type:"error",
                    text1:result.data.message
                })
            }
            if(result.data.success==true){
                
                Toast.show({
                    type:"success",
                    text1:result.data.message
                })

                route.navigation.navigate('otp',{email,role:"forgotpassword"})
                return
            }


        }catch(err){
            Toast.show({
                type:"error",
                text1:err
            })
            console.log('====================================');
            console.log(err);
            console.log('====================================');
            return
        }
    }
    useEffect(()=>{
        console.log(email)
    },[email])
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
                                onPress={() => route.navigation.goBack()}
                                style={styles.backBtn}
                            >
                                <Icon name="arrow-left" size={22} color="#2f6d1a" />
                            </Pressable>

                            <View>
                                <Text style={styles.headerTitle}>Recover password</Text>
                                <Text style={styles.headerSubtitle}>
                                    Enter your registered email address.
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* CARD (NORMAL FLOW + OVERLAP) */}
                    <View style={[styles.card]}>
                        <View style={styles.inputrow}>

                            <View style={styles.iconBadge}>
                                <Icon name="email-outline" size={23} color="#2f6a1b" />
                            </View>
                            <TextInput

                            onChangeText={(t)=>setemail(t)}
                                placeholder="Enter your email address"
                                placeholderTextColor="#9aa3b5"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={email}
                                style={styles.input}
                            />
                        </View>
                        <GradientBtn func={handlesubmit} text={'continue'} />
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
