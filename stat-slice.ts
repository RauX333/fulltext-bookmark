import { createSlice } from "@reduxjs/toolkit"

export interface AppStat {
  searchEngineAdaption: boolean
  storeEveryPage: boolean
  bookmarkAdaption: boolean
  remoteStore: boolean
  remoteStoreURL: string | null
  remoteStoreKey: string | null
  showOnlyBookmarkedResults: boolean
  dontRemoteStoreEveryPage: boolean
  tempPageExpireTime: number
  maxResults: number
}

const statSlice = createSlice({
  name: "stat",
  initialState: {
    searchEngineAdaption: true,
    storeEveryPage: true,
    bookmarkAdaption: true,
    remoteStore: false,
    showOnlyBookmarkedResults: false,
    dontRemoteStoreEveryPage: true,
    remoteStoreURL: null,
    remoteStoreKey: null,
    maxResults: 20,
    tempPageExpireTime: 60 * 60 * 24 * 60 // 60 days
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
    toggleDontRemoteStoreEveryPage: (state) => {
      state.dontRemoteStoreEveryPage = !state.dontRemoteStoreEveryPage
    },
    setRemoteStoreURL: (state, action) => {
      state.remoteStoreURL = action.payload
    },
    setRemoteStoreKey: (state, action) => {
      state.remoteStoreKey = action.payload
    },
    setTempPageExpireTime: (state, action) => {
      state.tempPageExpireTime = action.payload
    }
  }
})

export const {
  toggleBookmarkAdaption,
  toggleSearchEngineAdaption,
  toggleStoreEveryPage,
  toggleRemoteStore,
  toggleShowOnlyBookmarkedResults,
  toggleDontRemoteStoreEveryPage,
  setRemoteStoreURL,
  setRemoteStoreKey,
  setTempPageExpireTime
} = statSlice.actions

export default statSlice.reducer
