import { createContext } from "react";

const CustomerCartContext = createContext({

    cartItem:[],
    addToCart: () => {},
    removeFromCart: () => {},
    clearCart: () => {},
    updateCartItem: () => {},
})

export default CustomerCartContext