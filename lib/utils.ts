
export function isMatchURL(patterns: string[], url: string): boolean {
    if (!patterns || patterns.length < 1) {
      return false;
    }
    for (let i = 0; i < patterns.length; i++) {
      const re = new RegExp(patterns[i]);
      if (!re) {
        continue;
      }
      if (re.test(url)) {
        // console.log("exclude url:", url)
        return true;
      }
    }
    // console.log("not exclude url:", url)
    return false;
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
export function deleteAfterSources(str: string): string {
  const index = str.indexOf("SOURCES:")
  if (index === -1) {
    return str
  }
  return str.substring(0, index)
}

export function findNearestArrays(arrayIndex: number[][], queryArray: number[], N: number): number[] {
  const distances = []
  for (let i = 0; i < arrayIndex.length; i++) {
    const distance = cosineDistance(arrayIndex[i], queryArray)
    distances.push({ index: i, distance })
  }
  distances.sort((a, b) => b.distance - a.distance)
  const nearestArrays = []
  for (let i = 0; i < N; i++) {
    if (distances[i]) {
      nearestArrays.push(distances[i].index)
    }
  }
  return nearestArrays
}


export function cosineDistance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) {
    // console.log(arr1,arr2)
    throw new Error("Arrays must have the same length");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < arr1.length; i++) {
    dotProduct += arr1[i] * arr2[i];
    normA += arr1[i] * arr1[i];
    normB += arr2[i] * arr2[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }
  return dotProduct / denominator;
}


  export function vectorToBlob(arr) {
    const typedarr = new Float64Array(arr)
    const buffer = typedarr.buffer
    const blob = new Blob([buffer])
    return blob
  }
  
  export async function blobToVector(blob) {
    const arrayBuffer = new Uint8Array(await (blob.arrayBuffer()));
    return Array.from(new Float64Array(arrayBuffer.buffer));
  }
  
  export function byteConvert(bytes) {
    if (isNaN(bytes)) {
      return ""
    }
    const symbols = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    let exp = Math.floor(Math.log(bytes) / Math.log(2))
    if (exp < 1) {
      exp = 0
    }
    const i = Math.floor(exp / 10)
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


  export function judgeChineseChar(str: string) {
    const reg = /[\u4E00-\u9FA5]/g
    const a = reg.test(str)
  
    return a
  }
  
  export function judgeJapaneseChar(str: string) {
    const reg = /[\u3040-\u30FF]/g
    const a = reg.test(str)
    return a
  }


