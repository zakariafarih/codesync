import { Package } from '../../core/entities/Package'
import { PackageDatabase } from '../../core/repositories/PackageDatabase'
import { openDB, IDBPDatabase, DBSchema } from 'idb'
import { PackageState } from '../../core/repositories/PackageState'

interface LocalPackageDatabaseSchema extends DBSchema {
  'metadataStore': {
    key: Package.NodeId,
    value: Package.Node,
    indexes: {
      'parentId': Package.NodeId
    }
  },
  'contentStore': {
    key: string,
    value: { id: string, content: string }
  }
}

export class LocalPackageDatabase implements PackageDatabase {
  private readonly metadataStoreName = 'metadataStore'
  private readonly contentStoreName = 'contentStore'
  private database: IDBPDatabase<LocalPackageDatabaseSchema> | null = null
  readonly id: string

  constructor({ id }: { id: string }) {
    this.id = id
  }

  get databaseName(): string {
    return `PackageDatabase/${this.id}`
  }

  private async connect(): Promise<LocalPackageDatabase> {
    if (this.database == null) {
      this.database = await openDB<LocalPackageDatabaseSchema>(this.databaseName, 1, {
        upgrade(db) {
          const metadataStore = db.createObjectStore('metadataStore', {
            keyPath: 'id'
          })
          metadataStore.createIndex('parentId', 'parentId')
          
          db.createObjectStore('contentStore', {
            keyPath: 'id'
          })
        }
      })
    }
    return this
  }

