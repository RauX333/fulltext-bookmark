export interface GPTAnswer {
  answer: string
  sources: Array<{ url: string; title: string }>|null
}
