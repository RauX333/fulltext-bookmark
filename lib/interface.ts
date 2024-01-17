export interface IGPTAnswer {
  answer: string
  sources: Array<{ url: string; title: string;isBookmarked:boolean;date:number }>|null
}
