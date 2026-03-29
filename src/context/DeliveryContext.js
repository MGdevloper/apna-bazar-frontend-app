import { createContext } from "react";

const DeliveryContext = createContext({
  deliverypartners: [],
  addDeliverypartner: () => {},
  removeDeliverypartner: () => {},
  editDeliverypartner: () => {},
  setDeliverypartners:()=>{}
});

export default DeliveryContext;

