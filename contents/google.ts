import type { PlasmoContentScript } from "plasmo"
import {truncateText,getUrlVars,isGoogle,isBing,isBaidu} from "~/lib/util"
// import "../style.css"

export const config: PlasmoContentScript = {
  matches: ["https://www.google.com/*","https://cn.bing.com/*","https://www.baidu.com/*","https://www.bing.com/*"],
  // run_at: "document_start",
  all_frames: false
}
// console.log("content script loaded")
interface SearchResult {
  title: string
  url: string
  date: number
  ok: boolean
}


// gloab var
let rootContainerID = ""
let queryWordId = ""
let showSearchResult = "true"
let thisURL = window.location.href
const storageKey = 'fulltextbookmark';
let searchResult: SearchResult | null = null
let queryWord = ""
let resultElement=null
let searchFinished=0


// get user options to decide whether to show search result
chrome.storage.local.get([`persist:${storageKey}`], (items) => {
  if(items[`persist:${storageKey}`]) {
    // console.log("persist result",items[`persist:${storageKey}`])
    const rootParsed = JSON.parse(items[`persist:${storageKey}`]);
    showSearchResult = rootParsed?.searchEngineAdaption;
  }  else {
    // console.log("no persist result")
  }
  prepare()
  
  if(showSearchResult === "true") {
    if(isBaidu(thisURL)) {
      setInterval(() => {
        if(thisURL !== window.location.href) {
          // console.log("bbb")
          thisURL = window.location.href
          window.location.reload()
          // prepare()
          // const originContainer = document.getElementById(rootContainerID)
          // originContainer.insertBefore(resultElement, originContainer.firstChild)
        }
      },100)
    }
  }
  
});

function doWork(){
  // console.log("do work")
  const originContainer = document.getElementById(rootContainerID)
  if(!originContainer) {
    // console.log("originContainer not exist")
    searchFinished = -1
    return
  }
  if(showSearchResult!=="true") {
    // console.log("ssssss not rrrr")
    searchFinished = -1
    return
  }
  originContainer.insertBefore(resultElement, originContainer.firstChild)
}

// do work
// window.addEventListener("load", () => {
//   console.log("window loaded")
//   const originContainer = document.getElementById(rootContainerID)
//   if(!originContainer) {
//     // console.log("originContainer not exist")
//     searchFinished = -1
//     return
//   }
//   if(showSearchResult!=="true") {
//     searchFinished = -1
//     return
//   }
//   if(resultElement) { 
//     originContainer.insertBefore(resultElement, originContainer.firstChild)
//   } else {
    
//     if(searchFinished === -1) {
//       return
//     } else {
//       // console.log("wait for resultElement to be ready")
//       let i=0
//       const a = setInterval(()=>{
//         if(i++>=50) {
//           // console.log("wait timeout")
//           clearInterval(a)
//         }
//         if(searchFinished === -1) {
//           clearInterval(a)
//         }
//         if(resultElement) {
//           originContainer.insertBefore(resultElement, originContainer.firstChild)
//           console.log(i)
//           clearInterval(a)
//         }
//       },20)
//     }
//   }
// })


