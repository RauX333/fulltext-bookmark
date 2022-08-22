import Dexie from "dexie"
import { Segment, useDefault } from "segmentit"

export {}
// Dexie.delete('PageDatabase');
const db = new Dexie("PageDatabase")
db.version(1).stores({
  pages: "++id,url,*content,title,date,pageId,isBookmarked"
})

interface PageData {
  pageId: string
  url: string
  content: string | string[]
  title: string
  date: number
  isBookmarked?: boolean
}

interface Message {
  command: string
  data: PageData
  pageId: string
}

chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    switch (message.command) {
      case "store":
        console.log(
          `${message.pageId} received temp store message from ${sender.tab.id}`
        )

        // isBookmarked false
        message.data.isBookmarked = false
        // wordsplit
        message.data.content = wordSplit(message.data.content as string)
        // save to database
        await saveToDatabase({ ...message.data, pageId: message.pageId })

        sendResponse("ok")
      case "google_result":
        console.log("google result",message.search)
        sendResponse("ok")
      default:
        sendResponse("invalid command")
    }
  }
)

chrome.bookmarks.onCreated.addListener((id, bm) => {
  console.log("bookmarks created:", id, bm)
  chrome.tabs.query({ active: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { command: "bookmark", data: "create" },
      (resp) => {
        console.log(resp)
        // change archive status in db
        bookmark(resp.pageId)
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
      return
    }

    // @ts-ignore
    const id = await db.pages.add(data)
    console.log("db saved: ", id)
  }).catch((e) => {
    alert(e.stack || e)
  })
}

const wordSplit = (str: string): string[] => {
  const segmentit = useDefault(new Segment())
  if (judgeChineseChar(str)) {
    const result = segmentit.doSegment(str)
    return result.map((e) => {
      return e.w
    })
  } else if (judgeJapaneseChar(str)) {
    const result = Array.from(
      new Intl.Segmenter("js-JP", { granularity: "word" }).segment(str)
    )
    return result.map((e) => {
      return e.isWordLike && e.segment
    })
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
