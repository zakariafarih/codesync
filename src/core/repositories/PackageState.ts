import type { Package } from '../entities/Package'

export enum SnippetStatus {
  Creating = 'Creating',
  ContentLoading = 'ContentLoading',
  ContentLoaded = 'Default',
  ChangesUnsaved = 'ChangesUnsaved',
  ChangesSaving = 'ChangesSaving',
  ChangesSaved = 'Default',
  Deleting = 'Deleting',
  Deleted = 'Deleted',
  Default = 'Default',
}

export enum PackageStatus {
  Loading = 'Loading',
  Creating = 'Creating',
  Default = 'Default',
  ContentLoading = 'ContentLoading',
  Deleting = 'Deleting',
  Deleted = 'Deleted',
}

export enum DrawingStatus {
  Creating = 'Creating',
  ContentLoading = 'ContentLoading',
  ContentLoaded = 'Default',
  ChangesUnsaved = 'ChangesUnsaved',
  ChangesSaving = 'ChangesSaving',
  ChangesSaved = 'Default',
  Deleting = 'Deleting',
  Deleted = 'Deleted',
  Default = 'Default',
  Loading = 'Loading', 
  Error = 'Error'
}

export enum TextStatus {
  Creating = 'Creating',
  ContentLoading = 'ContentLoading',
  ContentLoaded = 'Default',
  ChangesUnsaved = 'ChangesUnsaved',
  ChangesSaving = 'ChangesSaving',
  ChangesSaved = 'Default',
  Deleting = 'Deleting',
  Deleted = 'Deleted',
  Default = 'Default',
}

export interface PackageState {
  setSnippetContent(snippetContent: Package.SnippetContent): void
  setSnippetMetadata(snippetMetadata: Package.SnippetMetadata): void
  setPackageMetadata(packageMetadata: Package.PackageMetadata): void

  setSnippetStatus(snippet: Pick<Package.Node, 'id'>, status: SnippetStatus): void
  setPackageStatus(packageMetadata: Pick<Package.Node, 'id'>, status: PackageStatus): void

  deleteSnippetContent(snippet: Pick<Package.Node, 'id'>): void
  deleteSnippetMetadata(snippet: Pick<Package.Node, 'id'>): void
  deletePackageMetadata(packageMetadata: Pick<Package.Node, 'id'>): void

  setDrawingMetadata(drawingMetadata: Package.DrawingMetadata): void
  setDrawingContent(drawingContent: Package.DrawingContent): void
  setDrawingStatus(drawing: Pick<Package.Node, 'id'>, status: DrawingStatus): void

  deleteDrawingMetadata(drawing: Pick<Package.Node, 'id'>): void
  deleteDrawingContent(drawing: Pick<Package.Node, 'id'>): void

  setTextMetadata(textMetadata: Package.TextMetadata): void
  setTextContent(textContent: Package.TextContent): void
  setTextStatus(text: Pick<Package.Node, 'id'>, status: TextStatus): void

  deleteTextMetadata(text: Pick<Package.Node, 'id'>): void
  deleteTextContent(text: Pick<Package.Node, 'id'>): void
}
