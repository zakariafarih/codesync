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

export interface PackageState {
  setSnippetContent(snippetContent: Package.SnippetContent): void
  setSnippetMetadata(snippetMetadata: Package.SnippetMetadata): void
  setPackageMetadata(packageMetadata: Package.PackageMetadata): void

  setSnippetStatus(snippet: Pick<Package.Node, 'id'>, status: SnippetStatus): void
  setPackageStatus(packageMetadata: Pick<Package.Node, 'id'>, status: PackageStatus): void

  deleteSnippetContent(snippet: Pick<Package.Node, 'id'>): void
  deleteSnippetMetadata(snippet: Pick<Package.Node, 'id'>): void
  deletePackageMetadata(packageMetadata: Pick<Package.Node, 'id'>): void
}
