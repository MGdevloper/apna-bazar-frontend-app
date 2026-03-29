import { createContext } from 'react'

const RegisterContext = createContext({
  registerData: {
    role: 'customer',
    fullname: '',
    password: '',
    email: '',
  },
  setRegisterData: () => {},
  customerData: {
    phone: '',
    house: '',
    area: '',
    city: '',
    pincode: '',
    landmark: '',
    state: '',
    password:'',
    latLong: { lat: '', long: '' },
  },
  setCustomerData: () => {},
  shopkeeperData: {
    shopName: '',
    categorie: null,
    phone: '',
    state: '',
    city: '',
    pincode: '',
    area: '',
    address: '',
    latLong: { lat: '', long: '' },
  },
  setShopkeeperData: () => {},
})

export default RegisterContext
