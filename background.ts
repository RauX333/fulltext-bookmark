import Dexie from "dexie"
import { Segment, useDefault } from "segmentit"
import { persistor, store } from "~store";
export {};
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
  pages:
    "++id,url,*contentWords,title,*titleWords,date,pageId,isBookmarked"
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
// ====================================================================================================

interface PageData {
  pageId: string
  url: string
  content: string
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case "store":
      console.log(
        `${message.pageId} received temp store message from ${sender.tab.id}`
      )
      // isBookmarked false
      message.data.isBookmarked = false
      // save to database
      ;(async () => {
        await saveToDatabase({ ...message.data, pageId: message.pageId })
        sendResponse("ok")
      })()
      return true
    case "google_result":
      console.log("google result", message.search)
      ;(async () => {
        const userOptions = store.getState()
        console.log("ss oprion", userOptions)
        const result = await searchStringWithAllMatch(message.search)
        console.log("search result", result)
        if(result && result.length > 0){
          const matchedFirst = result[0]
        sendResponse({
          title: matchedFirst.title || "",
          url: matchedFirst.url || "",
          date: matchedFirst.date || 0,
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
    default:
      sendResponse("invalid command")
  }
})

chrome.bookmarks.onCreated.addListener((id, bm) => {
  console.log("bookmarks created:", id, bm)
  chrome.tabs.query({ active: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { command: "bookmark", data: "create" },
      (resp) => {
        // console.log(resp)
        // change archive status in db
        if (resp.stored === true) {
          bookmark(resp.pageId)
        } else {
          console.log("bookmark not stored")
          resp.data.isBookmarked = true
          ;(async () => {
            await saveToDatabase({ ...resp.data, pageId: resp.pageId })
          })()
        }
      }
    )
  })
})

const bookmark = (pageId: string) => {
  // @ts-ignore
  db.transaction("rw", db.pages, async () => {
    // @ts-ignore
    const existed = await db.pages.where("pageId").equals(pageId).first()
    if (existed && existed.id) {
      // @ts-ignore
      await db.pages.update(existed.id, { isBookmarked: true })
    }
  })
}

const saveToDatabase = async (data: PageData) => {
  data.contentWords = wordSplit(data.content)
  data.titleWords = wordSplit(data.title)
  delete data.content
  // @ts-ignore
  db.transaction("rw", db.pages, async () => {
    // @ts-ignore
    const existedId = await db.pages.where("pageId").equals(data.pageId).first()
    if (existedId && existedId.id) {
      const id = existedId.id
      console.log("existed,update")
      // @ts-ignore
      await db.pages.update(id, data)
      return
    }
    // @ts-ignore
    const existed = await db.pages.where("url").equals(data.url).first()
    if (existed && existed.id) {
      const id = existed.id
      // @ts-ignore
      await db.pages.update(id, data)
      // @ts-ignore
      console.log("existed,update",await db.pages.where({ id: id }).toArray())
      return
    }

    // @ts-ignore
    const id = await db.pages.add(data)
    // @ts-ignore
    console.log("db saved: ", id, await db.pages.where({ id: id }).toArray())
  }).catch((e) => {
    alert(e.stack || e)
  })
}

const wordSplit = (str: string): string[] => {
  console.log("start word split")
  str = str.toLowerCase()
  const segmentit = useDefault(new Segment())
  if (judgeChineseChar(str)) {
    console.log("chinese char")
    const result = segmentit.doSegment(str)
    return result
      .map((e) => {
        return palindrome(e.w)
      })
      .filter((e) => e !== "" && e !== null && e !== undefined)
  } else if (judgeJapaneseChar(str)) {
    const result = Array.from(
      new Intl.Segmenter("js-JP", { granularity: "word" }).segment(str)
    )
    const a = result.filter((e) => e.isWordLike)
    const b = a.map((e) => {
      return palindrome(e.segment)
    })
    const c = b.filter((e) => e !== "" && e !== null && e !== undefined)

    return c
  } else {
    const result = Array.from(
      new Intl.Segmenter("en", { granularity: "word" }).segment(str)
    )
    const a = result.filter((e) => e.isWordLike)
    const b = a.map((e) => {
      return palindrome(e.segment)
    })
    const c = b.filter((e) => e !== "" && e !== null && e !== undefined)
    return c
  }
}

const judgeChineseChar = (str: string) => {
  const reg = /[\u4E00-\u9FA5]/g
  return reg.test(str)
}

const judgeJapaneseChar = (str: string) => {
  const reg = /[\u3040-\u30FF]/g
  return reg.test(str)
}

function palindrome(str: string): string {
  const arr = str.replace(
    /[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g,
    ""
  )
  return arr
}

// a search method that give the most possible result
function preciseFind(prefixes, field): Promise<any[]> {
  // @ts-ignore
  return db.transaction("r", db.pages, function* () {
    // Parallell search for all prefixes - just select resulting primary keys
    const results = yield Dexie.Promise.all(
      prefixes.map((prefix) =>
        // @ts-ignore
        db.pages.where(field).startsWith(prefix).primaryKeys()
      )
    )
    // TODO: faltten the array => sort => count
    
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
    if(userOptions.showOnlyBookmarkedResults === true){
      console.log("show only bookmarked results")
      
      if(intArray.length > 300){
        // @ts-ignore
        const bookmarked = yield db.pages.where("isBookmarked").equals(1).primaryKeys();
        const set = new Set(bookmarked)
        intArray = intArray.filter(e => set.has(e))
      } else {
        // get from db where id is in intarray and isBookmarked is true
        // @ts-ignore
        intArray = yield db.pages.where(":id").anyOf(intArray).filter(e=>{
          return e.isBookmarked === true
        }).primaryKeys()
      }

    }
    // if the result is too long, cut some
    if (intArray.length > userOptions.maxResults) {
      intArray = intArray.slice(0, userOptions.maxResults)
    }


    // @ts-ignore
    return yield yield db.pages.bulkGet(intArray)
  })
}

const searchStringWithAllMatch = async (search: string) => {
  console.log("precise search")
  if (!search) {
    return []
  }
  const splitSearch = wordSplit(search)
  const titleResult = await preciseFind(splitSearch, "titleWords")
  // @ts-ignore
  if (titleResult && titleResult.length > 0) {
    return titleResult
  } 
  const wordResult = await preciseFind(splitSearch, "contentWords")
  console.log("wordResult",wordResult)
  // @ts-ignore
  if (wordResult && wordResult.length > 0) {
    return wordResult
  }
  console.log("precise search no match")
  return []
}

async function showEstimatedQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimation = await navigator.storage.estimate();
    console.log(`Quota: ${estimation.quota}`);
    console.log(`Usage: ${estimation.usage}`);
  } else {
    console.error("StorageManager not found");
  }
}