function createResult (){
  // console.log("createResultelemnent")
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
  box.style.maxHeight = "130px"
  box.style.borderWidth="2px"
  box.style.borderStyle = "solid"
  // box.style.borderRadius="0.375rem"
  box.style.setProperty("border-radius","calc(min(0.375rem,6px))")
  box.style.borderColor="#D1D5DB"
  box.style.display="flex"
  box.style.flexDirection="column"
  box.style.justifyContent="flex-start"
  box.style.setProperty("padding","calc(min(1rem,16px))")
  // box.style.padding="1rem"
  box.style.setProperty("padding-bottom","calc(min(0.5rem,8px))")
  box.style.gap="5px"

  // title
  const firstChild = document.createElement("span")
  box.appendChild(firstChild)
  firstChild.style.setProperty("font-size","calc(min(1.125rem,18px))")
  // firstChild.style.fontSize="1.125rem"
  // firstChild.style.lineHeight="1.75rem"
  firstChild.style.setProperty("line-height","calc(min(1.75rem,28px))")
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
  // secondChild.style.fontSize="0.875rem"
  secondChild.style.setProperty("font-size","calc(min(0.875rem,14px))")
  secondChild.style.setProperty("line-height","calc(min(1.25rem,20px))")
  // secondChild.style.lineHeight="1.25rem"
  secondChild.style.color="black"
  secondChild.textContent=truncateText(searchResult?.url, 60)

  // date
  const thirdChild = document.createElement("div")
  box.appendChild(thirdChild)
  // thirdChild.style.fontSize="0.875rem"
  // thirdChild.style.lineHeight="1.25rem"
  thirdChild.style.setProperty("font-size","calc(min(0.875rem,14px))")
  thirdChild.style.setProperty("line-height","calc(min(1.25rem,20px))")
  thirdChild.style.color="#6B7280"
  thirdChild.style.display="flex"
  thirdChild.style.flexDirection="row"
  thirdChild.style.justifyContent="space-between"
  const dateSpan = document.createElement("span")
  thirdChild.appendChild(dateSpan)
  dateSpan.textContent=new Date(searchResult?.date).toLocaleDateString()
  const watermarkSpan = document.createElement("span")
  thirdChild.appendChild(watermarkSpan)
  watermarkSpan.textContent="by fulltext-bookmark"
  // watermarkSpan.style.fontSize="0.75rem"
  // watermarkSpan.style.lineHeight="1rem"
  watermarkSpan.style.setProperty("font-size","calc(min(0.75rem,12px))")
  watermarkSpan.style.setProperty("line-height","calc(min(1rem,16px))")
  // watermarkSpan.style.paddingTop="1rem"
  watermarkSpan.style.setProperty("padding-top","calc(min(1rem,16px))")
  watermarkSpan.style.color="#E5E7EB"
  return newEl
  // el.insertBefore(newEl, el.firstChild)
}

function prepare(){
  if(!thisURL) {
    searchFinished = -1
    return
  }
  if (showSearchResult!=="true"){
    searchFinished = -1
    return
  }
  if(isGoogle(thisURL)) {
    // console.log("google")
    rootContainerID="center_col"
    queryWordId = "q"
  } else if(isBing(thisURL)) {
    // console.log("bing")
    rootContainerID="b_results"
    queryWordId = "q"
    // TODO:add querywordid
  } else if(isBaidu(thisURL)) {
    console.log("baidu")
    rootContainerID="content_left"
    queryWordId = "wd"
  } else {
    // console.log("no match page")
    searchFinished = -1
  }
  
  if(queryWordId && queryWordId!=="") {
    queryWord = getUrlVars(thisURL)[queryWordId]
    // console.log("queryWord:", queryWord)
  }
  
  if(queryWord && rootContainerID) {
    chrome.runtime
      .sendMessage({ command: "google_result", search: queryWord })
      .then((v) => {
        // console.log("google_result message response:", v)
        searchResult = v
        if(searchResult && searchResult.ok!==false) {
          resultElement = createResult()
          if(document.readyState === 'complete') {
            doWork()
          } else {
            document.onreadystatechange = function () {
              if (document.readyState == "complete") {
                doWork()
              }
            }
          }
        } else {
          searchFinished = -1
        }
      })
  }
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

// function createAndInsertResultBox(el) {
//   const newEl = document.createElement("div")
//   newEl.setAttribute("id", "fulltext-bookmark-mount-point")
//   newEl.style.height = "130px"
//   newEl.style.marginTop = "5px"
//   newEl.style.marginBottom = "15px"
//   // newEl.style.display = "none"
//   el.insertBefore(newEl, el.firstChild)
// }

// function createAndInsertEmptyResultBox(el) {
//   const newEl = document.createElement("div")
//   newEl.setAttribute("id", "fulltext-bookmark-mount-point")
//   newEl.style.display = "none"
//   el.insertBefore(newEl, el.firstChild)
// }

// export default SearchResult
