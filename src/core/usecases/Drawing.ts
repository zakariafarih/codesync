/* eslint-disable linebreak-style */
import { Package } from '../entities/Package'
import { PackageDatabase } from '../repositories/PackageDatabase'
import { PackageState } from '../repositories/PackageState'
import { DrawingStatus } from '../repositories/PackageState'

export type createDrawingParams = {
  name: string
  parentId?: string
}

export async function createDrawing(
  params: createDrawingParams,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.DrawingMetadata & Package.DrawingContent> {
  const drawingId = String(Date.now())

  const drawingMetadata: Package.DrawingMetadata = {
    type: Package.NodeType.drawing,
    id: drawingId,
    name: params.name,
    parentId: params.parentId ?? Package.Workspace.id,
    editedAt: Date.now(),
    createdAt: Date.now(),
  }

  const drawingContent: Package.DrawingContent = {
    id: drawingId,
    sceneData: '',
  }

  // Optimistic updates
  state.setDrawingStatus(drawingMetadata, DrawingStatus.Creating)
  state.setDrawingMetadata(drawingMetadata)
  state.setDrawingContent(drawingContent)

  // Persist
  await database.createDrawingMetadata(drawingMetadata)
  await database.createDrawingContent(drawingContent)

  state.setDrawingStatus(drawingMetadata, DrawingStatus.Default)

  return { ...drawingMetadata, ...drawingContent }
}

export async function fetchDrawing(
  drawing: Pick<Package.DrawingMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.DrawingMetadata & Package.DrawingContent> {
  state.setDrawingStatus(drawing, DrawingStatus.ContentLoading)

  const metadata = await database.fetchDrawingMetadata(drawing)
  const content = await database.fetchDrawingContent(drawing)

  state.setDrawingMetadata(metadata)
  state.setDrawingContent(content)
  state.setDrawingStatus(drawing, DrawingStatus.ContentLoaded)

  return { ...metadata, ...content }
}

export async function updateDrawing(
  drawing: Package.DrawingMetadata & Package.DrawingContent,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  state.setDrawingStatus(drawing, DrawingStatus.ChangesSaving)
  drawing.editedAt = Date.now()

  await database.updateDrawingMetadata(drawing)
  await database.updateDrawingContent(drawing)

  state.setDrawingMetadata(drawing)
  state.setDrawingContent(drawing)
  state.setDrawingStatus(drawing, DrawingStatus.Default)
}

export async function deleteDrawing(
  drawing: Pick<Package.DrawingMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  state.setDrawingStatus(drawing, DrawingStatus.Deleting)

  await database.deleteDrawingContent(drawing)
  await database.deleteDrawingMetadata(drawing)

  state.deleteDrawingContent(drawing)
  state.deleteDrawingMetadata(drawing)
  state.setDrawingStatus(drawing, DrawingStatus.Deleted)
}
