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
    remoteStoreURL: "https://maker.ifttt.com/trigger/fulltext_bookmark/json/with/key/bz2RFiQJ-6TKl_7QBvmo-3",
    remoteStoreKey: "123",
    maxResults: 20,
    forbiddenURLs: ["https://www.google.com/*","https://cn.bing.com/*","https://www.baidu.com/*","https://.*.baidu.com/*"],
    tempPageExpireTime: 60 * 60 * 24 * 60 * 1000 // 60 days
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
  setMaxResults
} = statSlice.actions

export default statSlice.reducer
