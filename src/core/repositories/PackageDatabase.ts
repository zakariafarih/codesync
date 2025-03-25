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
  fetchPackageContent(
    packageMetadata: Pick<Package.PackageMetadata, 'id'>
  ): Promise<(Package.SnippetMetadata | Package.PackageMetadata | Package.DrawingMetadata | Package.TextMetadata)[]>
  fetchPackageMetadata(packageMetadata: Pick<Package.PackageMetadata, 'id'>): Promise<Package.PackageMetadata>

  createDrawingMetadata(drawingMetadata: Package.DrawingMetadata): Promise<void>
  createDrawingContent(drawingContent: Package.DrawingContent): Promise<void>
  fetchDrawingMetadata(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<Package.DrawingMetadata>
  fetchDrawingContent(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<Package.DrawingContent>
  updateDrawingMetadata(drawingMetadata: Package.DrawingMetadata): Promise<void>
  updateDrawingContent(drawingContent: Package.DrawingContent): Promise<void>
  deleteDrawingMetadata(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<void>
  deleteDrawingContent(drawingMetadata: Pick<Package.DrawingMetadata, 'id'>): Promise<void>

  createTextMetadata(textMetadata: Package.TextMetadata): Promise<void>
  createTextContent(textContent: Package.TextContent): Promise<void>
  updateTextMetadata(textMetadata: Package.TextMetadata): Promise<void>
  updateTextContent(textContent: Package.TextContent): Promise<void>
  deleteTextMetadata(text: Pick<Package.TextMetadata, 'id'>): Promise<void>
  deleteTextContent(text: Pick<Package.TextMetadata, 'id'>): Promise<void>
  fetchTextMetadata(text: Pick<Package.TextMetadata, 'id'>): Promise<Package.TextMetadata>
  fetchTextContent(text: Pick<Package.TextMetadata, 'id'>): Promise<Package.TextContent>
}
