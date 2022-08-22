import { useState } from "react"

import "./style.css"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div className="flex flex-col p-4">
      <h2 className="text-red-500">
        Welcome to your{" "}
        <a href="https://www.plasmo.com" target="_blank">
          Plasmo
        </a>{" "}
        Extension!
      </h2>
      <button
        className=""
        onClick={(e) => {
          chrome.runtime.openOptionsPage(() => {
            console.log("openOptionsPage")
          })
        }}>
        {" "}
        Options{" "}
      </button>
      <input onChange={(e) => setData(e.target.value)} value={data} />
      <a href="https://docs.plasmo.com" target="_blank">
        View Docs
      </a>
    </div>
  )
}

export default IndexPopup
