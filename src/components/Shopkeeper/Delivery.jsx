import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useContext, useMemo, useState } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import DeliveryContext from '../../context/DeliveryContext.js'
import GradientBtn from '../gradiantbtn/GradientBtn'

export default function Delivery({ navigation }) {
  const { deliverypartners = [], addDeliverypartner, removeDeliverypartner, editDeliverypartner } = useContext(DeliveryContext)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [editingId, setEditingId] = useState(null)

  const isEditing = useMemo(() => editingId !== null, [editingId])

  const resetForm = () => {
    setName('')
    setPhone('')
    setEditingId(null)
  }

  const getInitials = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/)
    if (!parts[0]) return 'DP'
    const first = parts[0][0] || ''
    const second = parts[1] ? parts[1][0] : ''
    return (first + second).toUpperCase()
  }

  const showError = (message) => {
    Toast.show({ type: 'error', text1: message })
  }

  const showSuccess = (message) => {
    Toast.show({ type: 'success', text1: message })
  }

  const handleSubmit = () => {
    const trimmedName = name.trim()
    const digitsOnly = phone.replace(/[^0-9]/g, '')

    if (!trimmedName) {
      showError('Please enter partner name')
      return
    }

    if (digitsOnly.length !== 10) {
      showError('Phone number must be 10 digits')
      return
    }

    if (isEditing) {
      editDeliverypartner(editingId, { id: editingId, name: trimmedName, phone: digitsOnly })
      showSuccess('Partner updated')
    } else {
      const nextId = deliverypartners.length
        ? Math.max(...deliverypartners.map((partner) => Number(partner.id) || 0)) + 1
        : 1
      addDeliverypartner({ id: nextId, name: trimmedName, phone: digitsOnly })
      showSuccess('Partner added')
    }

    resetForm()
  }

  const startEdit = (partner) => {
    setEditingId(partner.id)
    setName(partner.name || '')
    setPhone(String(partner.phone || ''))
  }

  const confirmRemove = (partner) => {
    Alert.alert(
      'Remove Partner',
      `Remove ${partner.name || 'this partner'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeDeliverypartner(partner.id)
            showSuccess('Partner removed')
          },
        },
      ]
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior='height' keyboardVerticalOffset={0}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        <View style={{ width: '100%' }}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={24} color="#2f6d1a" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Delivery Partners</Text>
              <Text style={styles.headerSub}>Add, edit, or remove partners</Text>
            </View>
          </View>
        </View>

        <LinearGradient colors={['#2f6d1a', '#4f9b2f']} style={styles.header} />

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>{isEditing ? 'Edit Partner' : 'Add Partner'}</Text>
            {isEditing ? <Text style={styles.editingBadge}>Editing</Text> : null}
          </View>

          <TextInput
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="Partner Name"
            placeholderTextColor="#7d8a99"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            keyboardType='phone-pad'
            maxLength={10}
            style={[styles.input, { textAlign: 'left' }]}
            placeholder="Phone Number"
            placeholderTextColor="#7d8a99"
            value={phone}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/[^0-9]/g, '')
              setPhone(digitsOnly)
            }}
          />

          <GradientBtn text={isEditing ? 'Save Changes' : 'Add Partner'} height={50} width='100%' func={handleSubmit} />

          {isEditing ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel Edit</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Partners List</Text>
          {deliverypartners.length === 0 ? (
            <Text style={styles.emptyText}>No partners added yet.</Text>
          ) : (
            deliverypartners.map((partner) => (
              <View key={partner.id} style={styles.partnerRow}>
                <View style={styles.partnerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(partner.name)}</Text>
                  </View>
                  <View style={styles.partnerText}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    <Text style={styles.partnerPhone}>{partner.phone}</Text>
                  </View>
                </View>
                <View style={styles.partnerActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(partner)}>
                    <Icon name="pencil-outline" size={18} color="#2f6d1a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmRemove(partner)}>
                    <Icon name="trash-can-outline" size={18} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 260,
    justifyContent: 'center',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: {
    paddingLeft: 20,
    paddingVertical: 15,
    backgroundColor: '#2f6d1a',
    paddingTop: 40,
    zIndex: 100,
    alignSelf: 'stretch',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#ffffffcc',
    width: 38,
    height: 38,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#e7f3e1',
    marginTop: 4,
  },
  card: {
    marginTop: -250,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a1a',
  },
  editingBadge: {
    backgroundColor: '#eaf4e6',
    color: '#2f6d1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d0d8e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    color: '#1a1a1a',
    backgroundColor: '#fafbfc',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  cancelBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: '#d32f2f',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e6edf3',
    marginVertical: 16,
  },
  emptyText: {
    color: '#607080',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eaf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#2f6d1a',
    fontWeight: '800',
  },
  partnerText: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2a36',
  },
  partnerPhone: {
    fontSize: 13,
    color: '#5a6b7a',
    marginTop: 2,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#f1f8ec',
    padding: 8,
    borderRadius: 10,
  },
  deleteBtn: {
    backgroundColor: '#fdecec',
    padding: 8,
    borderRadius: 10,
  },
})
