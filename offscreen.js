// send a message every 20 sec to service worker
setInterval(() => {
    // console.log("aaaa")
    chrome.runtime.sendMessage({ command:"keepAlive",keepAlive: true });
  }, 20000);