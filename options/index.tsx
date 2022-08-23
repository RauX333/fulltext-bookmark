import { PersistGate } from "@plasmohq/redux-persist/integration/react"
import { Provider } from "react-redux"

import { SettingView } from "~settings"
import { persistor, store } from "~store"


function OptionsIndex() {

  return (
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <SettingView />
    </PersistGate>
  </Provider>
  )
}

export default OptionsIndex