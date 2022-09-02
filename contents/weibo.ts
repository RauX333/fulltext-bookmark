import type { PlasmoContentScript } from "plasmo"
import debounce from "~lib/debounce"
// import {truncateText} from "~/lib/util"
// import "../style.css"
import icon512 from "data-base64:~assets/icon512.png"
export const config: PlasmoContentScript = {
  matches: ["https://weibo.com/*"],
  // run_at: "document_start",
  all_frames: false
}

console.log("weibo content script")


const storageKey = 'fulltextbookmark';
// get user options to decide whether to show search result
chrome.storage.local.get([`persist:${storageKey}`], (items) => {
    if(items[`persist:${storageKey}`]) {
      // console.log("persist result",items[`persist:${storageKey}`])
      const rootParsed = JSON.parse(items[`persist:${storageKey}`]);
      console.log(rootParsed)
    }  else {
      // console.log("no persist result")
    }
    // TODO:judge if show save btn in weibo page
    if(document.readyState === 'complete') {
        console.log("1")
        addBtn()
        window.onscroll = function(){
            console.log("scroll")
            debouncAddBtn()
        }
       
      } else {
        document.onreadystatechange = async function () {
          if (document.readyState == "complete") {
            console.log("2")
            addBtn()
            window.onscroll = function(){
                console.log("scroll")
                debouncAddBtn()
            }
          }
        }
      }
    
  });

  const debouncAddBtn = debounce(async()=>{console.log("add btn");await addBtn()},300,{leading:true,trailing:true})

  async function addBtn () {
   const feedCard = await findFeedCard()
   console.log(feedCard)
    if(feedCard.length > 0) {
        feedCard.forEach(e=>{
            if(e.querySelector("#fulltext_bookmark_search-btn")) {
                console.log("aaa")
                return
            }
            const urlA = e.querySelector("a[class^='head-info_time']")
            console.log(urlA)
            let headInfo = e.querySelector("div[class*='toolbar_main']")
            if(!headInfo) {
                headInfo = e.querySelector("div[class*='head-info_info']")
            }
            try {
                headInfo.appendChild(makeBtn(urlA.href,"111","222"))
            } catch {

            }
            
        })
    }
    
  }

  async function findFeedCard(){
    const a = await waitForElements("div[class^='Feed_body']")
    const feedCard = document.querySelectorAll("div[class^='vue-recycle-scroller__item-view']");
    return feedCard
  }

  function makeBtn(url:string, content:string, title:string) {
    const btn = document.createElement('btn');
    // btn.innerText = 'fulltext';
    const ic = document.createElement('img');
    ic.src = icon512;
    ic.style.width = '10px';
    ic.style.height = '10px';
    btn.appendChild(ic);
    btn.id = 'fulltext_bookmark_search-btn';
    // make btn round
    btn.style.borderRadius = '100%';
    btn.style.width = '20px';
    btn.style.height = '20px';
    btn.style.backgroundColor = '#fff';
    // btn.style.paddingTop = "5px"
    // btn.style.background="transparent";
    btn.style.border="none";
    btn.style.color="#939393";
    btn.style.fontSize = "0.5rem"
    // btn.style.marginLeft="10%";
    btn.onmouseover = function() {
        btn.style.backgroundColor="#fff2e5";
    }
    btn.onmouseout = function() {
        btn.style.backgroundColor="#fff";
    }
    btn.onclick = function () {
      console.log("archive",url,content,title)
    }

    return btn
  }


  const waitForElements = (selector) => {
    return new Promise((resolve) => {
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
    })
  }