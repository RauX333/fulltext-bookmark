export function truncateText (text: string, maxLength: number) {
    if(!text) {
      return ""
    }
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "..."
    }
    return text
  }


  export  function byteConvert (bytes) {
    if (isNaN(bytes)) {
        return '';
    }
    var symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var exp = Math.floor(Math.log(bytes)/Math.log(2));
    if (exp < 1) {
        exp = 0;
    }
    var i = Math.floor(exp / 10);
    bytes = bytes / Math.pow(2, 10 * i);
 
    if (bytes.toString().length > bytes.toFixed(2).toString().length) {
        bytes = bytes.toFixed(2);
    }
    return bytes + ' ' + symbols[i];
};


export function getBookmarkUrl (urlResult) {
  let removedURLs = []
  if(urlResult.length>0) {
    urlResult.forEach(e=>{
      if(e.children && e.children.length>0){
        removedURLs = removedURLs.concat(getBookmarkUrl(e.children))
      }else {
        removedURLs.push(handleUrlRemoveHash(e.url))
      }
    })
  } else {
    if(urlResult.node.children) {
      removedURLs = removedURLs.concat(getBookmarkUrl(urlResult.node.children))
    } else {
      removedURLs.push(handleUrlRemoveHash(urlResult.node.url))
    }
  }
  return removedURLs
}

export function handleUrlRemoveHash (url) {
  const urlSplit = url.split("#")
  return urlSplit[0]
}

// get url vars
export function getUrlVars  (url) {
  const vars = {}
  const parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
    vars[key] = decodeURI(value)
  }).split("?")
  return vars
}

export function isGoogle (url) {
  const reg = /^https:\/\/www.google.com\/search\/*/g
  // console.log("reg",reg.test(thisURL))
  return reg.test(url)
}
// regexp jusge if thisURL is https://*.bing.com/*
export function isBing (url) {
  const reg = /^https:\/\/cn.bing.com\/search\/*/g
  return reg.test(url)
 
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