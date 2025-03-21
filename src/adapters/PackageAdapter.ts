import { useDispatch, useSelector } from 'react-redux'
import { useLocalPackageDatabase } from '../infrastructure/databases/LocalPackageDatabase'
import {
  selectAncestors,
  selectSnippetContent,
  selectSnippetMetadata,
  selectSnippetStatus,
  selectPackageContent,
  selectPackageMetadata,
  selectPackageStatus,
  useReduxPackageState
} from '../infrastructure/state/PackageState'
import {  PackageState as PackageStateInterface } from '../core/repositories/PackageState'
import * as Snippet from '../core/usecases/Snippet'
import * as Package from '../core/usecases/Package'
import { AppDispatch } from '../infrastructure/state/app/store'
import { Package as PackageEntity } from '../core/entities/Package'
import { useMemo } from 'react'
import { useDownloadManager } from '../infrastructure/downloader'
import { createDrawing } from '../core/usecases/Drawing'

const databaseId = 'db1'

export function useSnippetAdapter(metadata: Pick<PackageEntity.SnippetContent, 'id'>) {
  const dispatch: AppDispatch = useDispatch()
  const directoryState: PackageStateInterface = useReduxPackageState(dispatch)
  const localDatabase = useLocalPackageDatabase(databaseId)
  const downloader = useDownloadManager()
  
  const snippetMetadata = useSelector(selectSnippetMetadata(metadata))
  const snippetContent = useSelector(selectSnippetContent(metadata))
  const snippetStatus = useSelector(selectSnippetStatus(metadata))

  const fetchSnippetMetadata = useMemo(() => () => {
    Snippet.fetchSnippetMetadata(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const fetchSnippetContent = useMemo(() => () => {
    Snippet.fetchSnippetContent(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const fetchSnippet = useMemo(() => () => {
    Snippet.fetchSnippet(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const deleteSnippet = useMemo(() => () => {
    Snippet.deleteSnippet(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const updateContent = useMemo(() => (newContent: PackageEntity.SnippetContent['content']) => {
    Snippet.saveSnippet({
      ...snippetMetadata,
      content: newContent
    }, localDatabase, directoryState)
  }, [metadata.id])

  const renameSnippet = useMemo(() => (newName: PackageEntity.SnippetMetadata['name']) => {
    Snippet.saveSnippetMetadata({
      ...snippetMetadata,
      name: newName,
    }, localDatabase, directoryState)
  }, [metadata.id])

  const downloadSnippet = useMemo(() => () => {
    Snippet.downloadSnippet(metadata, localDatabase, directoryState, downloader)
  }, [metadata.id])

  return {
    fetchSnippetMetadata,
    fetchSnippetContent,
    fetchSnippet,
    deleteSnippet,
    updateContent,
    downloadSnippet,
    renameSnippet,
    snippetMetadata,
    snippetContent,
    snippetStatus,
  }
}

export function usePackageAdapter(metadata: Pick<PackageEntity.PackageMetadata, 'id' | 'parentId'> = PackageEntity.Workspace) {
  const dispatch: AppDispatch = useDispatch()
  const directoryState: PackageStateInterface = useReduxPackageState(dispatch)
  const localDatabase = useLocalPackageDatabase(databaseId)

  const packageContent = useSelector(selectPackageContent(metadata))
  const packageMetadata = useSelector(selectPackageMetadata(metadata))
  const packageStatus = useSelector(selectPackageStatus(metadata))
  const ansestors = useSelector(selectAncestors(metadata))

  const createSnippet = useMemo(() => (params: Pick<Snippet.createSnippetParams, 'name'>) => {
    return Snippet.createSnippet({
      parentId: metadata.id,
      name: params.name,
    }, localDatabase, directoryState)
  }, [metadata.id])

  const createPackage = useMemo(() => (params: Pick<Snippet.createSnippetParams, 'name'>) => {
    Package.createPackage({
      name: params.name,
      parentId: metadata.id,
    }, localDatabase, directoryState)
  }, [metadata.id])

  const createDrawingInPackage = useMemo(
    () => async (params: { name: string }) => {
      return createDrawing(
        {
          name: params.name,
          parentId: metadata.id,
        },
        localDatabase,
        directoryState
      )
    },
    [metadata.id]
  )

  const fetchPackageContent = useMemo(() => () => {
    Package.fetchPackageContent(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const deletePackage = useMemo(() => () => {
    Package.deletePackage(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const fetchParentMetadata = useMemo(() => () => {
    Package.fetchParentMetadata(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const fetchAncestors = useMemo(() => () => {
    Package.fetchAncestors(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const fetchPackageMetadata = useMemo(() => () => {
    Package.fetchPackageMetadata(metadata, localDatabase, directoryState)
  }, [metadata.id])

  const renamePackage = useMemo(() => (newName: PackageEntity.PackageMetadata['name']) => {
    if (packageMetadata === undefined) return
    Package.savePackageMetadata({
      ...packageMetadata,
      name: newName,
    }, localDatabase, directoryState)
  }, [metadata.id, packageMetadata])

  return {
    createSnippet,
    createPackage,
    createDrawing: createDrawingInPackage,
    fetchPackageContent,
    deletePackage,
    fetchParentMetadata,
    fetchAncestors,
    fetchPackageMetadata,
    renamePackage,
    packageContent,
    packageMetadata,
    packageStatus,
    ansestors,
  }
}
