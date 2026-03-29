import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import LinearGradient from 'react-native-linear-gradient'
import Toast from 'react-native-toast-message'
import GradientBtn from './gradiantbtn/GradientBtn'
import axios from 'axios'
import Config from 'react-native-config'

const Resetpass = ({ navigation,route }) => {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    
    const checkPasswordStrength = (password) => {
        const result = {
            isValid: true,
            errors: [],
        }

        if (password.length !== 6) {
            result.isValid = false
            result.errors.push('Password must be exactly 6 characters long')
            return result
        }

        if (!/[a-z]/.test(password)) {
            result.isValid = false
            result.errors.push('Password must contain at least one lowercase letter')
            return result
        }

        if (!/[A-Z]/.test(password)) {
            result.isValid = false
            result.errors.push('Password must contain at least one uppercase letter')
            return result
        }

        if (!/[0-9]/.test(password)) {
            result.isValid = false
            result.errors.push('Password must contain at least one number')
            return result
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.isValid = false
            result.errors.push('Password must contain at least one special character')
            return result
        }

        return result
    }

    const handleSubmit = async() => {
        if (!newPassword || !confirmPassword) {
            Toast.show({ type:"error", text1: 'Please fill all fields' })
            return
        }

        const strength = checkPasswordStrength(newPassword)
        if (strength.isValid === false) {
            Toast.show({ type:"error", text1: strength.errors[0] })
            return
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type:"error", text1: 'Passwords do not match' })
            return
        }


        
        try {
            await axios.post(`${Config.API_URL}/updatepassword`,{newPassword,confirmPassword,email:route.params.email })
    
            Toast.show({type:"success", text1: 'Password updated' })
            navigation.navigate('Login')
            
        } catch (error) {
            console.log("error while hiting updatepassword endpoint",error);
            
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
                    <LinearGradient colors={['#2f6d1a', '#4f9b2f']} style={styles.header}>
                        <View style={styles.headerRow}>
                            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <Icon name="arrow-left" size={22} color="#2f6d1a" />
                            </Pressable>
                            <View>
                                <Text style={styles.headerTitle}>Reset Password</Text>
                                <Text style={styles.headerSubtitle}>Create a new password</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.card}>
                        <View style={styles.inputRow}>
                            <View style={styles.iconBadge}>
                                <Icon name="lock-outline" size={20} color="#2f6a1b" />
                            </View>
                            <TextInput
                                maxLength={6}
                                placeholder="New Password"
                                placeholderTextColor="#9aa3b5"
                                secureTextEntry={!showNew}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                style={styles.input}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNew(prev => !prev)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Icon name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#7e8a9a" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={styles.iconBadge}>
                                <Icon name="lock-check-outline" size={20} color="#2f6a1b" />
                            </View>
                            <TextInput
                                maxLength={6}
                                placeholder="Confirm Password"
                                placeholderTextColor="#9aa3b5"
                                secureTextEntry={!showConfirm}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                style={styles.input}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirm(prev => !prev)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#7e8a9a" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.helperText}>
                            Password must be exactly 6 characters and include uppercase, lowercase, number, and special character.
                        </Text>

                        <GradientBtn text="Update Password" func={handleSubmit} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Resetpass

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
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
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: -40,
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        gap: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        backgroundColor: '#fafafa',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 10,
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
    helperText: {
        fontSize: 12,
        color: '#6c7685',
        lineHeight: 16,
    },
})
