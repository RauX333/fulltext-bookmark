import rabbitImg from "data-base64:~assets/icon512.png"
import { useDispatch, useSelector } from "react-redux"
import Toggle from "react-toggle"

import "./style.css"

import {
  AppStat,
  toggleBookmarkAdaption,
  toggleRemoteStore,
  toggleSearchEngineAdaption,
  toggleStoreEveryPage
} from "~stat-slice"

export const SettingView = () => {
  const dispatch = useDispatch()
  const searchEngine = useSelector(
    (state: AppStat) => state.searchEngineAdaption
  )
  //   const storeEveryPage = useSelector((state: AppStat) => state.storeEveryPage)
  //   const remoteStore = useSelector((state: AppStat) => state.remoteStore)
  //     const bookmarkAdaption = useSelector((state: AppStat) => state.bookmarkAdaption)

  return (
    <div className="w-96 p-4 flex flex-col gap-8 h-96">
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
      {searchEngine && 
        <span>
            true
        </span>
      }
      
      <span className="text-sm">Show Result In Search Engine Page</span>
      <Toggle
        defaultChecked={searchEngine}
       
        onChange={() => dispatch(toggleSearchEngineAdaption())}
      />
      
      
      
    </div>
  )
}
