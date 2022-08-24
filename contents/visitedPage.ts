import { Readability, isProbablyReaderable } from "@mozilla/readability"
import type { PlasmoContentScript } from "plasmo"
import { v4 as uuidv4 } from "uuid"

export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  all_frames: false,
  match_about_blank: false,
  run_at: "document_start"
}
// exclude google/bing/baidu urls
const excludeURLs = [
  "https://www.google.com/*",
  "https://cn.bing.com/*",
  "https://www.baidu.com/*"
]
const pageId = uuidv4()
const storageKey = 'fulltextbookmark';
let options = {
  storeEveryPage: true,
  bookmarkAdaption: true,
}


window.addEventListener("load", () => {
  if (!isExcludeURL(window.location.href)) {
  chrome.storage.local.get([`persist:${storageKey}`], (items) => {
    if(items[`persist:${storageKey}`]) {
      console.log("persist result",items[`persist:${storageKey}`])
      options = JSON.parse(items[`persist:${storageKey}`]);
    }  else {
      console.log("no persist result")
    }
    if(options.bookmarkAdaption.toString() === "true") {
      newBookmarkListener()
    }
    
    if(options.storeEveryPage.toString() === "true") {
      console.log("store every page")
      parsePageAndSend()
    }
  });
}
})

const newBookmarkListener = (): void => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "bookmark") {
      if(options.storeEveryPage.toString() === "true") {
        sendResponse({ pageId: pageId,stored: true })
      } else {
        const article = parsePage()
        sendResponse({ data: article, pageId: pageId,stored:false })
      }
    } else {
      sendResponse({})
    }
  })
}
// judge if the url is in the exclude url pattern list
const isExcludeURL = (url: string): boolean => {
  for (let i = 0; i < excludeURLs.length; i++) {
    const re = new RegExp(excludeURLs[i])
    if (re.test(url)) {
      console.log("exclude url:", url)
      return true
    }
  }
  console.log("not exclude url:", url)
  return false
}

function parsePageAndSend (){
  const article = parsePage()
  // send to background script
  chrome.runtime
    .sendMessage({ command: "store", data: article, pageId: pageId })
    .then((v) => {
      console.log(`${pageId} store message response: ${v}`)
    })
}


function parsePage(){
  // get content of page
  var article: any
  var documentClone = document.cloneNode(true)
  // @ts-ignore
  if (isProbablyReaderable(documentClone)) {
    // @ts-ignore
    article = new Readability(documentClone).parse()
    console.log(article)
    article = {
      title: article.title,
      content: article.textContent,
      url: window.location.href,
      date: Date.now()
    }
  } else {
    console.log("not readable")
    article = {
      title: document.title,
      url: window.location.href,
      content: document.body.innerText,
      date: Date.now()
    }
  }
  return article
}
