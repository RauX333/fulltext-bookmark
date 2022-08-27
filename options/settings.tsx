import rabbitImg from "data-base64:~assets/icon512.png"
import { useDispatch, useSelector } from "react-redux"
import Toggle from "react-toggle"

import { byteConvert } from "~/lib/util"
import { NavButton } from "~components/NavButton"
import { SettingBlock } from "~components/SettingBlock"
import { SettingItem } from "~components/SettingItem"
import { SettingItemCol } from "~components/SettingItemCol"

import "~style.css"

import { useState } from "react"

import {
  AppStat,
  setForbiddenURLs,
  setMaxResults,
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
  const maxResults = useSelector((state: AppStat) => state.maxResults)

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
  // max searc result stats
  const [tempMaxResults, setMaxResultsChange] = useState(maxResults)
  const handleMaxResultsChange = (e) => {
    console.log(e.target.value)
    if (e.target.value === "") {
      // @ts-ignore
      setMaxResultsChange("")
      return
    }
    const a = parseInt(e.target.value)
    setMaxResultsChange(a)
  }
  const handleMaxResultsSubmit = () => {
    if (
      !tempMaxResults ||
      typeof tempMaxResults !== "number" ||
      tempMaxResults < 0 ||
      tempMaxResults > 100
    ) {
      setMaxResultsChange(20)
      dispatch(setMaxResults(20))
      return
    }
    dispatch(setMaxResults(tempMaxResults))
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

  // store
  const [storeSize, setStoreSize] = useState({
    quota: "0",
    usage: "0"
  })
  async function showEstimatedQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimation = await navigator.storage.estimate()
      return {
        quota: byteConvert(estimation.quota),
        usage: byteConvert(estimation.usage)
      }
    } else {
      console.error("StorageManager not found")
    }
  }

  return (
    <div className="max-w-8xl mx-auto p-4 sm:px-6 md:px-8">
      <div className="lg:block fixed z-20 inset-0   right-auto w-[19.5rem] py-10 px-6 overflow-y-auto">
        <div className=" lg:leading-6 relative  ">
          <h1 className="lg:text-2xl font-bold pl-4">
            {chrome.i18n.getMessage("extensionName")}
          </h1>
          <div className="text-lg font-normal flex flex-col gap-8 mt-10">
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavSettings")}
              onClick={() => {
                handleNavChange(0)
              }}></NavButton>
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavRemoteAPI")}
              onClick={() => {
                handleNavChange(1)
              }}></NavButton>
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavAbout")}
              onClick={() => {
                handleNavChange(2)
              }}></NavButton>
            <NavButton
              title={chrome.i18n.getMessage("settingPageNavDonate")}
              onClick={() => {
                handleNavChange(3)
              }}></NavButton>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-8 lg:pl-[19.5rem] pt-10">
        {navPage === 0 && (
          <>
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageSettingDisplay")}>
              <SettingItem
                description={chrome.i18n.getMessage(
                  "settingPageSettingSearchPageDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingSearchPageNote"
                )}>
                <Toggle
                  defaultChecked={searchEngineAdaption}
                  onChange={() => dispatch(toggleSearchEngineAdaption())}
                />
              </SettingItem>
            </SettingBlock>

            <SettingBlock
              title={chrome.i18n.getMessage("settingPageSettingSearch")}>
              <SettingItem
                description={chrome.i18n.getMessage(
                  "settingPageSettingSearchShowBookDesp"
                )}>
                <Toggle
                  defaultChecked={showOnlyBookmarkedResults}
                  onChange={() => dispatch(toggleShowOnlyBookmarkedResults())}
                />
              </SettingItem>
              <p></p>
              <SettingItemCol
                description={chrome.i18n.getMessage(
                  "settingPageSettingSearchMaxDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingSearchMaxNote"
                )}>
                <input
                  type="text"
                  className="w-32 h-6"
                  value={tempMaxResults}
                  onChange={handleMaxResultsChange}
                  onBlur={handleMaxResultsSubmit}
                />{" "}
              </SettingItemCol>
            </SettingBlock>

            <SettingBlock
              title={chrome.i18n.getMessage("settingPageSettingIndex")}>
              <SettingItemCol
                description={chrome.i18n.getMessage(
                  "settingPageSettingIndexSizeDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingIndexSizeNote"
                )}>
                <button
                  className="text-blue-500 mr-8"
                  onClick={async () => {
                    const a = await showEstimatedQuota()
                    setStoreSize(a)
                  }}>
                  {chrome.i18n.getMessage("settingPageSettingIndexSizeButton")}
                </button>
                <span>{storeSize.usage}</span>
                {/* // TODO:清除所有数据 */}
              </SettingItemCol>
              <p></p>
              <SettingItem
                description={chrome.i18n.getMessage(
                  "settingPageSettingIndexEveryDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingIndexEveryNote"
                )}>
                <Toggle
                  defaultChecked={storeEveryPage}
                  onChange={() => dispatch(toggleStoreEveryPage())}
                />
              </SettingItem>
              <SettingItem
                description={chrome.i18n.getMessage(
                  "settingPageSettingIndexBookDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingIndexBookNote"
                )}>
                <Toggle
                  defaultChecked={bookmarkAdaption}
                  onChange={() => dispatch(toggleBookmarkAdaption())}
                />
              </SettingItem>
              <p></p>
              <SettingItemCol
                description={chrome.i18n.getMessage(
                  "settingPageSettingIndexDurDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingIndexDurNote"
                )}>
                <input
                  type="text"
                  className="w-32 h-6"
                  value={temptempPageExpireTime}
                  onChange={handlePageExpireTimeChange}
                  onBlur={handlePageExpireTimeSubmit}
                />{" "}
                {chrome.i18n.getMessage("days")}
              </SettingItemCol>
              <p></p>
              <SettingItemCol
                description={chrome.i18n.getMessage(
                  "settingPageSettingIndexExclDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageSettingIndexExclNote"
                )}>
                {/* <p>
                  <a
                    href="https://developer.chrome.com/extensions/proxy#bypass_list"
                    className="text-blue-300 mb-2">
                    {"matching pattern rules reference"}
                  </a>
                </p> */}
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
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageRemoteTitle")}>
              <SettingItem
                description={chrome.i18n.getMessage(
                  "settingPageRemoteSendDesp"
                )}
                notes={chrome.i18n.getMessage("settingPageRemoteSendnote")}>
                <Toggle
                  defaultChecked={remoteStore}
                  onChange={() => dispatch(toggleRemoteStore())}
                />
              </SettingItem>
              <SettingItem
                description={chrome.i18n.getMessage(
                  "settingPageRemoteSendEveryDesp"
                )}
                notes={chrome.i18n.getMessage(
                  "settingPageRemoteSendEveryNote"
                )}>
                <Toggle
                  defaultChecked={remoteStoreEveryPage}
                  onChange={() => dispatch(toggleRemoteStoreEveryPage())}
                />
              </SettingItem>
              <SettingItemCol
                description={chrome.i18n.getMessage(
                  "settingPageRemoteAPIDesp"
                )}>
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
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageFeatureTitle")}>
              <p>
                🔍&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureA")}
              </p>
              <p>
                💾&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureB")}
              </p>

              <p>
                🥇&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureC")}
              </p>
              <p>
                📎&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureD")}
              </p>
              <p>
                📜&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureE")}
              </p>
              <p>
                😺&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureF")}
              </p>
              <p>
                ✉️&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureG")}
              </p>
              <p>
                ⌨️&nbsp;&nbsp;{chrome.i18n.getMessage("settingPageFeatureH")}
              </p>
            </SettingBlock>
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageAboutTitle")}>
              <p>
                Developed by:{" "}
                <a className="text-blue-300" href="https://github.com/RauX333">
                  RauX333
                </a>{" "} &nbsp;with ❤️
              </p>

              <p>
                Email:{" "}
                <a href="xenoncancer@gmail.com" className="text-blue-300">
                  xenoncancer@gmail.com
                </a>
              </p>

              <p>{chrome.i18n.getMessage("settingPageAboutThanks")}</p>
            </SettingBlock>
          </>
        )}
        {navPage === 3 && (
          <>
            <SettingBlock
              title={chrome.i18n.getMessage("settingPageDonateTitle")}>
              <p>
                PayPal:{" "}
                <a className="text-blue-300" href="paypal.me/dongxiajun">
                  paypal.me/dongxiajun
                </a>
              </p>
            </SettingBlock>

            <SettingBlock title={chrome.i18n.getMessage("settingPageAboutTitle")}>
              <p>
                Developed by:{" "}
                <a className="text-blue-300" href="https://github.com/RauX333">
                  RauX333
                </a>
                 &nbsp;with ❤️
              </p>

              <p>
                Email:{" "}
                <a href="xenoncancer@gmail.com" className="text-blue-300">
                  xenoncancer@gmail.com
                </a>
              </p>

              <p>{chrome.i18n.getMessage("settingPageAboutThanks")}</p>
            </SettingBlock>
          </>
        )}
      </div>
    </div>
  )
}
