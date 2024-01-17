import Api2d from "api2d";
// import { persistor, store } from "@src/store/store";
// const userOps = store.getState();


// const key = userOps.GPTKey;
// const apiBaseUrl = userOps.GPTURL;
// console.log("kkk",key,apiBaseUrl);
// const api = new Api2d(key, apiBaseUrl);
let api;
export function initApi(key,url) {
  api = new Api2d(key, url);
  api.setTimeout( 1000*30 );
}

export async function genEmbedding(message: string) {
  try {
    const r = await api.embeddings({
      input: message,
    });

    const a = r.data[0].embedding;
    return a;
  } catch (error) {
    throw new Error("embedding api error: "+error.message);
  }
}

export async function chat(message: string) {
  try {
    const res = await api.completion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      stream: false, // 支持 stream，注意stream为 true 的时候，返回值为undefined
      // onMessage: (string)=> {
      //     console.log( "SSE返回，这里返回的是已经接收到的完整字符串", string );
      // },
      // onEnd: (string)=> {
      //     console.log( "end", string );
      // }
    });

    const a = res.choices[0].message.content;
    return a;
  } catch (error) {
    throw new Error("chat api error: "+error.message);
  }
}

const template =
  "Given the following extracted parts of a long document and a question, create a final helpful answer with references('SOURCES'). If you don't know the answer, just say that you don't know. Don't try to make up an answer.ALWAYS return a 'SOURCES' part in your answer.Reply example: \n{your answer}\n===\nSOURCES:{sources}";

//TODO:answer in language
export async function chatWithRefs(message: string, sources) {
  let temp = template + "\n===\nQUESTION: " + message;
  sources.forEach((a) => {
    temp = temp + "\n===\nContent: " + a.content + "\nSource: " + a.source;
  });
  return chat(temp);
}
