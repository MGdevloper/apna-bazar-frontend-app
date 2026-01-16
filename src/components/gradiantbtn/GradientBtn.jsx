import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import LinearGradient from 'react-native-linear-gradient'

const GradientBtn = ({text,func,width="",height=50}) => {
    return (
        <TouchableOpacity onPress={func} activeOpacity={0.8}>
            <LinearGradient
                colors={['#3c9440', '#9ad780']}   // dark green → light green
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}              // left → right
                style={[styles.primaryBtn,{width:width,height:height}]}
            >
                <Text style={styles.primaryText}>{text}</Text>
            </LinearGradient>
        </TouchableOpacity>
    )
}

export default GradientBtn

const styles = StyleSheet.create({
    primaryBtn: {
        // backgroundColor: '#4f9b2f',
       
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',


    },
    primaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
})