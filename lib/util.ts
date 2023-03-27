
import { RecursiveCharacterTextSplitter,Document } from '~lib/textsplitter'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3600,
  chunkOverlap: 200
})

export async function textSplitterArray(pageArray) {
  const docs = pageArray.map((page) => {
    return new Document({
      pageContent: page.content,
      metadata: {
        title: page.title,
        url: page.url,
        id:page.id,
        date:page.date,
        isBookmarked:page.isBookmarked
      }
    })
  })
  const docOutput = splitter.splitDocuments(docs);
  return docOutput
}
export async function textSplitter(page) {
  const doc = new Document({
      pageContent: page.content,
      metadata: {
        title: page.title,
        url: page.url,
        id:page.id,
        date:page.date,
        isBookmarked:page.isBookmarked
      }
    })

  const docOutput = splitter.splitDocuments([doc]);
  return docOutput
}

export function truncateText(text: string, maxLength: number) {
  if (!text) {
    return ""
  }
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "..."
  }
  return text
}

export function vectorToBlob(arr) {
  const typedarr = new Float64Array(arr)
  const buffer = typedarr.buffer
  const blob = new Blob([buffer])
  return blob
}

export function blobToVector(blob) {
  let reader = new FileReader()
  reader.readAsArrayBuffer(blob)
  reader.onload = function (e) {
    console.log(new Float64Array(reader.result))
    return new Float64Array(reader.result)
  }
}

export function byteConvert(bytes) {
  if (isNaN(bytes)) {
    return ""
  }
  var symbols = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  var exp = Math.floor(Math.log(bytes) / Math.log(2))
  if (exp < 1) {
    exp = 0
  }
  var i = Math.floor(exp / 10)
  bytes = bytes / Math.pow(2, 10 * i)

  if (bytes.toString().length > bytes.toFixed(2).toString().length) {
    bytes = bytes.toFixed(2)
  }
  return bytes + " " + symbols[i]
}

export function getBookmarkUrl(urlResult) {
  let removedURLs = []
  if (urlResult.length > 0) {
    urlResult.forEach((e) => {
      if (e.children && e.children.length > 0) {
        removedURLs = removedURLs.concat(getBookmarkUrl(e.children))
      } else {
        removedURLs.push(handleUrlRemoveHash(e.url))
      }
    })
  } else {
    if (urlResult.node.children) {
      removedURLs = removedURLs.concat(getBookmarkUrl(urlResult.node.children))
    } else {
      removedURLs.push(handleUrlRemoveHash(urlResult.node.url))
    }
  }
  return removedURLs
}

export function handleUrlRemoveHash(url) {
  const urlSplit = url.split("#")
  return urlSplit[0]
}

// get url vars
export function getUrlVars(url) {
  const vars = {}
  const parts = url
    .replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
      vars[key] = decodeURI(value)
    })
    .split("?")
  return vars
}

export function isGoogle(url) {
  const reg = /^https:\/\/www.google.com\/search\/*/g
  // console.log("reg",reg.test(thisURL))
  return reg.test(url)
}
// regexp jusge if thisURL is https://*.bing.com/*
export function isBing(url) {
  const reg = /^https:\/\/cn.bing.com\/search\/*/g
  const reg2 = /^https:\/\/www.bing.com\/search\/*/g
  return reg.test(url) || reg2.test(url)
}

export const isBaidu = (url) => {
  const reg = /^https:\/\/www.baidu.com\/*/g
  return reg.test(url)
}

export const isWeibo = (url) => {
  const reg = /^https:\/\/weibo.com\/[0-9]+\/[A-Za-z0-9]+/g
  return reg.test(url)
}

export const getWeiboEncode = (url) => {
  const urlSplit = url.split("/")
  return urlSplit[4]
}
