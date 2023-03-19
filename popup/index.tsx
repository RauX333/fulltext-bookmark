import { Provider } from "react-redux"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"

import { PersistGate } from "@plasmohq/redux-persist/integration/react"

import GPTSearch from "~popup/GPTSearch"
import { SearchView } from "~popup/search"
import { persistor, store } from "~store/store"

import "react-tabs/style/react-tabs.css"

// import "./style.css"
const onHandleJumpToOptionsPage = () => {
  chrome.runtime.openOptionsPage(() => {
    // console.log("open options page")
  })
}
const handleSelectTab = (index: number, lastIndex: number, event: Event) => {
  if (index === 2) {
    return false
  }
  return true
}
function IndexPopup() {
  return (
    <Tabs className="pt-2 pl-2 pr-2" onSelect={handleSelectTab}>
      <TabList>
        <Tab>{chrome.i18n.getMessage("popupSearchTab")}</Tab>
        <Tab>{chrome.i18n.getMessage("popupGPTTab")}</Tab>
        <Tab>
          <a
            className="text-right text-blue-500"
            href=""
            onClick={onHandleJumpToOptionsPage}>
            {chrome.i18n.getMessage("settingPageNavSettings")}
          </a>
        </Tab>
      </TabList>

      <TabPanel>
        <SearchView></SearchView>
      </TabPanel>
      <TabPanel>
        <GPTSearch></GPTSearch>
      </TabPanel>
    </Tabs>
  )
}

// chrome.runtime.openOptionsPage(() => {
//   console.log("openOptionsPage")
// })

export default IndexPopup
