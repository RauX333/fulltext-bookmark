import { PersistGate } from "@plasmohq/redux-persist/integration/react"
import { Provider } from "react-redux"
import { SettingView } from "~settings"
import { persistor, store } from "~store"

// import "./style.css"

function IndexPopup() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
       <SettingView></SettingView>
      </PersistGate>
    </Provider>
  )
}

// chrome.runtime.openOptionsPage(() => {
//   console.log("openOptionsPage")
// })

export default IndexPopup
