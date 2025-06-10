import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Feature } from "./Feature"
import { Donate } from "./Donate"
import { SettingsSidebar } from "./components/SettingsSidebar"
import { GeneralSettings } from "./components/GeneralSettings"
import { StorageSettings } from "./components/StorageSettings"
import { DataManagement } from "./components/DataManagement"
import { RemoteAPISettings } from "./components/RemoteAPISettings"
import { GPTSettings } from "./components/GPTSettings"
import { useSettingsState } from "./hooks/useSettingsState"
import { showEstimatedQuota } from "./utils/storageUtils"

/**
 * Main settings view component
 */
export const SettingView = () => {
  const dispatch = useDispatch()
  const {
    searchEngineAdaption,
    weiboSupport,
    showOnlyBookmarkedResults,
    maxResults,
    storeEveryPage,
    bookmarkAdaption,
    pageExpireTimeInDays,
    forbiddenURLs,
    remoteStore,
    remoteStoreURL,
    remoteStoreEveryPage,
    showAskGPT,
    GPTKey,
    GPTUrl,
    tempMaxResults,
    tempPageExpireTimeInDays,
    tempForbiddenURLs,
    tempRemoteStoreURL,
    tempGPTKey,
    tempGPTUrl,
    navPage,
    handleMaxResultsChange,
    handleMaxResultsSubmit,
    handlePageExpireTimeChange,
    handlePageExpireTimeSubmit,
    handleForbiddenURLsChange,
    handleBlurForbiddenURLs,
    handleRemoteStoreURLChange,
    handleBlurRemoteStoreURL,
    handleGPTKeyChange,
    handleGPTUrlChange,
    handleBlurGPTKey,
    handleBlurGPTUrl,
    setNavPage,
    toggleSearchEngineAdaption,
    toggleWeiboSupport,
    toggleShowOnlyBookmarkedResults,
    toggleStoreEveryPage,
    toggleBookmarkAdaption,
    toggleShowAskGPT,
    toggleRemoteStore,
    toggleRemoteStoreEveryPage
  } = useSettingsState()

  const [storeSize, setStoreSize] = useState({ quota: "0", usage: "0" })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const fetchStoreSize = async () => {
      const size = await showEstimatedQuota()
      setStoreSize(size)
    }
    fetchStoreSize()
  }, [])

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle sidebar collapse state changes from the sidebar component
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
  }

  return (
    <div className="flex">
      <SettingsSidebar 
        navPage={navPage} 
        onNavChange={setNavPage} 
        onCollapse={handleSidebarCollapse}
      />

      <div className={`transition-all duration-300 ease-in-out max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 ${sidebarCollapsed ? 'lg:pl-8' : 'lg:pl-[16rem]'}`}>
        {navPage === 0 && (
          <>
            <GeneralSettings
              searchEngineAdaption={searchEngineAdaption}
              weiboSupport={weiboSupport}
              showOnlyBookmarkedResults={showOnlyBookmarkedResults}
              tempMaxResults={tempMaxResults}
              handleMaxResultsChange={handleMaxResultsChange}
              handleMaxResultsSubmit={handleMaxResultsSubmit}
              dispatch={dispatch}
              toggleSearchEngineAdaption={toggleSearchEngineAdaption}
              toggleWeiboSupport={toggleWeiboSupport}
              toggleShowOnlyBookmarkedResults={toggleShowOnlyBookmarkedResults}
            />

            <StorageSettings
              storeEveryPage={storeEveryPage}
              bookmarkAdaption={bookmarkAdaption}
              tempPageExpireTimeInDays={tempPageExpireTimeInDays}
              tempForbiddenURLs={tempForbiddenURLs}
              storeSize={storeSize}
              setStoreSize={setStoreSize}
              handlePageExpireTimeChange={handlePageExpireTimeChange}
              handlePageExpireTimeSubmit={handlePageExpireTimeSubmit}
              handleForbiddenURLsChange={handleForbiddenURLsChange}
              handleBlurForbiddenURLs={handleBlurForbiddenURLs}
              dispatch={dispatch}
              toggleStoreEveryPage={toggleStoreEveryPage}
              toggleBookmarkAdaption={toggleBookmarkAdaption}
            />
          </>
        )}

        {navPage === 1 && (
          <RemoteAPISettings
            remoteStore={remoteStore}
            remoteStoreEveryPage={remoteStoreEveryPage}
            remoteStoreURL={remoteStoreURL}
            tempRemoteStoreURL={tempRemoteStoreURL}
            handleRemoteStoreURLChange={handleRemoteStoreURLChange}
            handleBlurRemoteStoreURL={handleBlurRemoteStoreURL}
            dispatch={dispatch}
            toggleRemoteStore={toggleRemoteStore}
            toggleRemoteStoreEveryPage={toggleRemoteStoreEveryPage}
          />
        )}

        {navPage === 2 && (
          <GPTSettings
            showAskGPT={showAskGPT}
            GPTKey={GPTKey}
            GPTUrl={GPTUrl}
            tempGPTKey={tempGPTKey}
            tempGPTUrl={tempGPTUrl}
            handleGPTKeyChange={handleGPTKeyChange}
            handleGPTUrlChange={handleGPTUrlChange}
            handleBlurGPTKey={handleBlurGPTKey}
            handleBlurGPTUrl={handleBlurGPTUrl}
            dispatch={dispatch}
            toggleShowAskGPT={toggleShowAskGPT}
          />
        )}

        {navPage === 3 && <Feature />}

        {navPage === 4 && <Donate />}

        {navPage === 5 && <DataManagement setStoreSize={setStoreSize} />}
      </div>
    </div>
  )
}
