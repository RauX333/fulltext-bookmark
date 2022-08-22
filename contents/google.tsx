import type { PlasmoContentScript } from "plasmo"

import "../style.css"

export const config: PlasmoContentScript = {
  matches: ["https://www.google.com/*"],
  run_at: "document_start",
}

window.addEventListener("load", () => {
  console.log("content script loaded")

  // insert mout-point of the custom result box
  const originContainer = document.getElementById("center_col")
  const newEl = document.createElement("div")
  newEl.setAttribute("id", "mount-point")
  newEl.style.height = "130px"
  newEl.style.marginTop = "5px"
  newEl.style.marginBottom = "15px"
  originContainer.insertBefore(newEl, originContainer.firstChild)

  // get google search bar value
  const searchInput = document.querySelector("[name='q']");
  // @ts-ignore
  const s = searchInput.value
  console.log("get google search input value: ",s);
  chrome.runtime
    .sendMessage({ command: "google_result", search:s })
    .then((v) => {
      console.log(`google_result message response: ${v}`)
    })
})

// set root container
export const getRootContainer = () => {
  return document.querySelector("#mount-point")
}
// export const getMountPoint = async () => document.querySelector("#mount-point")
// export const getStyle = () => {
//   const style = document.createElement("style")
//   style.textContent = cssText
//   return style
// }

const PlasmoPricingExtra = () => {
  return (
    <div className="border-[1px] rounded-md border-gray-300 flex flex-col p-4 gap-[5px] justify-start">
      <span className="text-lg text-blue-400 tooltip" data-tip="hello">
        <a
          href="http://www.mafengwo.cn/i/953039788.html"
          target="_blank"
          rel="noopener noreferrer">
          {truncateText(
            "斯里兰卡 | 锡兰一梦十日游，环线七城行摄记,斯里兰卡自助游攻略锡兰一梦十日游，环线七城行摄记,斯里兰卡自助游攻略锡兰一梦十日游，环线七城行摄记,斯里兰卡自助游攻略",
            35
          )}
        </a>
      </span>
      <span className="text-sm text-black">
        <p>
          {truncateText(
            "http://www.mafengwo.cn/i/9530397.htmlhttp://www.mafengwo.cn/i/9530397.htmlhttp://www.mafengwo.cn/i/9530397.html",
            60
          )}
        </p>
      </span>
      <span className="text-sm text-gray-500">
        2019-06-01 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;by fulltext-bookmark{" "}
      </span>
    </div>
  )
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "..."
  }
  return text
}

export default PlasmoPricingExtra
