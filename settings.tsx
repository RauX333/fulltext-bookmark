import rabbitImg from "data-base64:~assets/icon512.png"
import { useDispatch, useSelector } from "react-redux"
import Toggle from "react-toggle"

import "./style.css"

import {
  AppStat,
  toggleBookmarkAdaption,
  toggleRemoteStore,
  toggleSearchEngineAdaption,
  toggleStoreEveryPage,
  toggleShowOnlyBookmarkedResults,
  toggleDontRemoteStoreEveryPage,
  setRemoteStoreURL,
  setRemoteStoreKey,
  setTempPageExpireTime
} from "~stat-slice"

export const SettingView = () => {
  const dispatch = useDispatch()
  const searchEngineAdaption = useSelector(
    (state: AppStat) => state.searchEngineAdaption
  )
  const bookmarkAdaption = useSelector((state: AppStat) => state.bookmarkAdaption)
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
  //   const storeEveryPage = useSelector((state: AppStat) => state.storeEveryPage)
  //   const remoteStore = useSelector((state: AppStat) => state.remoteStore)
  //     const bookmarkAdaption = useSelector((state: AppStat) => state.bookmarkAdaption)

  return (
    <div className="w-96 p-4 flex flex-col gap-4 h-96">
      <h2>
        <img
          src={rabbitImg}
          alt="rabbit icon"
          className="h-4 w-4 inline mr-2"
        />
        Fulltext Bookmarks
        <img
          src={rabbitImg}
          alt="rabbit icon"
          className="h-4 w-4 inline ml-2"
        />
      </h2>
      
      <span className="text-sm">Show Result In Search Engine Page</span>
      <Toggle
        defaultChecked={searchEngineAdaption}
        onChange={() => dispatch(toggleSearchEngineAdaption())}
      />

<span className="text-sm">Show Only Bookmarked Results</span>
      <Toggle
        defaultChecked={showOnlyBookmarkedResults}
        onChange={() => dispatch(toggleShowOnlyBookmarkedResults())}
      />

<span className="text-sm">Store Every Page You Visited</span>
      <Toggle
        defaultChecked={storeEveryPage}
        onChange={() => dispatch(toggleStoreEveryPage())}
      />

<span className="text-sm">Listen To Bookmark Action</span>
      <Toggle
        defaultChecked={bookmarkAdaption}
        onChange={() => dispatch(toggleBookmarkAdaption())}
      />

<span className="text-sm">Send To Remote API</span>
      <Toggle
        defaultChecked={remoteStore}
        onChange={() => dispatch(toggleRemoteStore())}
      />
      
      
      
    </div>
  )
}
