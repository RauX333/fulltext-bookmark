import { createSlice } from "@reduxjs/toolkit"

export interface AppStat {
  searchEngineAdaption: boolean
  storeEveryPage: boolean
  bookmarkAdaption: boolean
  remoteStore: boolean
  remoteStoreURL: string
  remoteStoreKey: string
  showOnlyBookmarkedResults: boolean
  remoteStoreEveryPage: boolean
  tempPageExpireTime: number
  maxResults: number
  forbiddenURLs: string[]
  weiboSupport: boolean
}

const statSlice = createSlice({
  name: "stat",
  initialState: {
    searchEngineAdaption: true,
    storeEveryPage: true,
    bookmarkAdaption: true,
    remoteStore: false,
    showOnlyBookmarkedResults: false,
    remoteStoreEveryPage: false,
    remoteStoreURL: "",// TODO:delete
    remoteStoreKey: "123",
    maxResults: 20,
    forbiddenURLs: ["https://www.google.com/*","https://cn.bing.com/*","https://www.baidu.com/*","https://.*.something.com/*"], // TODO:change the last example
    tempPageExpireTime: 60 * 60 * 24 * 60 * 1000, // 60 days
    weiboSupport: true,
  },
  reducers: {
    toggleSearchEngineAdaption: (state) => {
      state.searchEngineAdaption = !state.searchEngineAdaption
    },
    toggleStoreEveryPage: (state) => {
      state.storeEveryPage = !state.storeEveryPage
    },
    toggleBookmarkAdaption: (state) => {
      state.bookmarkAdaption = !state.bookmarkAdaption
    },
    toggleRemoteStore: (state) => {
      state.remoteStore = !state.remoteStore
    },
    toggleShowOnlyBookmarkedResults: (state) => {
      state.showOnlyBookmarkedResults = !state.showOnlyBookmarkedResults
    },
    toggleRemoteStoreEveryPage: (state) => {
      state.remoteStoreEveryPage = !state.remoteStoreEveryPage
    },
    setRemoteStoreURL: (state, action) => {
      state.remoteStoreURL = action.payload
    },
    setRemoteStoreKey: (state, action) => {
      state.remoteStoreKey = action.payload
    },
    setTempPageExpireTime: (state, action) => {
      state.tempPageExpireTime = action.payload
    },
    setForbiddenURLs: (state, action) => {
      state.forbiddenURLs = action.payload
    },
    setMaxResults: (state, action) => {
      state.maxResults = action.payload
    },
    toggleWeiboSupport: (state) => {
      state.weiboSupport = !state.weiboSupport
    }
  }
})

export const {
  toggleBookmarkAdaption,
  toggleSearchEngineAdaption,
  toggleStoreEveryPage,
  toggleRemoteStore,
  toggleShowOnlyBookmarkedResults,
  toggleRemoteStoreEveryPage,
  setRemoteStoreURL,
  setRemoteStoreKey,
  setTempPageExpireTime,
  setForbiddenURLs,
  setMaxResults,
  toggleWeiboSupport,
} = statSlice.actions

export default statSlice.reducer
