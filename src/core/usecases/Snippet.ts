import { Package } from '../entities/Package'
import { PackageDatabase } from '../repositories/PackageDatabase'
import { PackageState, SnippetStatus } from '../repositories/PackageState'
import { DownloadManager } from '../repositories/DownloadManager'

export type createSnippetParams = {
  name: Package.SnippetMetadata['name'],
  parentId: Package.SnippetMetadata['parentId'],
}

/**
 * @todo Implement Snippet ID Generator
 */
export const createSnippet = async (
  params: createSnippetParams,
  database: PackageDatabase,
  state: PackageState,
): Promise<Package.SnippetType> => {

  const snippetId = String(Date.now())

  const snippetMetadata: Package.SnippetMetadata = {
    type: Package.NodeType.snippet,
    id: snippetId,
    name: params.name,
    parentId: params.parentId || Package.Workspace.id,
    editedAt: Date.now(),
    createdAt: Date.now()
  }

  const snippetContent: Package.SnippetContent = {
    id: snippetId,
    content: '',
  }

  state.setSnippetStatus(snippetMetadata, SnippetStatus.Creating)
  state.setSnippetMetadata(snippetMetadata)
  state.setSnippetContent(snippetContent)
  await database.createSnippetMetadata(snippetMetadata)
  await database.createSnippetContent(snippetContent)
  state.setSnippetStatus(snippetMetadata, SnippetStatus.Default)

  return {
    ...snippetMetadata,
    ...snippetContent,
  }
}

export const fetchSnippetMetadata = async (
  snippetMetadataPartial: Pick<Package.SnippetMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState,
): Promise<Package.SnippetMetadata> => {

  const snippetMetadata: Package.SnippetMetadata = await database.fetchSnippetMetadata(snippetMetadataPartial)
  state.setSnippetMetadata(snippetMetadata)

  return { ...snippetMetadata }
}

export const fetchSnippetContent = async (
  snippetMetadataPartial: Pick<Package.SnippetMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState,
): Promise<Package.SnippetContent> => {

  state.setSnippetStatus(snippetMetadataPartial, SnippetStatus.ContentLoading)
  const snippetContent: Package.SnippetContent = await database.fetchSnippetContent(snippetMetadataPartial)
  state.setSnippetContent(snippetContent)
  state.setSnippetStatus(snippetMetadataPartial, SnippetStatus.ContentLoaded)

  return { ...snippetContent }
}

export const fetchSnippet = async (
  snippetMetadataPartial: Pick<Package.SnippetMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState,
): Promise<Package.SnippetType> => {

  const snippetContent: Package.SnippetContent = await fetchSnippetContent(snippetMetadataPartial, database, state)
  const snippetMetadata: Package.SnippetMetadata = await fetchSnippetMetadata(snippetMetadataPartial, database, state)

  return { ...snippetContent, ...snippetMetadata }
}

export const deleteSnippet = async (
  snippet: Pick<Package.SnippetMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState,
) => {
  state.setSnippetStatus(snippet, SnippetStatus.Deleting)
  await database.deleteSnippetContent(snippet)
  await database.deleteSnippetMetadata(snippet)
  state.deleteSnippetContent(snippet)
  state.deleteSnippetMetadata(snippet)
  state.setSnippetStatus(snippet, SnippetStatus.Deleted)
}


export const saveSnippet = async (
  snippet: Package.SnippetType,
  database: PackageDatabase,
  state: PackageState,
): Promise<void> => {

  state.setSnippetStatus(snippet, SnippetStatus.ChangesSaving)
  snippet.editedAt = Date.now()
  await database.updateSnippetContent(snippet)
  await database.updateSnippetMetadata(snippet)
  state.setSnippetContent(snippet)
  state.setSnippetMetadata(snippet)
  state.setSnippetStatus(snippet, SnippetStatus.Default)
}

export const saveSnippetMetadata = async (
  snippet: Package.SnippetMetadata,
  database: PackageDatabase,
  state: PackageState,
): Promise<void> => {

  state.setSnippetStatus(snippet, SnippetStatus.ChangesSaving)
  snippet.editedAt = Date.now()
  await database.updateSnippetMetadata(snippet)
  state.setSnippetMetadata(snippet)
  state.setSnippetStatus(snippet, SnippetStatus.Default)
}

export const downloadSnippet = async (
  snippetMetadataPartial: Pick<Package.SnippetMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState,
  downloader: DownloadManager,
): Promise<void> => {

  const snippet = await fetchSnippet(snippetMetadataPartial, database, state)
  await downloader.downloadTextFile(snippet)
}
