import { Provider } from "react-redux"

import { PersistGate } from "@plasmohq/redux-persist/integration/react"

import { SettingView } from "~options/settings"
import { persistor, store } from "~store/store"

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
