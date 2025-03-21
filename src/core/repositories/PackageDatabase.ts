import type { Package } from '../entities/Package'

export interface Database {
  id: string
}

export interface PackageDatabase extends Database {
  createSnippetContent(snippetContent: Package.SnippetContent): Promise<void>
  createSnippetMetadata(snippetMetadata: Package.SnippetMetadata): Promise<void>
  createPackageMetadata(packageMetadata: Package.PackageMetadata): Promise<void>

  updateSnippetContent(snippetContent: Package.SnippetContent): Promise<void>
  updateSnippetMetadata(snippetMetadata: Package.SnippetMetadata): Promise<void>
  updatePackageMetadata(packageMetadata: Package.PackageMetadata): Promise<void>

  deleteSnippetContent(snippet: Pick<Package.SnippetMetadata, 'id'>): Promise<void>
  deleteSnippetMetadata(snippet: Pick<Package.SnippetMetadata, 'id'>): Promise<void>
  deletePackageMetadata(packageMetadata: Pick<Package.PackageMetadata, 'id'>): Promise<void>
  
  fetchSnippetContent(snippet: Pick<Package.SnippetMetadata, 'id'>): Promise<Package.SnippetContent>
  fetchSnippetMetadata(snippet: Pick<Package.SnippetMetadata, 'id'>): Promise<Package.SnippetMetadata>
  fetchPackageContent(packageMetadata: Pick<Package.PackageMetadata, 'id'>): Promise<(Package.SnippetMetadata | Package.PackageMetadata)[]>
  fetchPackageMetadata(packageMetadata: Pick<Package.PackageMetadata, 'id'>): Promise<Package.PackageMetadata>
}
