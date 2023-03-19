import React, { createRef, useEffect, useState } from "react"

const GPTSearch = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResult, setSearchResult] = useState<{answer:string,sources:Array<{url:string,title:string}>}>()
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    // code to handle search
    if (searchTerm === "" || searchTerm == " ") {
        return
      }
      setIsLoading(true)
      chrome.runtime
        .sendMessage({ command: "gptsearch", search: searchTerm })
        .then((v) => {
            setTimeout(() => {
                setSearchResult({
                    answer:"nononono asdasd asdasd asdasd",
                    sources:[{url:'aa.com',title:'asdasdasdas'},{url:'bb.com',title:'kokdfndyhd'},]
                  })
                  setIsLoading(false)
            }, 1000);
          
        })
  }

  const searchinputRef = createRef<any>()
  useEffect(() => {
    searchinputRef.current.focus()
  }, [])

  return (
    <div className="w-96 p-4 gap-4 h-[32rem] flex flex-col overflow-hidden">
      <div className="relative">
        <input
          ref={searchinputRef}
          type="text"
          placeholder="Ask about your bookmark/history ↵"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
          className="w-full h-10 px-4 pr-14 rounded-lg shadow-md"
        />
        <button className="absolute right-0 top-0 h-10 px-4 bg-blue-500 text-white rounded-r-lg" onClick={handleSearch}>Ask</button>
      </div>

      {isLoading ? (
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
          <span>Waiting For Answers...</span>
        </div>
      ) : (searchResult?
        <div>
        <div className="shadow-md min-h-[80] p-2 text-large">
            {searchResult?.answer}
        </div>
        </div> : <div></div>
      )}
    </div>
  )
}

export default GPTSearch
