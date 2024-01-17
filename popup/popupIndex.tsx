import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import type { AppStat } from "~/store/stat-slice";

import GPTSearch from "~popup/GPTSearch"
import { SearchView } from "~popup/search"





import "react-tabs/style/react-tabs.css"

import "~/style.css"
import { useDispatch, useSelector } from "react-redux"
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
function Popup() {
    const dispatch= useDispatch()
    const showAskGPT = useSelector((state: AppStat) => state.showAskGPT);
    // const firstTimeStart = useSelector((state: AppStat) => state.firstOpenPopup);
    // console.log("first",typeof(firstTimeStart));
    
    // if(firstTimeStart==0 ) {
    //   dispatch(setFirstOpenPopup())
    //   chrome.runtime
    //     .sendMessage({ command: "firsttime" })
    //     .then((v) => {
    //     //   console.log("bb");
          
    //     })
    // }
  return (
    <Tabs className="pt-2 pl-2 pr-2" onSelect={handleSelectTab}>
    <TabList>
      <Tab>{chrome.i18n.getMessage("popupSearchTab")}</Tab>
      {showAskGPT && <Tab>{chrome.i18n.getMessage("popupGPTTab")}</Tab>}
      <Tab>
        <a
          className="text-right text-blue-500"
          href=""
          onClick={onHandleJumpToOptionsPage}
        >
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
    <TabPanel>
      <></>
    </TabPanel>
  </Tabs>
  )
}

// chrome.runtime.openOptionsPage(() => {
//   console.log("openOptionsPage")
// })

export default Popup
