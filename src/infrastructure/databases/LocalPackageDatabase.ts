import { Package } from '../../core/entities/Package'
import { PackageDatabase } from '../../core/repositories/PackageDatabase'
import { openDB, IDBPDatabase, DBSchema } from 'idb'

interface LocalPackageDatabaseSchema extends DBSchema {
  'metadataStore': {
    key: Package.NodeId,
    value: Package.Node,
    indexes: {
      'parentId': Package.NodeId
    }
  },
  'contentStore': {
    value: Package.SnippetContent,
    key: Package.SnippetContent['id'],
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
    const metadataStoreName = this.metadataStoreName
    const contentStoreName = this.contentStoreName

    if (this.database == null) {
      this.database = await openDB<LocalPackageDatabaseSchema>(this.databaseName, 1, {
        upgrade(db) {
          // Make sure autoIncrement is not enabled:
          const metadataStore = db.createObjectStore(metadataStoreName, {
            keyPath: 'id' // autoIncrement is not set!
          })
          metadataStore.createIndex('parentId', 'parentId')
          
          db.createObjectStore(contentStoreName, {
            keyPath: 'id'
          })
        }          
      })
    }
    return this
  }

  async createSnippetContent(snippetContent: Package.SnippetContent): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.contentStoreName, {
      id: snippetContent.id,
      content: snippetContent.content,
    })
  }

  async createSnippetMetadata(snippetMetadata: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
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
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.contentStoreName, snippetMetadata.id) as Package.SnippetContent
    return {
      id: snippetMetadata.id,
      content: data.content,
    }
  }

  async fetchSnippetMetadata(metadata: { id: string }): Promise<Package.SnippetMetadata> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
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

  async deleteSnippetContent(snippetMetadata: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.contentStoreName, snippetMetadata.id)
  }

  async deleteSnippetMetadata(snippetMetadata: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, snippetMetadata.id)
  }

  async createPackageMetadata(packageMetadata: Package.PackageMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.metadataStoreName, {
      id: packageMetadata.id,
      createdAt: packageMetadata.createdAt,
      editedAt: packageMetadata.editedAt,
      name: packageMetadata.name,
      parentId: packageMetadata.parentId,
      type: packageMetadata.type,
    })
  }

  async updateSnippetContent(snippetContent: Package.SnippetContent): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    const tnx = this.database.transaction(this.contentStoreName, 'readwrite')
    const content = await tnx.store.get(snippetContent.id)
    if (content === undefined) throw new Error(`[LocalPackageDatabase] Snippet Not Found: ID("${snippetContent.id}")`)
    await tnx.store.put({ ...content, content: snippetContent.content })
    await tnx.done
  }

  async updateSnippetMetadata(snippetMetadataNew: Package.SnippetMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    const tnx = this.database.transaction(this.metadataStoreName, 'readwrite')
    const snippetMetadata = await tnx.store.get(snippetMetadataNew.id)
    if (snippetMetadata === undefined) throw new Error(`[LocalPackageDatabase] Snippet Not Found: ID("${snippetMetadataNew.id}")`)
    await tnx.store.put({ ...snippetMetadata, ...snippetMetadataNew })
    await tnx.done
  }

  async updatePackageMetadata(packageMetadataNew: Package.PackageMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    const tnx = this.database.transaction(this.metadataStoreName, 'readwrite')
    const packageMetadata = await tnx.store.get(packageMetadataNew.id)
    if (packageMetadata === undefined) throw new Error(`[LocalPackageDatabase] Package Not Found: ID("${packageMetadataNew.id}")`)
    await tnx.store.put({ ...packageMetadata, ...packageMetadataNew })
    await tnx.done
  }

  async deletePackageMetadata(packageMetadata: Package.PackageMetadata): Promise<void> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, packageMetadata.id)
  }

  async fetchPackageContent(
    packageMetadata: Package.PackageMetadata
  ): Promise<Package.Node[]> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
  
    // Grab all metadata records that have parentId = packageMetadata.id
    const value = await this.database.getAllFromIndex(
      this.metadataStoreName,
      'parentId',
      packageMetadata.id
    )
    // 'value' is typed as Package.Node[] because
    // LocalPackageDatabaseSchema['metadataStore'].value = Package.Node
    return value
  }  

  // Inside the LocalPackageDatabase class, just replicate snippet logic:

  async createDrawingContent(drawingContent: Package.DrawingContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.add(this.contentStoreName, {
      id: drawingContent.id,
      content: drawingContent.sceneData,
    })
  }

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

  async fetchDrawingMetadata(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<Package.DrawingMetadata> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const data = await this.database.get(this.metadataStoreName, drawingMetadata.id)
    if (!data) throw new Error(`[LocalPackageDatabase] Drawing metadata Not Found (ID: ${drawingMetadata.id})`)

    // Return it as a DrawingMetadata
    return {
      id: data.id,
      name: data.name,
      type: Package.NodeType.drawing,
      parentId: data.parentId,
      createdAt: data.createdAt,
      editedAt: data.editedAt,
    }
  }

  async updateDrawingContent(drawingContent: Package.DrawingContent): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const tnx = this.database.transaction(this.contentStoreName, 'readwrite')
    const content = await tnx.store.get(drawingContent.id)
    if (!content) throw new Error(`[LocalPackageDatabase] Drawing Not Found: ID("${drawingContent.id}")`)
    await tnx.store.put({
      ...content,
      content: drawingContent.sceneData,
    })
    await tnx.done
  }

  async updateDrawingMetadata(drawingMetadata: Package.DrawingMetadata): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    const tnx = this.database.transaction(this.metadataStoreName, 'readwrite')
    const data = await tnx.store.get(drawingMetadata.id)
    if (!data) throw new Error(`[LocalPackageDatabase] Drawing Not Found: ID("${drawingMetadata.id}")`)

    await tnx.store.put({
      ...data,
      ...drawingMetadata,
    })
    await tnx.done
  }

  async deleteDrawingContent(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.contentStoreName, drawingMetadata.id)
  }

  async deleteDrawingMetadata(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<void> {
    await this.connect()
    if (!this.database) throw new Error('[LocalPackageDatabase] Database: NULL')
    await this.database.delete(this.metadataStoreName, drawingMetadata.id)
  }

  async fetchPackageMetadata({ id }: Pick<Package.SnippetMetadata, 'id'>): Promise<Package.PackageMetadata> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
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
}

let localPackageDatabaseInstance: LocalPackageDatabase
export const useLocalPackageDatabase = (id: string) => {
  if (localPackageDatabaseInstance === undefined) {
    localPackageDatabaseInstance = new LocalPackageDatabase({ id })
  }
  return localPackageDatabaseInstance
}
