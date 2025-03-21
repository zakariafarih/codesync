import { DownloadManager } from '../core/repositories/DownloadManager'
import { downloadSnippet } from './libs/downloadSnippet'

const downloader: DownloadManager = {
  async downloadTextFile(snippet) {
    downloadSnippet(snippet.name, snippet.content)
  },
}

export const useDownloadManager = () => {
  return downloader
}
