import Dexie from "dexie"

import "dexie-export-import"

// import { Segment, useDefault } from "segmentit"
import debounce from "~lib/debounce"
import init, { cut_for_search } from "~lib/jieba_rs_wasm.js"
import mid from "~lib/mid"
import {
  getBookmarkUrl,
  getWeiboEncode,
  handleUrlRemoveHash,
  isWeibo
} from "~lib/util"
import { persistor, store } from "~store/store"

export {}

;(async function () {
  await init()
})()

// const segmentit = useDefault(new Segment())
// let userOptions = null;
// // // console.log("init useroptions",userOptions);
// persistor.subscribe(() => {
//   console.log("State changed with: ", store?.getState())
//   userOptions = store.getState()
//   console.log("changed useroptions ",userOptions);
// });
// ====================================================================================================
// Database setup
// Dexie.delete("PageDatabase")
const db = new Dexie("PageDatabase")
db.version(1).stores({
  pages: "++id,url,title,date,pageId,isBookmarked",
  contents: "&pid,*contentWords,*titleWords"
})
// // @ts-ignore
// db.pages.hook("creating", function (primKey, obj, trans) {
//   if (typeof obj.content == "string") {
//     obj.contentWords = wordSplit(obj.content)
//   }
//   if (typeof obj.title == "string") {
//     obj.titleWords = wordSplit(obj.title)
//   }
// })
// // @ts-ignore
// db.pages.hook("updating", function (mods, primKey, obj, trans) {
//   if (mods.hasOwnProperty("content")) {
//     // "message" property is being updated
//     if (typeof mods.content === "string") {
//       // "message" property was updated to another valid value. Re-index messageWords:
//       return { contentWords: wordSplit(mods.content) }
//     } else {
//       // "message" property was deleted (typeof mods.message === 'undefined') or changed to an unknown type. Remove indexes:
//       return { contentWords: [] }
//     }
//   }
//   if (mods.hasOwnProperty("title")) {
//     // "message" property is being updated
//     if (typeof mods.title === "string") {
//       // "message" property was updated to another valid value. Re-index messageWords:
//       return { titleWords: wordSplit(mods.title) }
//     } else {
//       // "message" property was deleted (typeof mods.message === 'undefined') or changed to an unknown type. Remove indexes:
//       return { titleWords: [] }
//     }
//   }
// })
db.open()

// delete outdated records
const userOps = store.getState()

// delete content table
// @ts-ignore
db.transaction("rw", db.pages, db.contents, async () => {
  // @ts-ignore
  const delIDs = await db.pages
    .where("date")
    .below(Date.now() - userOps.tempPageExpireTime)
    .primaryKeys()
  if (delIDs && delIDs.length > 0) {
    // @ts-ignore
    await db.pages.where("id").anyOf(delIDs).delete()
    // @ts-ignore
    await db.contents.where("pid").anyOf(delIDs).delete()
  }
})

// ====================================================================================================

interface PageData {
  pageId?: string
  url: string
  content?: string
  title: string
  date: number
  isBookmarked?: boolean
  contentWords?: string[]
  titleWords?: string[]
}

interface Message {
  command: string
  data: PageData
  pageId: string
}

