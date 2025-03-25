import { useDispatch, useSelector } from 'react-redux'
import { useLocalPackageDatabase } from '../infrastructure/databases/LocalPackageDatabase'
import { useReduxPackageState, selectDrawingMetadata, selectDrawingContent, selectDrawingStatus } from '../infrastructure/state/PackageState'
import { createDrawing, fetchDrawing, updateDrawing, deleteDrawing, updateDrawingMetadata } from '../core/usecases/Drawing'
import { Package as PackageEntity } from '../core/entities/Package'
import { DrawingStatus } from '../core/repositories/PackageState'
import { AppDispatch } from '../infrastructure/state/app/store'
import { useMemo } from 'react'
import { useDownloadManager } from '../infrastructure/downloader'

export function useDrawingAdapter(drawing: Pick<PackageEntity.DrawingMetadata, 'id'>) {
  const dispatch: AppDispatch = useDispatch()
  const directoryState = useReduxPackageState(dispatch)
  const localDatabase = useLocalPackageDatabase('db1')
  const downloader = useDownloadManager()

  const drawingMetadata = useSelector(selectDrawingMetadata(drawing))
  const drawingContent = useSelector(selectDrawingContent(drawing))
  const drawingStatus = useSelector(selectDrawingStatus(drawing))

  const loadDrawing = useMemo(
    () => async () => {
      try {
        const result = await fetchDrawing(drawing, localDatabase, directoryState)
        console.log('Drawing loaded:', result)
        return result
      } catch (err) {
        console.error('Failed to load drawing:', err)
        throw err
      }
    },
    [drawing.id, localDatabase, directoryState]
  )

  const updateDrawing = useMemo(
    () => async (updatedDrawing: PackageEntity.DrawingMetadata) => {
      try {
        await updateDrawingMetadata(updatedDrawing, localDatabase, directoryState)
      } catch (err) {
        console.error('Failed to update drawing:', err)
        throw err
      }
    },
    [drawing.id, localDatabase, directoryState]
  )

  const saveDrawing = useMemo(
    () => async (sceneData: string) => {
      if (!drawingMetadata) {
        console.error('Cannot save drawing: metadata not found')
        return
      }
      
      try {
        const updatedDrawing = {
          ...drawingMetadata,
          sceneData,
          editedAt: Date.now(),
          content: sceneData,
        }
        
        await updateDrawingMetadata(
          updatedDrawing,
          localDatabase,
          directoryState
        )
        console.log('Drawing saved:', {
          id: drawing.id,
          contentLength: sceneData.length,
          timestamp: new Date().toISOString()
        })
      } catch (err) {
        console.error('Failed to save drawing:', err)
        throw err
      }
    },
    [drawingMetadata, localDatabase, directoryState, drawing.id]
  )

  const removeDrawing = useMemo(
    () => async () => {
      try {
        await deleteDrawing(drawing, localDatabase, directoryState)
      } catch (err) {
        console.error('Failed to delete drawing:', err)
        throw err
      }
    },
    [drawing.id, localDatabase, directoryState]
  )

  const downloadDrawing = useMemo(
    () => async () => {
      if (!drawingMetadata || !drawingContent) {
        console.error('Cannot download drawing: metadata or content not found')
        return
      }

      try {
        const snippetLike = {
          name: drawingMetadata.name + '.excalidraw',
          content: drawingContent.sceneData,
        }
        await downloader.downloadTextFile({
          id: drawingMetadata.id,
          name: snippetLike.name,
          content: snippetLike.content,
          type: PackageEntity.NodeType.snippet,
          parentId: drawingMetadata.parentId,
          editedAt: drawingMetadata.editedAt,
          createdAt: drawingMetadata.createdAt,
        })
      } catch (err) {
        console.error('Failed to download drawing:', err)
        throw err
      }
    },
    [drawingMetadata, drawingContent, downloader]
  )

  return {
    drawingMetadata,
    drawingContent,
    drawingStatus,
    loadDrawing,
    saveDrawing,
    removeDrawing,
    downloadDrawing,
    updateDrawing,
  }
}