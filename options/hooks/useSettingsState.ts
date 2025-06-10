import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  AppStat,
  setForbiddenURLs,
  setGPTKey,
  setGPTURL,
  setMaxResults,
  setRemoteStoreKey,
  setRemoteStoreURL,
  setTempPageExpireTime,
  toggleBookmarkAdaption,
  toggleRemoteStore,
  toggleRemoteStoreEveryPage,
  toggleSearchEngineAdaption,
  toggleShowAskGPT,
  toggleShowOnlyBookmarkedResults,
  toggleStoreEveryPage,
  toggleWeiboSupport
} from '~store/stat-slice'

/**
 * Custom hook for managing settings state
 * Centralizes all settings-related state and handlers
 */
export const useSettingsState = () => {
  const dispatch = useDispatch()
  
  // Redux state selectors
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
  const weiboSupport = useSelector((state: AppStat) => state.weiboSupport)
  const GPTKey = useSelector((state: AppStat) => state.GPTKey)
  const GPTURL = useSelector((state: AppStat) => state.GPTURL)
  const showAskGPT = useSelector((state: AppStat) => state.showAskGPT)

  // Navigation state
  const [navPage, setNavPage] = useState(0)
  const handleNavChange = (pageNum: number) => {
    setNavPage(pageNum)
  }

  // GPT settings states
  const [isTestLoading, setIsTestLoading] = useState(false)
  const [GPTTestResult, setGPTTestResult] = useState("")
  
  const [tempGPTURL, setTempGPTURL] = useState(GPTURL)
  const handleGPTURLChange = (e) => {
    setTempGPTURL(e.target.value)
  }
  const handleBlurGPTURL = () => {
    dispatch(setGPTURL(tempGPTURL))
  }

  const [tempGPTKey, setTempGPTKey] = useState(GPTKey)
  const handleGPTKeyChange = (e) => {
    setTempGPTKey(e.target.value)
  }
  const handleBlurGPTKey = () => {
    dispatch(setGPTKey(tempGPTKey))
  }

  // Page expire time state
  const [tempPageExpireTimeInDays, setTempPageExpireTimeInDays] = useState(
    tempPageExpireTime / 1000 / 60 / 60 / 24
  )
  const handlePageExpireTimeChange = (e) => {
    if (e.target.value === "") {
      // @ts-ignore
      setTempPageExpireTimeInDays("")
      return
    }
    const value = parseInt(e.target.value)
    setTempPageExpireTimeInDays(value)
  }
  const handlePageExpireTimeSubmit = () => {
    if (
      !tempPageExpireTimeInDays ||
      typeof tempPageExpireTimeInDays !== "number" ||
      tempPageExpireTimeInDays < 0 ||
      tempPageExpireTimeInDays > 365 * 100
    ) {
      setTempPageExpireTimeInDays(60)
      dispatch(setTempPageExpireTime(60 * 1000 * 60 * 60 * 24))
      return
    }
    dispatch(
      setTempPageExpireTime(tempPageExpireTimeInDays * 1000 * 60 * 60 * 24)
    )
  }

  // Max search results state
  const [tempMaxResults, setTempMaxResults] = useState(maxResults)
  const handleMaxResultsChange = (e) => {
    if (e.target.value === "") {
      // @ts-ignore
      setTempMaxResults("")
      return
    }
    const value = parseInt(e.target.value)
    setTempMaxResults(value)
  }
  const handleMaxResultsSubmit = () => {
    if (
      !tempMaxResults ||
      typeof tempMaxResults !== "number" ||
      tempMaxResults < 0 ||
      tempMaxResults > 100
    ) {
      setTempMaxResults(20)
      dispatch(setMaxResults(20))
      return
    }
    dispatch(setMaxResults(tempMaxResults))
  }

  // Forbidden URLs state
  const [tempForbiddenURLs, setTempForbiddenURLs] = useState(
    forbiddenURLs.join("\n")
  )
  const handleForbiddenURLsChange = (e) => {
    setTempForbiddenURLs(e.target.value)
  }
  const handleBlurForbiddenURLs = () => {
    dispatch(setForbiddenURLs(tempForbiddenURLs.split("\n").filter((x) => x)))
  }

  // Remote store URL state
  const [tempRemoteStoreURL, setTempRemoteStoreURL] = useState(remoteStoreURL)
  const handleRemoteStoreURLChange = (e) => {
    setTempRemoteStoreURL(e.target.value)
  }
  const handleBlurRemoteStoreURL = () => {
    dispatch(setRemoteStoreURL(tempRemoteStoreURL))
  }

  // Store size state
  const [storeSize, setStoreSize] = useState({
    quota: "0",
    usage: "0"
  })

  return {
    // Redux states
    searchEngineAdaption,
    weiboSupport,
    showOnlyBookmarkedResults,
    maxResults,
    storeEveryPage,
    bookmarkAdaption,
    pageExpireTimeInDays: tempPageExpireTime,
    forbiddenURLs,
    remoteStore,
    remoteStoreURL,
    remoteStoreKey,
    remoteStoreEveryPage,
    showAskGPT,
    GPTKey,
    GPTUrl: GPTURL,
    dispatch,

    // Local states
    tempMaxResults,
    tempPageExpireTimeInDays,
    tempForbiddenURLs,
    tempRemoteStoreURL,
    tempGPTKey,
    tempGPTUrl: tempGPTURL,
    navPage,
    storeSize,
    setStoreSize,
    isTestLoading,
    setIsTestLoading,
    GPTTestResult,
    setGPTTestResult,

    // Handlers
    handleMaxResultsChange,
    handleMaxResultsSubmit,
    handlePageExpireTimeChange,
    handlePageExpireTimeSubmit,
    handleForbiddenURLsChange,
    handleBlurForbiddenURLs,
    handleRemoteStoreURLChange,
    handleBlurRemoteStoreURL,
    handleGPTKeyChange,
    handleGPTUrlChange: handleGPTURLChange,
    handleBlurGPTKey,
    handleBlurGPTUrl: handleBlurGPTURL,
    setNavPage,


    // Redux action creators
    toggleSearchEngineAdaption,
    toggleWeiboSupport,
    toggleShowOnlyBookmarkedResults,
    toggleStoreEveryPage,
    toggleBookmarkAdaption,
    toggleShowAskGPT,
    toggleRemoteStore,
    toggleRemoteStoreEveryPage
  }
}