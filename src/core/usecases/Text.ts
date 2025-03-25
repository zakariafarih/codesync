import { v4 as uuidv4 } from 'uuid'
import { Package } from '../entities/Package'
import { PackageDatabase } from '../repositories/PackageDatabase'
import { PackageState, TextStatus } from '../repositories/PackageState'

export type CreateTextParams = {
  name: string,
  parentId?: string,
}

/**
 * Creates a new text item with Lexical content.
 * Uses UUID for generating a unique ID.
 * Initializes with an empty Lexical content.
 */
export async function createText(
  params: CreateTextParams,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.TextMetadata & Package.TextContent> {
  const textId = uuidv4()

  const textMetadata: Package.TextMetadata = {
    type: Package.NodeType.text,
    id: textId,
    name: params.name,
    parentId: params.parentId || Package.Workspace.id,
    createdAt: Date.now(),
    editedAt: Date.now(),
  }

  const textContent: Package.TextContent = {
    id: textId,
    lexicalData: '', 
  }

  try {
    state.setTextStatus(textMetadata, TextStatus.Creating)
    state.setTextMetadata(textMetadata)
    state.setTextContent(textContent)

    await database.createTextMetadata(textMetadata)
    await database.createTextContent(textContent)

    state.setTextStatus(textMetadata, TextStatus.Default)
  } catch (error) {
    console.error('Error creating text item:', error)
    throw error
  }

  return { ...textMetadata, ...textContent }
}

/**
 * Fetches a text item (metadata and content) from the database.
 */
export async function fetchText(
  text: Pick<Package.TextMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.TextMetadata & Package.TextContent> {
  try {
    // Update state to indicate content loading
    state.setTextStatus(text, TextStatus.ContentLoading)

    // Retrieve metadata and content from the database
    const metadata = await database.fetchTextMetadata(text)
    const content = await database.fetchTextContent(text)

    // Update state with fetched data and mark as loaded
    state.setTextMetadata(metadata)
    state.setTextContent(content)
    state.setTextStatus(text, TextStatus.ContentLoaded)

    return { ...metadata, ...content }
  } catch (error) {
    console.error('Error fetching text item:', error)
    throw error
  }
}

/**
 * Updates the text item with new Lexical content.
 * This function updates both metadata (like editedAt) and the content.
 */
export async function updateText(
  text: Package.TextMetadata & Package.TextContent,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  try {
    state.setTextStatus(text, TextStatus.ChangesSaving)
    text.editedAt = Date.now()

    await database.updateTextMetadata(text)
    await database.updateTextContent({ id: text.id, lexicalData: text.lexicalData })

    state.setTextMetadata(text)
    state.setTextContent(text)
    state.setTextStatus(text, TextStatus.Default)
  } catch (error) {
    console.error('Error updating text item:', error)
    throw error
  }
}

/**
 * Deletes a text item from the database and updates the Redux state accordingly.
 */
export async function deleteText(
  text: Pick<Package.TextMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  try {
    state.setTextStatus(text, TextStatus.Deleting)

    await database.deleteTextContent(text)
    await database.deleteTextMetadata(text)

    state.deleteTextContent(text)
    state.deleteTextMetadata(text)
    state.setTextStatus(text, TextStatus.Deleted)
  } catch (error) {
    console.error('Error deleting text item:', error)
    throw error
  }
}

/**
 * Moves a text item to a new parent package.
 */
export async function moveText(
  textId: string,
  newParentId: string,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  try {
    const metadata = await database.fetchTextMetadata({ id: textId })

    const updatedMetadata: Package.TextMetadata = {
      ...metadata,
      parentId: newParentId,
      editedAt: Date.now(),
    }

    await database.updateTextMetadata(updatedMetadata)
    state.setTextMetadata(updatedMetadata)
  } catch (error) {
    console.error('Error moving text item:', error)
    throw error
  }
}
