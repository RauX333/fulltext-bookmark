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