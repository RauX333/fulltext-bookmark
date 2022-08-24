import Dexie from "dexie"
import { Segment, useDefault } from "segmentit"

export {}
// Dexie.delete("PageDatabase")
const db = new Dexie("PageDatabase")
db.version(1).stores({
  pages:
    "++id,url,content,*contentWords,title,*titleWords,date,pageId,isBookmarked"
})
// @ts-ignore
db.pages.hook("creating", function (primKey, obj, trans) {
  if (typeof obj.content == "string") {
    obj.contentWords = wordSplit(obj.content)
  }
  if (typeof obj.title == "string") {
    obj.titleWords = wordSplit(obj.title)
  }
})
// @ts-ignore
db.pages.hook("updating", function (mods, primKey, obj, trans) {
  if (mods.hasOwnProperty("content")) {
    console.log(11111)
    // "message" property is being updated
    if (typeof mods.content === "string") {
      console.log(22222)
      // "message" property was updated to another valid value. Re-index messageWords:
      return { contentWords: wordSplit(mods.content) }
    } else {
      console.log(33333)
      // "message" property was deleted (typeof mods.message === 'undefined') or changed to an unknown type. Remove indexes:
      return { contentWords: [] }
    }
  }
  if (mods.hasOwnProperty("title")) {
    console.log(11111)
    // "message" property is being updated
    if (typeof mods.title === "string") {
      console.log(22222)
      // "message" property was updated to another valid value. Re-index messageWords:
      return { titleWords: wordSplit(mods.title) }
    } else {
      console.log(33333)
      // "message" property was deleted (typeof mods.message === 'undefined') or changed to an unknown type. Remove indexes:
      return { titleWords: [] }
    }
  }
})
db.open()

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
        const result = await searchStringWithAllMatch(message.search)
        console.log("search result", result)
        const matchedFirst = result[0]
        sendResponse({
          title: matchedFirst.title,
          url: matchedFirst.url,
          date: matchedFirst.date
        })
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
        bookmark(resp.pageId)
      }
    )
  })
})

const searchStringWithGrossMatch = async (search: string) => {
  console.log("gross search")
  if (!search) {
    return []
  }

  const splitSearch = wordSplit(search)

  // search title
  // @ts-ignore
  const titleSearch = await db.pages
    .where("titleWords")
    .startsWithAnyOf(splitSearch)
    .distinct()
    .toArray()
  if (titleSearch && titleSearch.length > 0) {
    return titleSearch
  }

  // search content
  // @ts-ignore
  const wordSearch = await db.pages
    .where("contentWords")
    .startsWithAnyOf(splitSearch)
    .distinct()
    .toArray()
  if (wordSearch && wordSearch.length > 0) {
    return wordSearch
  }
  // no match
  console.log("gross search no match")
  return []
}

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
      console.log("existed,update")
      // @ts-ignore
      await db.pages.update(id, data)
      // @ts-ignore
      console.log(await db.pages.where({ id: id }).toArray())
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
function preciseFind(prefixes, filed): Promise<any[]> {
  // @ts-ignore
  return db.transaction("r", db.pages, function* () {
    // Parallell search for all prefixes - just select resulting primary keys
    const results = yield Dexie.Promise.all(
      prefixes.map((prefix) =>
        // @ts-ignore
        db.pages.where(filed).startsWith(prefix).primaryKeys()
      )
    )
    // TODO: faltten the array => sort => count


    // TODO: if bookmarked priority option is enabled, then sort by bookmark status
    
    // Intersect result set of primary keys
    const reduced = results.reduce((a, b) => {
      const set = new Set(b)
      return a.filter((k) => set.has(k))
    })
    // Finally select entire documents from intersection
    // @ts-ignore
    return yield db.pages.where(":id").anyOf(reduced).toArray()
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
  // @ts-ignore
  if (wordResult && wordResult.length > 0) {
    return wordResult
  }
  console.log("precise search no match")
  return searchStringWithGrossMatch(search)
}

// // Sample use of the function:
// find(['animal', 'food', 'nutrition']).then(docs => {
//   console.table(docs);
// }).catch (err => {
//   console.error (err.stack || err);
// });
