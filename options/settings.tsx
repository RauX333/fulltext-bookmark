import rabbitImg from "data-base64:~assets/icon512.png"
import { useDispatch, useSelector } from "react-redux"
import Toggle from "react-toggle"

import { NavButton } from "~components/NavButton"
import { SettingBlock } from "~components/SettingBlock"
import { SettingItem } from "~components/SettingItem"
import { SettingItemCol } from "~components/SettingItemCol"

import "~style.css"

import { useState } from "react"

import {
  AppStat,
  setForbiddenURLs,
  setRemoteStoreKey,
  setRemoteStoreURL,
  setTempPageExpireTime,
  toggleBookmarkAdaption,
  toggleRemoteStore,
  toggleRemoteStoreEveryPage,
  toggleSearchEngineAdaption,
  toggleShowOnlyBookmarkedResults,
  toggleStoreEveryPage
} from "~store/stat-slice"

export const SettingView = () => {
  // redux states
  const dispatch = useDispatch()
  const searchEngineAdaption = useSelector(
    (state: AppStat) => state.searchEngineAdaption
  )
  const bookmarkAdaption = useSelector(
    (state: AppStat) => state.bookmarkAdaption
  )
  const storeEveryPage = useSelector((state: AppStat) => state.storeEveryPage)
  const showOnlyBookmarkedResults = useSelector(
    (state: AppStat) => state.showOnlyBookmarkedResults
  )
  const remoteStore = useSelector((state: AppStat) => state.remoteStore)
  const remoteStoreURL = useSelector((state: AppStat) => state.remoteStoreURL)
  const remoteStoreKey = useSelector((state: AppStat) => state.remoteStoreKey)
  const tempPageExpireTime = useSelector(
    (state: AppStat) => state.tempPageExpireTime
  )
  const remoteStoreEveryPage = useSelector(
    (state: AppStat) => state.remoteStoreEveryPage
  )
  const forbiddenURLs = useSelector((state: AppStat) => state.forbiddenURLs)

  // nav page states
  const [navPage, setNavPage] = useState(0)
  const handleNavChange = (pageNum: number) => {
    console.log(pageNum)

    setNavPage(pageNum)
  }

  // page expire time stats
  const [temptempPageExpireTime, setPageExpireTime] = useState(
    tempPageExpireTime / 1000 / 60 / 60 / 24
  )
  const handlePageExpireTimeChange = (e) => {
    console.log(e.target.value)
    if (e.target.value === "") {
      // @ts-ignore
      setPageExpireTime("")
      return
    }
    const a = parseInt(e.target.value)
    // if(!a || a < 0) {
    //   setPageExpireTime(60)
    //   return
    // }
    setPageExpireTime(a)
  }
  const handlePageExpireTimeSubmit = () => {
    if (
      !temptempPageExpireTime ||
      typeof temptempPageExpireTime !== "number" ||
      temptempPageExpireTime < 0 ||
      temptempPageExpireTime > 365 * 100
    ) {
      setPageExpireTime(60)
      dispatch(setTempPageExpireTime(60 * 1000 * 60 * 60 * 24))
      return
    }
    dispatch(
      setTempPageExpireTime(temptempPageExpireTime * 1000 * 60 * 60 * 24)
    )
  }

  // forbidden urls stats
  const [tempforbiddenURLs, changeforbiddenURLs] = useState(
    forbiddenURLs.join("\n")
  )
  const handleForbiddenURLsChange = (e) => {
    changeforbiddenURLs(e.target.value)
    // console.log(tempforbiddenURLs.split("\n"))
  }
  const handleBlurForbbiddenURLs = (e) => {
    dispatch(setForbiddenURLs(tempforbiddenURLs.split("\n")))
  }

  // remote store stats
  const [tempRemoteStoreURL, changeRemoteStoreURL] = useState(remoteStoreURL)
  const handleRemoteStoreURLChange = (e) => {
    changeRemoteStoreURL(e.target.value)
  }
  const handleBlurRemoteStoreURL = (e) => {
    dispatch(setRemoteStoreURL(tempRemoteStoreURL))
  }

  return (
    <div className="max-w-8xl mx-auto p-4 sm:px-6 md:px-8">
      <div className="lg:block fixed z-20 inset-0   right-auto w-[19.5rem] py-10 px-6 overflow-y-auto">
        <div className=" lg:leading-6 relative  ">
          <h1 className="lg:text-2xl font-bold pl-4">Fulltext Bookmarks</h1>
          <div className="text-lg font-normal flex flex-col gap-8 mt-10">
            <NavButton
              title={"Settings"}
              onClick={() => {
                handleNavChange(0)
              }}></NavButton>
            <NavButton
              title={"Remote API"}
              onClick={() => {
                handleNavChange(1)
              }}></NavButton>
            <NavButton
              title={"About"}
              onClick={() => {
                handleNavChange(2)
              }}></NavButton>
            <NavButton
              title={"Donate ❤️"}
              onClick={() => {
                handleNavChange(3)
              }}></NavButton>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4 lg:pl-[19.5rem] pt-10">
        {navPage === 0 && (
          <>
            <SettingBlock title={"Display"}>
              <SettingItem
                description={"Show Result In Search Engine Page"}
                notes={"support google/bing/baidu"}>
                <Toggle
                  defaultChecked={searchEngineAdaption}
                  onChange={() => dispatch(toggleSearchEngineAdaption())}
                />
              </SettingItem>
            </SettingBlock>

            <SettingBlock title={"Search"}>
              <SettingItem
                description={"Show Only Bookmarked Pages In Search Results"}>
                <Toggle
                  defaultChecked={showOnlyBookmarkedResults}
                  onChange={() => dispatch(toggleShowOnlyBookmarkedResults())}
                />
              </SettingItem>
            </SettingBlock>

            <SettingBlock title={"Index"}>
              <SettingItem
                description={"Index Every Page You Visited"}
                notes={
                  "only applies to pages after you install this extension"
                }>
                <Toggle
                  defaultChecked={storeEveryPage}
                  onChange={() => dispatch(toggleStoreEveryPage())}
                />
              </SettingItem>
              <SettingItem
                description={"Index Bookmarked Page"}
                notes={
                  "only applies to bookmarks after you install this extension"
                }>
                <Toggle
                  defaultChecked={bookmarkAdaption}
                  onChange={() => dispatch(toggleBookmarkAdaption())}
                />
              </SettingItem>
              <p></p>
              <SettingItemCol
                description={"Store Duration of Non-Bookmarked Page "}
                notes={`non-bookmarked page reocords will be outdated after this time, while bookmarked page will be stored forever.\ndefaults to 60 days, maxium 36500 days`}>
                <input
                  type="text"
                  className="w-32 h-6"
                  value={temptempPageExpireTime}
                  onChange={handlePageExpireTimeChange}
                  onBlur={handlePageExpireTimeSubmit}
                />{" "}
                Days
              </SettingItemCol>
              <p></p>
              <SettingItemCol
                description={"Exclude URLs"}
                notes={
                  "urls in this list will not be indexed ( one address per line)"
                }>
                <p>
                  <a
                    href="https://developer.chrome.com/extensions/proxy#bypass_list"
                    className="text-blue-300 mb-2">
                    {"matching pattern rules reference"}
                  </a>
                </p>
                <textarea
                  className="w-96"
                  onChange={(e) => {
                    handleForbiddenURLsChange(e)
                  }}
                  onBlur={(e) => {
                    handleBlurForbbiddenURLs(e)
                  }}
                  value={tempforbiddenURLs}
                  rows={tempforbiddenURLs.split("\n").length || 4}
                />
              </SettingItemCol>
            </SettingBlock>
          </>
        )}

        {navPage === 1 && (
          <>
            <SettingBlock title={"Remote API"}>
              <SettingItem description={"Send To Remote API"}>
                <Toggle
                  defaultChecked={remoteStore}
                  onChange={() => dispatch(toggleRemoteStore())}
                />
              </SettingItem>
              <SettingItem
                description={"Send Every Stroed Page To Remote API"}
                notes={
                  "dafault disabled, and send only bookmarked pages to remote api"
                }>
                <Toggle
                  defaultChecked={remoteStoreEveryPage}
                  onChange={() => dispatch(toggleRemoteStoreEveryPage())}
                />
              </SettingItem>
              <SettingItemCol description={"Remote API Address"}>
                <textarea
                  className="w-96 border-solid border-[1px] border-gray-300 focus:border-gray-600 focus:outline-none"
                  value={remoteStoreURL}
                  onChange={(e) => {
                    handleRemoteStoreURLChange(e)
                  }}
                  onBlur={(e) => {
                    handleBlurRemoteStoreURL(e)
                  }}
                />
              </SettingItemCol>
            </SettingBlock>
          </>
        )}

        {navPage === 2 && (
          <>
            <SettingBlock title={"Features"}>
              <p>
                💾&nbsp;&nbsp;store and index the bookmarked page for later
                fulltext search,
              </p>
              <p>
                🔍&nbsp;&nbsp;actually it can index any page you visit, so you
                can use it as a better broswing history search tool.
              </p>
              <p>
                📎&nbsp;&nbsp;best matched search result will be dispalyed in
                the search engine page as you search (google/bing/baidu),
              </p>
              <p>
                📜&nbsp;&nbsp;or in the extension popup page for more results.
              </p>
              <p>
                😺&nbsp;&nbsp;all data stored in local storage, no privacy
                issues.
              </p>
              <p>
                ✉️&nbsp;&nbsp;send your bookmark/browsing history to custom
                remote api as you like.
              </p>
            </SettingBlock>
            <SettingBlock title={"About"}>
              <p>
                Developed by:{" "}
                <a className="text-blue-300" href="https://github.com/RauX333">
                  RauX333
                </a>
              </p>

              <p>
                Email:{" "}
                <a href="xenoncancer@gmail.com" className="text-blue-300">
                  xenoncancer@gmail.com
                </a>
              </p>

              <p>
                if you have any issues or suggestions, please feel free to
                connect me.
              </p>
            </SettingBlock>
          </>
        )}
        {navPage === 3 && (
          <>
            <SettingBlock title={"Buy Me A Cupcake 🧁"}>
              <p>
                PayPal:{" "}
                <a className="text-blue-300" href="paypal.me/dongxiajun">
                  paypal.me/dongxiajun
                </a>
              </p>
            </SettingBlock>

            <SettingBlock title={"About"}>
              <p>
                Developed by:{" "}
                <a className="text-blue-300" href="https://github.com/RauX333">
                  RauX333
                </a>
              </p>

              <p>
                Email:{" "}
                <a href="xenoncancer@gmail.com" className="text-blue-300">
                  xenoncancer@gmail.com
                </a>
              </p>

              <p>
                if you have any issues or suggestions, please feel free to
                connect me.
              </p>
            </SettingBlock>
          </>
        )}
      </div>
    </div>
  )
}
