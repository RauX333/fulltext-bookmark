// import {truncateText} from "~/lib/util"
// import "../style.css"
import icon512 from "data-base64:~assets/icon512.png"
import loading from "data-base64:~assets/loading.gif"
import type { PlasmoContentScript } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import debounce from "~lib/debounce"

export const config: PlasmoContentScript = {
  matches: ["https://weibo.com/*"],
  // run_at: "document_start",
  all_frames: false
}

console.log("weibo content script")

const storageKey = "fulltextbookmark"
let weiboSupport = "true"
// get user options to decide whether to show search result
chrome.storage.local.get([`persist:${storageKey}`], (items) => {
  if (items[`persist:${storageKey}`]) {
    // console.log("persist result",items[`persist:${storageKey}`])
    const rootParsed = JSON.parse(items[`persist:${storageKey}`])
    console.log(rootParsed)
    weiboSupport = rootParsed.weiboSupport
  } else {
    // console.log("no persist result")
  }
  // TODO:judge if show save btn in weibo page
  if(weiboSupport === "false") {
    return
  }
  if (document.readyState === "complete") {
    // console.log("1")
    addBtn().then(() => {
      window.onscroll = function () {
        // console.log("scroll")
        debouncAddBtn()
      }
    })
  } else {
    document.onreadystatechange = async function () {
      if (document.readyState == "complete") {
        // console.log("2")
        addBtn().then(() => {
          window.onscroll = function () {
            // console.log("scroll")
            debouncAddBtn()
          }
        })
      }
    }
  }
})

const debouncAddBtn = debounce(
  async () => {
    // console.log("add btn")
    await addBtn()
  },
  300,
  { leading: true, trailing: true }
)

async function addBtn() {
  const feedCard = await findFeedCard()
  // console.log(feedCard)
  if (feedCard.length > 0) {
    feedCard.forEach((e) => {
      // if othe card already has the btn, return
      if (e.querySelector("#fulltext_bookmark_search-btn")) {
        // console.log("aaa")
        // return
        e.querySelector("#fulltext_bookmark_search-btn").remove()
      }
      // get url
      const urlA = e.querySelector("a[class^='head-info_time']")
      // console.log(urlA)

      // get content
      const contentDivs = e.querySelectorAll("div[class^='detail_wbtext']")
      let content = ""
      contentDivs.forEach((e) => {
        content = content + e.innerText + "\n"
      })
      // console.log(contentDiv.innerText,contentDiv.innerHTML)

      // get title

      const headname = e.querySelector("a[class*='head_name']")
      const title = "@" + headname.innerText + "://" + content

      // get btn insert position
      let headInfo = e.querySelector("div[class*='toolbar_main']")
      if (!headInfo) {
        headInfo = e.querySelector("div[class*='head-info_info']")
      }

      // insert btn
      try {
        headInfo.appendChild(makeBtn(urlA.href, content, title))
      } catch {}
    })
  }
}

async function findFeedCard() {
    const a = await waitForElements("div[class^='Feed_body']")
    const feedCard = document.querySelectorAll(
      "div[class^='vue-recycle-scroller__item-view']"
    )
    return feedCard
}

function makeBtn(url: string, content: string, title: string) {
  const btn = document.createElement("btn")
  // btn.innerText = 'bookmark';
  const ic = document.createElement("span")
  btn.style.backgroundImage = `url(${icon512})`
  // btn.style.width = '10px';
  // btn.style.height = '10px';
  btn.style.backgroundSize = "contain"
  btn.style.backgroundRepeat = "no-repeat"
  btn.style.backgroundPosition = "center"
  // btn.appendChild(ic);
  btn.id = "fulltext_bookmark_search-btn"
  // make btn round
  btn.style.borderRadius = "100%"
  btn.style.width = "20px"
  btn.style.height = "20px"
  // btn.style.backgroundColor = '#fff';
  // btn.style.paddingTop = "5px"
  // btn.style.background="transparent";
  btn.style.border = "none"
  btn.style.color = "#939393"
  btn.style.fontSize = "0.5rem"
  // btn.style.marginLeft="10%";
  btn.onmouseover = function () {
    btn.style.backgroundColor = "#fff2e5"
  }
  btn.onmouseout = function () {
    btn.style.backgroundColor = "#fff"
  }
  btn.onclick = async function () {
    btn.style.backgroundImage = `url(${loading})`
    await archive(url, content, title)
    btn.style.backgroundImage = `url(${icon512})`
  }

  return btn
}

const waitForElements = (selector) => {
  return new Promise((resolve,reject) => {
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
    // const gg = setTimeout(() => {
    //   observer.disconnect()
    //   console.log("%%%%%%%%%%%%%%")
    //   clearTimeout(gg)
    //   rejects()
    // },10000)
  })
}

async function archive(url: string, content: string, title: string) {
  console.log("archive", url, content, title)
  const data = {
    url: url,
    content: content,
    title: title,
    date: Date.now(),
    isBookmarked: true
  }
  return chrome.runtime.sendMessage({
    command: "store",
    data: data,
    pageId: uuidv4()
  })
  // chrome.runtime.sendMessage({
  //   type: 'archive',
  //   data
  // })
}
