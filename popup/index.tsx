import { PersistGate } from "@plasmohq/redux-persist/integration/react"
import { Provider } from "react-redux"
import { SearchView } from "~popup/search"
import { persistor, store } from "~store/store"

// import "./style.css"

function IndexPopup() {
  return (
       <SearchView></SearchView>
  )
}

// chrome.runtime.openOptionsPage(() => {
//   console.log("openOptionsPage")
// })

export default IndexPopup
