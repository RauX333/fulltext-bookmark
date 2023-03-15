import { createRef, useCallback, useEffect, useMemo, useState } from "react"
import Toggle from "react-toggle"

import { truncateText } from "~/lib/util"
import debounce from "~lib/debounce"
import useDebounce from "~lib/useDebounce"

// import debounce from "~lib/simpleDebounce"
import "~style.css"

export const SearchView = () => {
  const [searchString, setSearchString] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [pinyinStatus, setPinyinStatus] = useState(0)
  const [filter, setFilter] = useState(1) // 0:relevancy 1:recent 2:old 3:bookmark

  const debouncedSearchTerm = useDebounce(searchString, 500);
  const sendSearch = () => {
    // console.log("====================================")
    // console.log("send search", searchString)
    // console.log("====================================")
    if (searchString === "" || searchString == " ") {
      return
    }
    chrome.runtime
      .sendMessage({ command: "popsearch", search: searchString })
      .then((v) => {
        setSearchResults(
          v.map((e, index) => {
            e.relevancy = index
            return e
          }).sort((a, b) => {
            return b.date - a.date
          })
        )
      })
  }
  useEffect(() => {
    if (pinyinStatus === 0 ) {
      // console.log("====================================")
      // console.log("debounce send search", debouncedSearchTerm)
      // console.log("====================================")
      sendSearch()
    }
  }, [debouncedSearchTerm])
  const handleChangeFilter = (value) => {
    console.log("---", value)
    if (value === filter) {
      return
    }
    switch (value) {
      case 0:
        setSearchResults(
          searchResults.sort((a, b) => {
            return b.relevancy - a.relevancy
          })
        )
        break
      case 1:
        // sort by date, recent
        setSearchResults(
          searchResults.sort((a, b) => {
            return b.date - a.date
          })
        )
        break
      case 2:
        // sort by date, old
        setSearchResults(
          searchResults.sort((a, b) => {
            return a.date - b.date
          })
        )
        break
      case 3:
        // sort by bookmark
        setSearchResults(
          searchResults.sort((a, b) => {
            return a.isBookmarked === b.isBookmarked
              ? 0
              : a.isBookmarked
              ? -1
              : 1
          })
        )
        break
      default:
        break
    }
    setFilter(value)
  }

  const handleSearchInputChange = (e) => {
    setSearchString(e.target.value)
    // if (pinyinStatus === 0) {
    //   console.log('====================================');
    //   console.log("debounce send search");
    //   console.log('====================================');
    //   debounceSendSearch()
    // }
  }
  const handleSearchInputBlur = (e) => {
    // console.log("====================================")
    // console.log("blur send search")
    // console.log("====================================")
    sendSearch()
  }
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendSearch()
    }
  }

  // const debounceSendSearch = debounce(sendSearch, 500, false)

  const onHandleJumpToOptionsPage = () => {
    chrome.runtime.openOptionsPage(() => {
      // console.log("open options page")
    })
  }

  const searchinputRef = createRef<any>()
  useEffect(() => {
    searchinputRef.current.focus()
  }, [])
  return (
    <div className="w-96 p-4 gap-4 h-[32rem] flex flex-col overflow-hidden">
      <div className="flex flex-row justify-between">
        <span className="text-left">
          {chrome.i18n.getMessage("popupSearchTitle")}
        </span>

        <a
          className="text-right text-blue-500"
          href=""
          onClick={onHandleJumpToOptionsPage}>
          {chrome.i18n.getMessage("settingPageNavSettings")}
        </a>
      </div>

      <div>
        <input
          ref={searchinputRef}
          type="text"
          value={searchString}
          onChange={(e) => {
            handleSearchInputChange(e)
          }}
          onBlur={(e) => {
            handleSearchInputBlur(e)
          }}
          onKeyPress={handleKeyPress}
          onCompositionStart={() => {
            setPinyinStatus(1)
          }}
          onCompositionEnd={() => {
            // console.log("====================================")
            // console.log("composition end")
            // console.log("====================================")
            setPinyinStatus(0)
            // sendSearch()
          }}
          className="outline-none w-full h-10 px-4 rounded-lg"
        />
      </div>

      <div className="flex flex-row justify-evenly">
        <span
          className={
            filter === 1 ? "text-blue-500 cursor-pointer" : " cursor-pointer"
          }
          onClick={() => {
            handleChangeFilter(1)
          }}>
          {chrome.i18n.getMessage("popupFilterRecent")}
        </span>
        <span
          className={
            filter === 2 ? "text-blue-500 cursor-pointer" : "cursor-pointer"
          }
          onClick={() => {
            handleChangeFilter(2)
          }}>
          {chrome.i18n.getMessage("popupFilterOldest")}
        </span>
        <span
          className={
            filter === 0 ? "text-blue-500 cursor-pointer" : "cursor-pointer"
          }
          onClick={() => {
            handleChangeFilter(0)
          }}>
          {chrome.i18n.getMessage("popupFilterRelevancy")}
        </span>
        <span
          className={
            filter === 3 ? "text-blue-500 cursor-pointer" : "cursor-pointer"
          }
          onClick={() => {
            handleChangeFilter(3)
          }}>
          {chrome.i18n.getMessage("popupFilterBookmarks")}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-2 overflow-y-auto overflow-x-hidden">
        {searchResults.map((v, index) => {
          return (
            <div className="text-blue-500" key={index}>
              <a
                href={v.url}
                onClick={() => {
                  chrome.tabs.create({ url: v.url })
                }}>
                {truncateText(v.title, 30)}
              </a>
              {v.isBookmarked && <i className="ml-2">⭐</i>}
              <p className="text-sm text-gray-300">{truncateText(v.url, 40)}</p>
              <p className="text-sm text-gray-300">
                {new Date(v.date).toLocaleDateString()}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
