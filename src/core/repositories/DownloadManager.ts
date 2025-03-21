import { Package } from '../entities/Package'

export interface DownloadManager {
  downloadTextFile(snippet: Package.SnippetType): Promise<void>
}
