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
  const [isLoading, setIsLoading] = useState(0)
  const debouncedSearchTerm = useDebounce(searchString, 300)
  const sendSearch = () => {
    if (searchString === "" || searchString == " ") {
      return
    }
    setIsLoading(1)
    chrome.runtime
      .sendMessage({ command: "popsearch", search: searchString })
      .then((v) => {
        if (v && v.length>0) {
          setSearchResults(
            v
              .map((e, index) => {
                e.relevancy = index
                return e
              })
              .sort((a, b) => {
                return b.date - a.date
              })
          )
          setIsLoading(2)
        } else {
          setIsLoading(3)
        }
        
      })
  }

  useEffect(() => {
    if (pinyinStatus === 0) {
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
  }
  const handleSearchInputBlur = (e) => {
    sendSearch()
  }
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendSearch()
    }
  }

  const searchinputRef = createRef<any>()
  useEffect(() => {
    searchinputRef.current.focus()
  }, [])
  return (
    <div className="w-96 p-4 gap-4 h-[32rem] flex flex-col overflow-hidden">
      <div>
        <input
          ref={searchinputRef}
          placeholder={chrome.i18n.getMessage("popupSearchTitle")}
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
          className="w-full h-10 px-4 rounded-lg shadow-md"
        />
      </div>
          {searchResults.length >0?      <div className="flex flex-row justify-evenly">
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
      </div>:<div></div>}


      <div className="flex flex-col gap-4  p-2 overflow-y-auto overflow-x-hidden">
        {isLoading===1 ? (
        <div className="flex justify-center items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647zM12 20.735A7.962 7.962 0 0112 12v-4.735l-3 2.646v4.736a7.962 7.962 0 013 2.647zM17 12a5 5 0 11-10 0 5 5 0 0110 0z"
            ></path>
          </svg>
          <span>Searching...</span>
        </div>
      ) :(isLoading===3?<span>no result for "{searchString}"</span>:null)}
        {searchResults.map((v, index) => {
          return (
            <div className="text-blue-500 rounded " key={index}>
              <a
                title={chrome.i18n.getMessage("popupLinkTitle")}
                href={v.url}
                onClick={() => {
                  chrome.tabs.create({ url: v.url,active:false})
                }}>
                {truncateText(v.title, 100)}
              </a>
              {v.isBookmarked && <i className="ml-2">⭐</i>}
              <p className="text-md text-gray-300">{truncateText(v.url, 40)}</p>
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