// ====================================================================================================
// listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case "store":
      // console.log(
      //   `${message.pageId} received temp store message from ${sender.tab.id}`
      // )
      // isBookmarked false

      // save to database
      ;(async () => {
        if (
          message.data.isBookmarked === true ||
          message.data.isBookmarked === false
        ) {
        } else {
          const bookmarkSearchResult = await chrome.bookmarks.search(
            message.data.url
          )
          // console.log("ppp",bookmarkSearchResult,message.data.url)
          if (bookmarkSearchResult && bookmarkSearchResult.length > 0) {
            // console.log("already bookmrked")
            message.data.isBookmarked = true
          } else {
            message.data.isBookmarked = false
          }
        }

        await saveToDatabase({ ...message.data, pageId: message.pageId })
        sendResponse("ok")
      })()
      return true
    case "google_result":
      // console.log("google result", message.search)
      ;(async () => {
        const result = await searchString(message.search, "short")
        // console.log("search result", result)
        if (result && result.length > 0) {
          const matchedFirst = result[0]
          sendResponse({
            ...matchedFirst,
            ok: true
          })
        } else {
          sendResponse({
            title: "",
            url: "",
            date: 0,
            ok: false
          })
        }
      })()
      return true
    case "popsearch":
      // console.log("popsearch", message.search)
      ;(async () => {
        const result = await searchString(message.search, "long")
        // console.log("search result", result)
        sendResponse(result)
      })()
      return true
    case "clearAllData":
      ;(async () => {
        // @ts-ignore
        await db.pages.clear()
        // @ts-ignore
        await db.contents.clear()
        sendResponse("ok")
      })()
      return true
    case "export":
      ;(async () => {
        const blob = await db.export()
        // console.log(blob)
        // download(blob, "dlTextBlob.json", "application/json")
        let reader = new FileReader()
        reader.onload = function (e) {
          // let readerres = reader.result;
          // @ts-ignore
          let parseObj = JSON.parse(this.result)
          // console.log(parseObj)
          sendResponse(parseObj)
        }
        reader.readAsText(blob, "utf-8")
      })()
      return true
    default:
      sendResponse("invalid command")
      break
  }
})

// bookmark linstener
chrome.bookmarks.onCreated.addListener((id, bm) => {
  // console.log("bookmarks created:", id, bm)
  const userOptions = store.getState()
  // console.log("ss oprion", userOptions)
  if (!userOptions.bookmarkAdaption) {
    return
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // console.log("tabs tabs",tabs)
    chrome.tabs.sendMessage(
      tabs[0].id,
      { command: "bookmark", data: "create" },
      (resp) => {
        // console.log("book resp", resp)
        // change archive status in db
        if (!resp) {
          ;(async () => {
            await saveToDatabase({
              title: tabs[0].title,
              url: handleUrlRemoveHash(tabs[0].url),
              date: Date.now(),
              pageId: tabs[0].id.toString(),
              isBookmarked: true
            })
          })()
        } else {
          if (resp.stored === true) {
            bookmark(resp.pageId)
          } else {
            // console.log("bookmark not stored")
            resp.data.isBookmarked = true
            ;(async () => {
              await saveToDatabase({ ...resp.data, pageId: resp.pageId })
            })()
          }
        }

        return true
      }
    )
  })
})

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  const removedURLs = getBookmarkUrl(removeInfo)
  unBookmarked(removedURLs)
})

// chrome.omnibox.setDefaultSuggestion(
//   {description:"search fulltext bookmark/history "},
// )

// chrome.omnibox.onInputStarted.addListener(() => {
//   console.log("start omnibox input")
// })

const omniboxSearch = debounce(
  async (text, suggest) => {
    // console.log("input changed", text)
    const result = await searchString(text, "long")
    // slice to length 5
    const resultSlice = result.slice(0, 5)
    const sug = resultSlice.map((e) => {
      return {
        content: e.url,
        description: `${e.title} - <url>${e.url} </url>`
      }
    })
    suggest(sug)
  },
  500,
  { leading: false, trailing: true }
)

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  omniboxSearch(text, suggest)
})

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  if (disposition == "newForegroundTab") {
    // console.log("newForegroundTab")
    // create a new tab and load the url
    chrome.tabs.create({ url: text })
  }
  if (disposition == "newBackgroundTab") {
    // console.log("newBackgroundTab")
    // create a new background tab and load the url
    chrome.tabs.create({ url: text, active: false })
  }
  if (disposition == "currentTab") {
    // console.log("currentTab")
    // redirect current tab to the url
    chrome.tabs.query({ active: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: text })
    })
  }
})

// ====================================================================================================

// ====================================================================================================
// database functions
function unBookmarked(urls: string[]): void {
  // delete from database matching the removedURLs
  // console.log("+++++++++++++++",urls)
  // @ts-ignore
  db.pages
    .where("url")
    .anyOf(urls)
    .modify({ isBookmarked: false })
    .then(() => {
      // console.log("unbookmarked")
    })
}

