import React, { createRef, useEffect, useState } from "react";
import type { IGPTAnswer } from "~lib/interface";
import { truncateText } from "~lib/utils";
import {
  AppStat,
  setGPTAnswer,
  setGPTQuery,
  setGPTLoading,
} from "~store/stat-slice";
import { useDispatch, useSelector } from "react-redux";
import "~style.css"
const GPTSearch = () => {
  const dispatch = useDispatch();
  const ExistedGPTAnswer = useSelector((state: AppStat) => state.GPTAnswer);
  const GPTQuery = useSelector((state: AppStat) => state.GPTQuery);
  const GPTLoading = useSelector((state: AppStat) => state.GPTLoading);
  const GPTKey = useSelector((state: AppStat) => state.GPTKey);
  const GPTURL = useSelector((state: AppStat) => state.GPTURL);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] =
    useState<IGPTAnswer>(ExistedGPTAnswer);
  const [isLoading, setIsLoading] = useState(GPTLoading);
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    // console.log(e.target.value);
  };
  const handleSearch = async () => {
    if(!GPTKey || !GPTURL) {
      dispatch(setGPTQuery(chrome.i18n.getMessage("gptFirst")))
      return
    }
    // code to handle search
    if (searchTerm === "" || searchTerm == " ") {
      return;
    }
    setIsLoading(true);
    dispatch(setGPTLoading(true));
    dispatch(setGPTQuery(searchTerm));
    dispatch(setGPTAnswer(null));
    chrome.runtime
      .sendMessage({ command: "gptsearch", search: searchTerm,key:GPTKey,url:GPTURL })
      .then((v) => {
        // console.log(v);
        setSearchResult(v);
        dispatch(setGPTAnswer(v));
        setIsLoading(false);
        dispatch(setGPTLoading(false));
      });
  };

  const searchinputRef = createRef<any>();
  useEffect(() => {
    searchinputRef.current.focus();
  }, []);

  return (
    <div className="w-96 p-4 gap-4 h-[32rem] flex flex-col overflow-hidden">
      <div className="relative">
        <input
          ref={searchinputRef}
          type="text"
          placeholder={chrome.i18n.getMessage("popupAskPlaceholder")}
          value={searchTerm}
          onChange={handleSearchInputChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="w-full h-10 px-4 pr-14 rounded-lg shadow-md"
        />
        <button
          className="absolute right-0 top-0 h-10 px-4 bg-blue-500 text-white rounded-r-lg"
          onClick={handleSearch}
        >
          Ask
        </button>
      </div>
      {GPTQuery ? (
        <div className="font-bold shadow-md p-4">
          {GPTQuery}
          <div>
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
                {/* <span>Waiting For Answers...</span> */}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {isLoading ? null : searchResult ? (
        <div className="flex flex-col gap-4 p-2 overflow-y-auto overflow-x-hidden">
          <div className="font-bold">{chrome.i18n.getMessage("popupAskAnswerFrom")}</div>
          <div className="shadow-md p-4 text-large whitespace-pre-line">
            <div className="mb-2 whitespace-pre-wrap break-all">
              {searchResult?.answer}
            </div>

            <div className="flex justify-end">
              <span
                className="hover:text-blue-700 text-blue-500 font-bold py-1 px-2 rounded text-sm cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(searchResult?.answer);
                }}
              >
                {chrome.i18n.getMessage("popupAskAnswerCopy")}
              </span>
            </div>
          </div>
          {searchResult.sources ? (
            <div className="font-bold">{chrome.i18n.getMessage("popupAskAnswerSource")}</div>
          ) : null}

          {searchResult.sources
            ? searchResult.sources.map((v, index) => {
                return (
                  <div
                    className="text-blue-500 rounded shadow-md p-4"
                    key={index}
                  >
                    <a
                      title={chrome.i18n.getMessage("popupLinkTitle")}
                      href={v.url}
                      onClick={() => {
                        chrome.tabs.create({ url: v.url, active: false });
                      }}
                    >
                      {truncateText(v.title, 100)}
                    </a>
                    {v.isBookmarked && <i className="ml-2">⭐</i>}
                    <p className="text-md text-gray-300">
                      {truncateText(v.url, 40)}
                    </p>
                    <p className="text-sm text-gray-300">
                      {new Date(v.date).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            : null}
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default GPTSearch;
