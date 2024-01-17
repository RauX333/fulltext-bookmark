import { createSlice } from "@reduxjs/toolkit"
import type { IGPTAnswer } from "~lib/interface"

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
  GPTURL:string
  GPTKey:string
  GPTQuery:string
  GPTAnswer:IGPTAnswer//TODO:save GPT query
  GPTLoading:boolean
  showAskGPT:boolean
  firstOpenPopup:number
  GPTSearchMaxNumber:number
}

const statSlice = createSlice({
  name: "stat",
  initialState: {
    GPTSearchMaxNumber:10,
    searchEngineAdaption: true,
    storeEveryPage: true,
    bookmarkAdaption: true,
    remoteStore: false,
    showOnlyBookmarkedResults: false,
    remoteStoreEveryPage: false,
    remoteStoreURL: "",// TODO:delete
    remoteStoreKey: "123",
    maxResults: 20,
    forbiddenURLs: ["https://www.google.com/*","https://www.bing.com/*","https://cn.bing.com/*","https://www.baidu.com/*","https://.*.something.com/*"], // TODO:change the last example
    tempPageExpireTime: 60 * 60 * 24 * 60 * 1000, // 60 days
    weiboSupport: true,
    GPTURL:'',// TODO:delete
    GPTKey:'',//TODO:delete
    GPTQuery:"",
    GPTAnswer:null,//TODO:save GPT query
    GPTLoading:false,
    showAskGPT:true,
    firstOpenPopup:0
  },
  reducers: {
    setFirstOpenPopup: (state) => {
      state.firstOpenPopup = state.firstOpenPopup+1
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleShowAskGPT: (state) => {
      state.showAskGPT = !state.showAskGPT
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setGPTLoading: (state,action) => {
      state.GPTLoading = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setGPTQuery: (state,action) => {
      // console.log("action query",action);
      state.GPTQuery = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setGPTAnswer: (state,action) => {
      state.GPTAnswer = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setGPTURL: (state,action) => {
      state.GPTURL = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setGPTKey: (state,action) => {
      state.GPTKey = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleSearchEngineAdaption: (state) => {
      state.searchEngineAdaption = !state.searchEngineAdaption
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleStoreEveryPage: (state) => {
      state.storeEveryPage = !state.storeEveryPage
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleBookmarkAdaption: (state) => {
      state.bookmarkAdaption = !state.bookmarkAdaption
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleRemoteStore: (state) => {
      state.remoteStore = !state.remoteStore
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleShowOnlyBookmarkedResults: (state) => {
      state.showOnlyBookmarkedResults = !state.showOnlyBookmarkedResults
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleRemoteStoreEveryPage: (state) => {
      state.remoteStoreEveryPage = !state.remoteStoreEveryPage
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setRemoteStoreURL: (state, action) => {
      state.remoteStoreURL = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setRemoteStoreKey: (state, action) => {
      state.remoteStoreKey = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setTempPageExpireTime: (state, action) => {
      state.tempPageExpireTime = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setForbiddenURLs: (state, action) => {
      state.forbiddenURLs = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    setMaxResults: (state, action) => {
      state.maxResults = action.payload
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
    },
    toggleWeiboSupport: (state) => {
      state.weiboSupport = !state.weiboSupport
      chrome.runtime.sendMessage({command:'sync',state:state}).then(v=>{})
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
  setGPTKey,
  setGPTURL,
  setGPTQuery,
  setGPTAnswer,
  setGPTLoading,
  toggleShowAskGPT,
  setFirstOpenPopup
} = statSlice.actions

export default statSlice.reducer