function bookmark(pageId: string) {
  // @ts-ignore
  db.transaction("rw", db.pages, async () => {
    // @ts-ignore
    const existed = await db.pages.where("pageId").equals(pageId).first()
    if (existed && existed.id) {
      // @ts-ignore
      await db.pages.update(existed.id, { isBookmarked: true })
      const options = store.getState()
      if (options.remoteStore) {
        // console.log("bookmark remote 1")
        sendToRemote({ ...existed, isBookmarked: true })
      }
    }
  })
}

async function saveToDatabase(data: PageData) {
  // @ts-ignore
  const existedId = await db.pages.where("pageId").equals(data.pageId).first()
  if (existedId && existedId.id) {
    //  console.log("existed,update")
    return
  }
  data.contentWords = wordSplit(data.content)
  data.titleWords = wordSplit(data.title)

  delete data.content
  const indexData = {
    url: data.url,
    title: data.title,
    date: data.date,
    isBookmarked: data.isBookmarked,
    pageId: data.pageId
  }
  const largeData = {
    contentWords: data.contentWords,
    titleWords: data.titleWords
  }
  const options = store.getState()
  if (options.remoteStore) {
    if (options.remoteStoreEveryPage || data.isBookmarked) {
      sendToRemote(indexData)
    }
  }
  // @ts-ignore
  db.transaction("rw", db.pages, db.contents, async () => {
    // @ts-ignore
    const existed = await db.pages.where("url").equals(data.url).first()
    if (existed && existed.id) {
      const id = existed.id
      let ps = []
      // @ts-ignore
      ps.push(db.pages.update(id, indexData))
      if (
        largeData.contentWords.length > 0 &&
        largeData.titleWords.length > 0
      ) {
        // @ts-ignore
        ps.push(db.contents.where("pid").equals(id).modify(largeData))
      }
      await Promise.all(ps)
      // console.log("same url, update")
      return
    }

    // @ts-ignore
    const id = await db.pages.add(indexData)

    // @ts-ignore
    await db.contents.add({ pid: id, ...largeData })
    // @ts-ignore
    // console.log("db saved: ", id)
  }).catch((e) => {
    alert(e.stack || e)
  })
}

// a search method that give the most possible result
function findAndSort(prefixes, field): Promise<any[]> {
  // @ts-ignore
  return db.transaction("r", db.contents, db.pages, function* () {
    // Parallell search for all prefixes - just select resulting primary keys

    const results = yield Dexie.Promise.all(
      prefixes.map((prefix) =>
        // @ts-ignore
        db.contents.where(field).startsWith(prefix).primaryKeys()
      )
    )

    // faltten the array => sort => count

    const flatten = results.flat()
    const sorted = flatten.sort()
    // count frequency of each primary key
    const counts = sorted.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    }, {})
    // sort by counts
    let sortedCounts = Object.keys(counts).sort((a, b) => {
      return counts[b] - counts[a]
    })
    let intArray = [] as number[]
    sortedCounts.forEach((e) => {
      intArray.push(parseInt(e.toString()))
    })

    // if bookmarked priority option is enabled, then sort by bookmark status
    const userOptions = store.getState()
    if (userOptions.showOnlyBookmarkedResults === true) {
      // console.log("show only bookmarked results")

      if (intArray.length > 300) {
        // @ts-ignore
        const bookmarked = yield db.pages
          .where("isBookmarked")
          .equals(1)
          .primaryKeys()
        const set = new Set(bookmarked)
        intArray = intArray.filter((e) => set.has(e))
      } else {
        // get from db where id is in intarray and isBookmarked is true
        // @ts-ignore
        intArray = yield db.pages
          .where(":id")
          .anyOf(intArray)
          .filter((e) => {
            return e.isBookmarked === true
          })
          .primaryKeys()
      }
    }
    // if the result is too long, cut some
    if (intArray.length > userOptions.maxResults) {
      intArray = intArray.slice(0, userOptions.maxResults)
    }

    // @ts-ignore
    return yield db.pages.bulkGet(intArray)
  })
}

