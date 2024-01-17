import { Document } from "./textsplitter";
import { RecursiveCharacterTextSplitter
} from "./textsplitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3600,
  chunkOverlap: 200
})

export async function textSplitterArray(pageArray) {
  const docs = pageArray.map((page) => {
    return new Document({
      pageContent: page.content,
      metadata: {
        title: page.title,
        url: page.url,
        id:(page.id).toString(),
        date:page.date,
        isBookmarked:page.isBookmarked
      }
    })
  })
  const docOutput = splitter.splitDocuments(docs);
  return docOutput
}
export async function textSplitter(page) {
  const doc = new Document({
      pageContent: page.content,
      metadata: {
        // serial:0,
        serial: 0,
        url: page.url,
        id:page.id,
        // date:page.date,
        // isBookmarked:page.isBookmarked
      }
    })

  const docOutput = splitter.splitDocuments([doc]);
  return docOutput
}