import type { PlasmoContentScript } from "plasmo"
import "../style.css"

export const config: PlasmoContentScript = {
  matches: ["https://www.google.com/*","https://cn.bing.com/*","https://www.baidu.com/*"],
  // run_at: "document_start",
  all_frames: false
}

console.log("sss")

let rootContainerID = ""
let queryWordId = ""
const thisURL = window.location.href
// regexp jusge if thisURL is https://www.google.com/*
const isGoogle = () => {
  return thisURL.match(/https:\/\/www.google.com\/*/)
}
// regexp jusge if thisURL is https://*.bing.com/*
const isBing = () => {
  return thisURL.match(/https:\/\/cn.bing.com\/*/)
}

const isBaidu = () => {
  return thisURL.match(/https:\/\/www.baidu.com\/*/)
}
if(isGoogle) {
  rootContainerID="center_col"
  queryWordId = "[name='q']"
} else if(isBing) {
  rootContainerID="b_results"
} else if(isBaidu) {
  rootContainerID="content_left"
  queryWordId = "[name='wd']"
}

let showSearchResult = "true"
const key = 'fulltextbookmark';
chrome.storage.local.get([`persist:${key}`], (items) => {
  const rootParsed = JSON.parse(items[`persist:${key}`]);
  showSearchResult = rootParsed.searchEngineAdaption;
  console.log("ssssss", showSearchResult);
});

interface SearchResult {
  title: string
  url: string
  date: number
}

let searchResult: SearchResult | null = null

window.addEventListener("load", () => {
  console.log("content script loaded")
  const originContainer = document.getElementById(rootContainerID)
  console.log("ppppppp", showSearchResult);
  if(showSearchResult==="false") {
    createAndInsertEmptyResultBox(originContainer)
    return
  }
  // createAndInsertResultBox(originContainer)
  // get google search bar value
  const searchInput = document.querySelector(queryWordId)
  // @ts-ignore
  const s = searchInput.value
  console.log("get google search input value: ", s)
  chrome.runtime
    .sendMessage({ command: "google_result", search: s })
    .then((v) => {
      console.log("google_result message response:", v)
      searchResult = v
      createAndInsertResultBox(originContainer)
    })
})

function createAndInsertResultBox(el) {
  const newEl = document.createElement("div")
  newEl.setAttribute("id", "fulltext-bookmark-mount-point")
  newEl.style.height = "130px"
  newEl.style.marginTop = "5px"
  newEl.style.marginBottom = "15px"
  // newEl.style.display = "none"
  el.insertBefore(newEl, el.firstChild)
}

function createAndInsertEmptyResultBox(el) {
  const newEl = document.createElement("div")
  newEl.setAttribute("id", "fulltext-bookmark-mount-point")
  newEl.style.display = "none"
  el.insertBefore(newEl, el.firstChild)
}

export const getRootContainer = async () => {
  const el = await waitForElements("#fulltext-bookmark-mount-point")
  return document.querySelector("#fulltext-bookmark-mount-point")
}
// export const getMountPoint = async () => document.querySelector("#fulltext-bookmark-mount-point")

const SearchResult = () => {
  if(!searchResult){
    return null
  } 
  return (
    <div
      className="border-[1px] rounded-md border-gray-300 flex flex-col pr-4 pl-4 pt-4 pb-2 gap-[5px] justify-start">
      <span className="text-lg text-blue-400">
        <a href={searchResult.url} target="_blank" rel="noopener noreferrer">
          {truncateText(searchResult.title, 60)}
        </a>
      </span>
      <span className="text-sm text-black">
        <p>{truncateText(searchResult.url, 60)}</p>
      </span>
      <span className="text-sm text-gray-500 flex flex-row justify-between">
        <span>{new Date(searchResult.date).toLocaleDateString()}</span>
        <span className="text-gray-200 text-xs pt-4">by fulltext-bookmark</span>
      </span>
    </div>
  )
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "..."
  }
  return text
}

// HELPER
const waitForElements = (selector) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector))
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

export default SearchResult