async function searchString(search: string, type: string) {
  if (!search) {
    return []
  }
  const splitSearch = wordSplit(search)
  const titleResult = await findAndSort(splitSearch, "titleWords")
  // console.log("titleResult", titleResult)
  // @ts-ignore
  if (titleResult && titleResult.length > 0) {
    if (type === "short") {
      return titleResult
    }
  }
  const wordResult = await findAndSort(splitSearch, "contentWords")
  // console.log("wordResult", wordResult)
  // @ts-ignore
  if (titleResult && titleResult.length > 0) {
    if (wordResult && wordResult.length > 0) {
      const a = [...titleResult, ...wordResult]
      // deleted duplicated result identified by id in array a
      const aa = new Set(a.map((item) => item.id))
      let y = []
      aa.forEach((e) => {
        y.push(a.find((item) => item.id === e))
      })
      return y
    }
    return titleResult
  } else if (wordResult && wordResult.length > 0) {
    return wordResult
  }
  // console.log("precise search no match")

  return []
}

// ============================================================================================

// ============================================================================================
function sendToRemote(data: PageData) {
  ;(async () => {
    const postData = {
      url: data.url,
      title: data.title,
      date: data.date,
      isBookmarked: data.isBookmarked
    }
    if (isWeibo(postData.url)) {
      const encode = getWeiboEncode(postData.url)
      postData.url = "https://m.weibo.cn/status/" + mid.decode(encode)
    }
    // console.log("sendToRemote", postData)

    const userOptions = store.getState()
    // console.log("sendToRemote options", userOptions.remoteStoreURL, userOptions)
    if (
      !userOptions.remoteStoreURL ||
      userOptions.remoteStoreURL === "" ||
      userOptions.remoteStoreURL === " "
    ) {
      // console.log("no remote store url")
      return
    }
    const rawRes = await fetch(userOptions.remoteStoreURL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
    })
    // const res = await rawRes.json();
    // console.log(rawRes)
  })()
}

// ============================================================================================

// ============================================================================================
// word split functions
function wordSplit(str: string): string[] {
  if (!str || typeof str !== "string") {
    return []
  }
  str = str.toLowerCase()
  const result = cut_for_search(str, true)
  // console.log(result)
  const a = result
    .map((e) => {
      return palindrome(e)
    })
    .filter((e) => e !== "" && e !== null && e !== undefined)
  return a

  // if (judgeChineseChar(str)) {
  //   console.log("chinese char")
  //   // console.time("seg")

  //   // console.timeEnd("seg")
  //   // const result = segmentit.doSegment(str)
  //   const result = cut_for_search(str, true);
  //   console.log(result)
  //   const a = result
  //     .map((e) => {
  //       return palindrome(e)
  //     })
  //     .filter((e) => e !== "" && e !== null && e !== undefined)
  //   return a
  // } else if (judgeJapaneseChar(str)) {
  //   const result = Array.from(
  //     new Intl.Segmenter("js-JP", { granularity: "word" }).segment(str)
  //   )
  //   const a = result.filter((e) => e.isWordLike)
  //   const b = a.map((e) => {
  //     return palindrome(e.segment)
  //   })
  //   const c = b.filter((e) => e !== "" && e !== null && e !== undefined)

  //   return c
  // } else {
  //   const result = Array.from(
  //     new Intl.Segmenter("en", { granularity: "word" }).segment(str)
  //   )
  //   const a = result.filter((e) => e.isWordLike)
  //   const b = a.map((e) => {
  //     return palindrome(e.segment)
  //   })
  //   const c = b.filter((e) => e !== "" && e !== null && e !== undefined)

  //   return c
  // }
}

function judgeChineseChar(str: string) {
  const reg = /[\u4E00-\u9FA5]/g
  const a = reg.test(str)

  return a
}

function judgeJapaneseChar(str: string) {
  const reg = /[\u3040-\u30FF]/g
  const a = reg.test(str)
  return a
}

function palindrome(str: string): string {
  const arr = str.replace(
    /[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g,
    ""
  )
  return arr
}
// ============================================================================================
