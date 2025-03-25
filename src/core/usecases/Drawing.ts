/* eslint-disable linebreak-style */
import { Package } from '../entities/Package'
import { PackageDatabase } from '../repositories/PackageDatabase'
import { PackageState } from '../repositories/PackageState'
import { DrawingStatus } from '../repositories/PackageState'
import { v4 as uuidv4 } from 'uuid'

export type createDrawingParams = {
  name: string
  parentId?: string
}

export async function createDrawing(
  params: createDrawingParams,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.DrawingMetadata & Package.DrawingContent> {
  const drawingId = params.parentId ? `${params.parentId}-${uuidv4()}` : uuidv4()

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

  state.setDrawingStatus(drawingMetadata, DrawingStatus.Creating)
  state.setDrawingMetadata(drawingMetadata)
  state.setDrawingContent(drawingContent)

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
  try {
    state.setDrawingStatus(drawing, DrawingStatus.Deleting)

    try {
      await database.deleteDrawingContent(drawing)
    } catch (error) {
      console.warn('Drawing content not found, continuing with metadata deletion')
    }

    try {
      await database.deleteDrawingMetadata(drawing)
    } catch (error) {
      console.warn('Drawing metadata not found, continuing with state cleanup')
    }

    state.deleteDrawingContent(drawing)
    state.deleteDrawingMetadata(drawing)
    
    state.setDrawingStatus(drawing, DrawingStatus.Deleted)
  } catch (error) {
    console.error('Failed to delete drawing:', error)
    state.setDrawingStatus(drawing, DrawingStatus.Default)
    throw new Error(`Failed to delete drawing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const moveDrawing = async (
  drawingId: string,
  newParentId: string,
  database: PackageDatabase,
  state: PackageState
): Promise<void> => {
  const drawingMetadata = await database.fetchDrawingMetadata({ id: drawingId })
  
  const updatedMetadata: Package.DrawingMetadata = {
    ...drawingMetadata,
    parentId: newParentId,
    editedAt: Date.now(),
  }

  await database.updateDrawingMetadata(updatedMetadata)

  state.setDrawingMetadata(updatedMetadata)
}

export async function updateDrawingMetadata(
  drawing: Package.DrawingMetadata,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  try {
    state.setDrawingStatus(drawing, DrawingStatus.Loading)

    const updatedDrawing = {
      ...drawing,
      editedAt: Date.now()
    }

    await database.updateDrawingMetadata(updatedDrawing)

    state.setDrawingMetadata(updatedDrawing)

    state.setDrawingStatus(drawing, DrawingStatus.Default)
  } catch (error) {
    console.error('Failed to update drawing metadata:', error)
    state.setDrawingStatus(drawing, DrawingStatus.Error)
    throw error
  }
}
