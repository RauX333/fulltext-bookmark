// ============================================================================================
// word split functions


import init, { cut_for_search } from "~lib/jieba_rs_wasm.js";
import stemmer from "node-snowball";

(async function () {
    await init();
  })();

// Load stopwords from the text file
const stopwordsData = await fetch("~lib/stopwords_CN_EN.txt")
  .then(response => response.text())
  .catch(() => "");

const stopwordsSet = new Set(stopwordsData.split('\n').filter(word => word.trim() !== ""));

export function removeStopWords(words: string[]): string[] {
  return words.filter(word => !stopwordsSet.has(word));
}

export function wordStemming(words: string[]): string[] {
  return words.map(word => {
    // Only stem English words (letters only), skip Chinese characters
    if (/^[a-zA-Z]+$/.test(word)) {
      return stemmer.stemword(word, 'english');
    }
    return word;
  });
}


export function wordSplit(str: string): string[] {
    if (!str || typeof str !== "string") {
      return [];
    }
    str = str.toLowerCase();
    const result = cut_for_search(str, true);
    // console.log(result)
    const a = result
      .map((e) => {
        return palindrome(e);
      })
      .filter((e) => e !== "" && e !== null && e !== undefined);

    // Remove stopwords
    const filteredWords = removeStopWords(a);

    // Apply word stemming
    const stemmedWords = wordStemming(filteredWords);

    return stemmedWords;
  
    // if (judgeChineseChar(str)) {
    //   console.log("chinese char")
    //   // console.time("seg")
  
    //   // console.timeEnd("seg")
    //   // const result = segmentit.doSegment(str)
    //   const result = cut_for_search(str, true);
    //   console.log(result)
    //   const a = result
    //     .map((e) => {
    //       return palindrome(e)
    //     })
    //     .filter((e) => e !== "" && e !== null && e !== undefined)
    //   return a
    // } else if (judgeJapaneseChar(str)) {
    //   const result = Array.from(
    //     new Intl.Segmenter("js-JP", { granularity: "word" }).segment(str)
    //   )
    //   const a = result.filter((e) => e.isWordLike)
    //   const b = a.map((e) => {
    //     return palindrome(e.segment)
    //   })
    //   const c = b.filter((e) => e !== "" && e !== null && e !== undefined)
  
    //   return c
    // } else {
    //   const result = Array.from(
    //     new Intl.Segmenter("en", { granularity: "word" }).segment(str)
    //   )
    //   const a = result.filter((e) => e.isWordLike)
    //   const b = a.map((e) => {
    //     return palindrome(e.segment)
    //   })
    //   const c = b.filter((e) => e !== "" && e !== null && e !== undefined)
  
    //   return c
    // }
  }
  
  export function palindrome(str: string): string {
    const arr = str.replace(
      /[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g,
      ""
    );
    return arr;
  }