  // --- SNIPPET METHODS ---
  async createSnippetContent(snippetContent: Package.SnippetContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.contentStoreName, {
      id: snippetContent.id,
      content: snippetContent.content,
    })
  }

  async createSnippetMetadata(snippetMetadata: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.metadataStoreName, {
      id: snippetMetadata.id,
      createdAt: snippetMetadata.createdAt,
      editedAt: snippetMetadata.editedAt,
      name: snippetMetadata.name,
      parentId: snippetMetadata.parentId,
      type: snippetMetadata.type,
    })
  }

  async fetchSnippetContent(snippetMetadata: Package.SnippetMetadata): Promise<Package.SnippetContent> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.contentStoreName, snippetMetadata.id)
    return {
      id: snippetMetadata.id,
      content: data!.content,
    }
  }

  async fetchSnippetMetadata(metadata: { id: string }): Promise<Package.SnippetMetadata> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.metadataStoreName, metadata.id) as Package.SnippetMetadata | undefined
    if (data === undefined) {
      throw new Error('[LocalPackageDatabase]: Snippet is undefined')
    }
    return {
      id: data.id,
      name: data.name,
      type: Package.NodeType.snippet,
      parentId: data.parentId,
      createdAt: data.createdAt,
      editedAt: data.editedAt,
    }
  }

  async updateSnippetContent(snippetContent: Package.SnippetContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.contentStoreName, 'readwrite')
    const content = await txn.store.get(snippetContent.id)
    if (content === undefined) throw new Error(`[LocalPackageDatabase] Snippet Not Found: ID("${snippetContent.id}")`)
    await txn.store.put({ ...content, content: snippetContent.content })
    await txn.done
  }

  async updateSnippetMetadata(snippetMetadataNew: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.metadataStoreName, 'readwrite')
    const snippetMetadata = await txn.store.get(snippetMetadataNew.id)
    if (snippetMetadata === undefined) throw new Error(`[LocalPackageDatabase] Snippet Not Found: ID("${snippetMetadataNew.id}")`)
    await txn.store.put({ ...snippetMetadata, ...snippetMetadataNew })
    await txn.done
  }

  async deleteSnippetContent(snippetMetadata: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.contentStoreName, snippetMetadata.id)
  }

  async deleteSnippetMetadata(snippetMetadata: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, snippetMetadata.id)
  }

  // --- PACKAGE METHODS ---
  async createPackageMetadata(packageMetadata: Package.PackageMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.metadataStoreName, {
      id: packageMetadata.id,
      createdAt: packageMetadata.createdAt,
      editedAt: packageMetadata.editedAt,
      name: packageMetadata.name,
      parentId: packageMetadata.parentId,
      type: packageMetadata.type,
    })
  }

  async updatePackageMetadata(packageMetadataNew: Package.PackageMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.metadataStoreName, 'readwrite')
    const packageMetadata = await txn.store.get(packageMetadataNew.id)
    if (packageMetadata === undefined) throw new Error(`[LocalPackageDatabase] Package Not Found: ID("${packageMetadataNew.id}")`)
    await txn.store.put({ ...packageMetadata, ...packageMetadataNew })
    await txn.done
  }

  async deletePackageMetadata(packageMetadata: Package.PackageMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, packageMetadata.id)
  }

  async fetchPackageContent(
    packageMetadata: Pick<Package.PackageMetadata, 'id'>
  ): Promise<(Package.SnippetMetadata | Package.PackageMetadata | Package.DrawingMetadata | Package.TextMetadata)[]> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const value = await this.database.getAllFromIndex(
      this.metadataStoreName,
      'parentId',
      packageMetadata.id
    )
    return value as (Package.SnippetMetadata | Package.PackageMetadata | Package.DrawingMetadata | Package.TextMetadata)[]
  }

  async fetchPackageMetadata({ id }: Pick<Package.SnippetMetadata, 'id'>): Promise<Package.PackageMetadata> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.metadataStoreName, id)
    if (data === undefined) {
      console.assert(id === Package.Workspace.id, '[LocalPackageDatabase]: Package is undefined', { id })
      throw new Error('[LocalPackageDatabase]: Package is undefined')
    }
    return {
      id: data.id,
      name: data.name,
      type: Package.NodeType.package,
      parentId: data.parentId,
      createdAt: data.createdAt,
      editedAt: data.editedAt,
    }
  }

  // --- DRAWING METHODS ---
  async createDrawingMetadata(drawingMetadata: Package.DrawingMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.metadataStoreName, {
      id: drawingMetadata.id,
      createdAt: drawingMetadata.createdAt,
      editedAt: drawingMetadata.editedAt,
      name: drawingMetadata.name,
      parentId: drawingMetadata.parentId,
      type: drawingMetadata.type,
    })
  }

  async createDrawingContent(drawingContent: Package.DrawingContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.contentStoreName, {
      id: drawingContent.id,
      content: drawingContent.sceneData,
    })
  }

  async fetchDrawingMetadata(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<Package.DrawingMetadata> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.metadataStoreName, drawingMetadata.id)
    if (!data) throw new Error(`[LocalPackageDatabase] Drawing metadata Not Found (ID: ${drawingMetadata.id})`)
    return {
      id: data.id,
      name: data.name,
      type: Package.NodeType.drawing,
      parentId: data.parentId,
      createdAt: data.createdAt,
      editedAt: data.editedAt,
    }
  }

  async fetchDrawingContent(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<Package.DrawingContent> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.contentStoreName, drawingMetadata.id)
    if (!data) throw new Error(`[LocalPackageDatabase] Drawing content Not Found (ID: ${drawingMetadata.id})`)
    return {
      id: drawingMetadata.id,
      sceneData: data.content,
    }
  }

  async updateDrawingMetadata(drawingMetadata: Package.DrawingMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.metadataStoreName, 'readwrite')
    const data = await txn.store.get(drawingMetadata.id)
    if (!data) throw new Error(`[LocalPackageDatabase] Drawing Not Found: ID("${drawingMetadata.id}")`)
    await txn.store.put({ ...data, ...drawingMetadata })
    await txn.done
  }

  async updateDrawingContent(drawingContent: Package.DrawingContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.contentStoreName, 'readwrite')
    const content = await txn.store.get(drawingContent.id)
    if (!content) throw new Error(`[LocalPackageDatabase] Drawing Not Found: ID("${drawingContent.id}")`)
    await txn.store.put({ ...content, content: drawingContent.sceneData })
    await txn.done
  }

  async deleteDrawingMetadata(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, drawingMetadata.id)
  }

  async deleteDrawingContent(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.contentStoreName, drawingMetadata.id)
  }

  // --- TEXT METHODS ---
  async createTextMetadata(textMetadata: Package.TextMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.metadataStoreName, {
      id: textMetadata.id,
      createdAt: textMetadata.createdAt,
      editedAt: textMetadata.editedAt,
      name: textMetadata.name,
      parentId: textMetadata.parentId,
      type: textMetadata.type,
    })
  }

  async createTextContent(textContent: Package.TextContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.contentStoreName, {
      id: textContent.id,
      content: textContent.lexicalData,
    })
  }

  async fetchTextMetadata(text: Pick<Package.TextMetadata, 'id'>): Promise<Package.TextMetadata> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.metadataStoreName, text.id) as Package.TextMetadata | undefined
    if (data === undefined) {
      throw new Error(`[LocalPackageDatabase]: Text metadata not found for id: ${text.id}`)
    }
    return {
      id: data.id,
      name: data.name,
      type: Package.NodeType.text,
      parentId: data.parentId,
      createdAt: data.createdAt,
      editedAt: data.editedAt,
    }
  }

  async fetchTextContent(text: Pick<Package.TextMetadata, 'id'>): Promise<Package.TextContent> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.contentStoreName, text.id)
    if (!data) throw new Error(`[LocalPackageDatabase] Text content not found for id: ${text.id}`)
    return {
      id: text.id,
      lexicalData: data.content,
    }
  }

  async updateTextMetadata(textMetadata: Package.TextMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.metadataStoreName, 'readwrite')
    const existing = await txn.store.get(textMetadata.id)
    if (!existing) throw new Error(`Cannot update text metadata, does not exist: ${textMetadata.id}`)
    await txn.store.put({ ...existing, ...textMetadata })
    await txn.done
  }

  async updateTextContent(textContent: Package.TextContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const txn = this.database.transaction(this.contentStoreName, 'readwrite')
    const existing = await txn.store.get(textContent.id)
    if (!existing) throw new Error(`Cannot update text content, does not exist: ${textContent.id}`)
    await txn.store.put({ ...existing, content: textContent.lexicalData })
    await txn.done
  }

  async deleteTextMetadata(text: Pick<Package.TextMetadata, 'id'>): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, text.id)
  }

  async deleteTextContent(text: Pick<Package.TextMetadata, 'id'>): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.contentStoreName, text.id)
  }

  
}

let localPackageDatabaseInstance: LocalPackageDatabase
export const useLocalPackageDatabase = (id: string) => {
  if (localPackageDatabaseInstance === undefined) {
    localPackageDatabaseInstance = new LocalPackageDatabase({ id })
  }
  return localPackageDatabaseInstance
}

export async function updateTextMetadata(
  textMetadata: Package.TextMetadata,
  database: PackageDatabase,
  state: PackageState
): Promise<void> {
  if (!textMetadata.id || !textMetadata.name) {
    throw new Error('Invalid text metadata: missing required fields')
  }

  try {
    await database.updateTextMetadata(textMetadata)
    
    state.setTextMetadata(textMetadata)
  } catch (error) {
    console.error('Failed to update text metadata:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to update text metadata: ${error.message}`)
    } else {
      throw new Error('Failed to update text metadata: Unknown error')
    }
  }
}

