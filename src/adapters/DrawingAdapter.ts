/* eslint-disable linebreak-style */
import { useDispatch, useSelector } from 'react-redux'
import { useLocalPackageDatabase } from '../infrastructure/databases/LocalPackageDatabase'
import { useReduxPackageState, selectDrawingMetadata, selectDrawingContent, selectDrawingStatus } from '../infrastructure/state/PackageState'
import { createDrawing, fetchDrawing, updateDrawing, deleteDrawing } from '../core/usecases/Drawing'
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
    () => () => fetchDrawing(drawing, localDatabase, directoryState),
    [drawing.id]
  )

  const saveDrawing = useMemo(
    () => (sceneData: string) => {
      if (!drawingMetadata) return
      updateDrawing(
        {
          ...drawingMetadata,
          sceneData,
        },
        localDatabase,
        directoryState
      )
    },
    [drawingMetadata]
  )

  const removeDrawing = useMemo(
    () => () => {
      deleteDrawing(drawing, localDatabase, directoryState)
    },
    [drawing.id]
  )

  // Download as .excalidraw JSON
  const downloadDrawing = useMemo(() => async () => {
    if (!drawingMetadata || !drawingContent) return
    const snippetLike = {
      name: drawingMetadata.name + '.excalidraw',
      content: drawingContent.sceneData,
    }
    downloader.downloadTextFile({
      id: drawingMetadata.id,
      name: snippetLike.name,
      content: snippetLike.content,
      type: PackageEntity.NodeType.snippet,
      parentId: drawingMetadata.parentId,
      editedAt: 0,
      createdAt: 0,
    })
  }, [drawingMetadata, drawingContent])

  return {
    drawingMetadata,
    drawingContent,
    drawingStatus,
    loadDrawing,
    saveDrawing,
    removeDrawing,
    downloadDrawing,
  }
}
