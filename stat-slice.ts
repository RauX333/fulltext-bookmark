import { createSlice } from "@reduxjs/toolkit"

export interface AppStat {
  searchEngineAdaption: boolean
  storeEveryPage: boolean
  bookmarkAdaption: boolean
  remoteStore: boolean
}

const statSlice = createSlice({
  name: "stat",
  initialState: {
    searchEngineAdaption: true,
    storeEveryPage: true,
    bookmarkAdaption: true,
    remoteStore: false,
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
    }
  }
})

export const { toggleBookmarkAdaption, toggleSearchEngineAdaption,toggleStoreEveryPage, toggleRemoteStore} = statSlice.actions

export default statSlice.reducer
