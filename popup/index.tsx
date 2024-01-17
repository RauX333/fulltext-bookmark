import { Provider } from "react-redux"

import { PersistGate } from "@plasmohq/redux-persist/integration/react"

import { persistor, store } from "~store/store"
import Popup from "./popupIndex"

// import "react-tabs/style/react-tabs.css"

import "~/style.css"
function IndexPopup() {
  
  return (
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
    <Popup></Popup>
    </PersistGate>
  </Provider>
  )
}

export default IndexPopup
