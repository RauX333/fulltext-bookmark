import type { PlasmoContentScript } from "plasmo"
// import "../style.css"

export const config: PlasmoContentScript = {
  matches: ["https://www.google.com/*","https://cn.bing.com/*","https://www.baidu.com/*"],
  // run_at: "document_start",
  all_frames: false
}

interface SearchResult {
  title: string
  url: string
  date: number
}


// gloab var
let rootContainerID = ""
let queryWordId = ""
let showSearchResult = "true"
const thisURL = window.location.href
const storageKey = 'fulltextbookmark';
let searchResult: SearchResult | null = null


// get user options to decide whether to show search result
chrome.storage.local.get([`persist:${storageKey}`], (items) => {
  if(items[`persist:${storageKey}`]) {
    const rootParsed = JSON.parse(items[`persist:${storageKey}`]);
    showSearchResult = rootParsed?.searchEngineAdaption;
  }
});


// do work
window.addEventListener("load", () => {
  console.log("content script loaded")

  // get search word from url
  if(isGoogle()) {
    console.log("google")
    rootContainerID="center_col"
    queryWordId = "[name='q']"
  } else if(isBing()) {
    console.log("bing")
    rootContainerID="b_results"
    // TODO:add querywordid
  } else if(isBaidu()) {
    console.log("baidu")
    rootContainerID="content_left"
    queryWordId = "#kw"
  } else {
    console.log("no match page")
    return
  }
  const originContainer = document.getElementById(rootContainerID)
  if(!originContainer) {
    console.log("originContainer not exist")
    return
  }
  console.log("showSearchResult?:", showSearchResult);
  if(showSearchResult==="false") {
    // createAndInsertEmptyResultBox(originContainer)
    return
  }
  // createAndInsertResultBox(originContainer)
  // get google search bar value
  const searchInput = document.querySelector(queryWordId)
  if(!searchInput) {
    console.log("searchInput not exist")
    return
  }
  // @ts-ignore
  const s = searchInput.value
  console.log("get search input value: ", s)
  
  // listen backend search result
  if(s&&s!=="") {
    chrome.runtime
    .sendMessage({ command: "google_result", search: s })
    .then((v) => {
      console.log("google_result message response:", v)
      searchResult = v
      createResult(originContainer)
    })
  }
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


function createResult (el){
  // mount-point
  const newEl = document.createElement("div")
  newEl.setAttribute("id", "fulltext-bookmark-mount-point")
  newEl.style.height = "130px"
  newEl.style.marginTop = "10px"
  newEl.style.marginBottom = "15px"
  newEl.style.zIndex = "10"

  // box
  const box = document.createElement("div")
  newEl.appendChild(box)
  
  box.style.borderWidth="2px"
  box.style.borderStyle = "solid"
  box.style.borderRadius="0.375rem"
  box.style.borderColor="#D1D5DB"
  box.style.display="flex"
  box.style.flexDirection="column"
  box.style.justifyContent="flex-start"
  box.style.padding="1rem"
  box.style.paddingBottom="0.5rem"
  box.style.gap="5px"

  // title
  const firstChild = document.createElement("span")
  box.appendChild(firstChild)
  firstChild.style.fontSize="1.125rem"
  firstChild.style.lineHeight="1.75rem"
  firstChild.style.color="#60a5fa"
  const urla = document.createElement("a")
  firstChild.appendChild(urla)
  urla.href = searchResult?.url
  urla.target = "_blank"
  urla.rel = "noopener noreferrer"
  urla.textContent=truncateText(searchResult?.title, 60)

  // url
  const secondChild = document.createElement("span")
  box.appendChild(secondChild)
  secondChild.style.fontSize="0.875rem"
  secondChild.style.lineHeight="1.25rem"
  secondChild.style.color="black"
  secondChild.textContent=truncateText(searchResult?.url, 60)

  // date
  const thirdChild = document.createElement("span")
  box.appendChild(thirdChild)
  thirdChild.style.fontSize="0.875rem"
  thirdChild.style.lineHeight="1.25rem"
  thirdChild.style.color="#6B7280"
  thirdChild.style.display="flex"
  thirdChild.style.flexDirection="row"
  thirdChild.style.justifyContent="flex-between"
  const dateSpan = document.createElement("span")
  thirdChild.appendChild(dateSpan)
  dateSpan.textContent=new Date(searchResult?.date).toLocaleDateString()
  const watermarkSpan = document.createElement("span")
  thirdChild.appendChild(watermarkSpan)
  watermarkSpan.textContent="by fulltext-bookmark"
  watermarkSpan.style.fontSize="0.75rem"
  watermarkSpan.style.lineHeight="1rem"
  watermarkSpan.style.paddingTop="1rem"
  watermarkSpan.style.color="#E5E7EB"

  el.insertBefore(newEl, el.firstChild)
}

// export const getRootContainer = async () => {
//   const el = await waitForElements("#fulltext-bookmark-mount-point")
//   return document.querySelector("#fulltext-bookmark-mount-point")
// }
// export const getMountPoint = async () => document.querySelector("#fulltext-bookmark-mount-point")

// const SearchResult = () => {
//   if(!searchResult){
//     return null
//   } 
//   return (
//     <div
//       className="border-[1px] rounded-md border-gray-300 flex flex-col pr-4 pl-4 pt-4 pb-2 gap-[5px] justify-start">
//       <span className="text-lg text-blue-400">
//         <a href={searchResult.url} target="_blank" rel="noopener noreferrer">
//           {truncateText(searchResult.title, 60)}
//         </a>
//       </span>
//       <span className="text-sm text-black">
//         <p>{truncateText(searchResult.url, 60)}</p>
//       </span>
//       <span className="text-sm text-gray-500 flex flex-row justify-between">
//         <span>{new Date(searchResult.date).toLocaleDateString()}</span>
//         <span className="text-gray-200 text-xs pt-4">by fulltext-bookmark</span>
//       </span>
//     </div>
//   )
// }

const truncateText = (text: string, maxLength: number) => {
  if(!text) {
    return ""
  }
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

const isGoogle = () => {
  const reg = /^https:\/\/www.google.com\/*/g
  // console.log("reg",reg.test(thisURL))
  return reg.test(thisURL)
}
// regexp jusge if thisURL is https://*.bing.com/*
const isBing = () => {
  const reg = /^https:\/\/cn.bing.com\/*/g
  return reg.test(thisURL)
 
}

const isBaidu = () => {
  const reg = /^https:\/\/www.baidu.com\/*/g
  return reg.test(thisURL)
}

// export default SearchResult
