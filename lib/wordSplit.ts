// ============================================================================================
// word split functions


import init, { cut_for_search } from "~lib/jieba_rs_wasm.js";

(async function () {
    await init();
  })();

  
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
    return a;
  
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