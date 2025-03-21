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
          const metadataStore = db.createObjectStore(metadataStoreName, {
            keyPath: 'id',
            autoIncrement: true,
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

  async fetchPackageContent(packageMetadata: Package.PackageMetadata): Promise<Package.Node[]> {
    await this.connect()
    if (this.database == null) throw new Error('[LocalPackageDatabase] Database: NULL')
    const value = await this.database.getAllFromIndex(this.metadataStoreName, 'parentId', packageMetadata.id)
    return value
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
