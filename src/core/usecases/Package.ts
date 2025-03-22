import { Package } from '../entities/Package'
import { PackageDatabase } from '../repositories/PackageDatabase'
import { PackageState, PackageStatus } from '../repositories/PackageState'
import { deleteDrawing } from './Drawing'
import { deleteSnippet } from './Snippet'

export type createPackageParams = {
  name: Package.PackageMetadata['name'],
  parentId?: Package.PackageMetadata['parentId']
}

export const createPackage = async (
  params: createPackageParams,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.PackageMetadata> => {

  const packageId = String(Date.now())

  const pkg: Package.PackageMetadata = {
    type: Package.NodeType.package,
    id: packageId,
    name: params.name,
    parentId: params.parentId || Package.Workspace.id,
    editedAt: Date.now(),
    createdAt: Date.now()
  }

  state.setPackageMetadata(pkg)
  state.setPackageStatus(pkg, PackageStatus.Creating)
  await database.createPackageMetadata(pkg)
  state.setPackageStatus(pkg, PackageStatus.Default)

  return pkg
}

export const fetchPackageContent = async (
  pkg: Pick<Package.PackageMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.PackageContent> => {

  state.setPackageStatus(pkg, PackageStatus.ContentLoading)

  const nodes: Package.PackageContent = await database.fetchPackageContent(pkg)

  nodes.forEach(node => {
    if (node.type === Package.NodeType.snippet)
      state.setSnippetMetadata(node as Package.SnippetMetadata)
    else
      state.setPackageMetadata(node as Package.PackageMetadata)
  })

  state.setPackageStatus(pkg, PackageStatus.Default)

  return nodes
}

export const deletePackage = async (
  pkg: Pick<Package.PackageMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
) => {
  state.setPackageStatus(pkg, PackageStatus.Deleting)
  const nodes: Package.PackageContent = await fetchPackageContent(pkg, database, state)

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === Package.NodeType.package) {
      // Recursively delete sub-packages.
      await deletePackage(node as Package.PackageMetadata, database, state)
    } else if (node.type === Package.NodeType.snippet) {
      // Delete snippet nodes.
      await deleteSnippet(node as Package.SnippetMetadata, database, state)
    } else if (node.type === Package.NodeType.drawing) {
      // Delete drawing nodes.
      await deleteDrawing(node as Package.DrawingMetadata, database, state)
    }
  }

  await database.deletePackageMetadata(pkg)
  state.deletePackageMetadata(pkg)
  state.setPackageStatus(pkg, PackageStatus.Deleted)
}

export const fetchAncestors = async (
  node: Pick<Package.Node, 'id' | 'parentId'>,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.PackageMetadata[]> => {

  if (node.id === Package.Workspace.id) return []

  const parents: Package.PackageMetadata[] = []
  let parent: Package.PackageMetadata

  do {
    parent = await fetchParentMetadata(node, database, state)
    parents.push(parent)
    node = parent
  } while (parent.id != Package.Workspace.id)

  parents.reverse()

  return parents
}

export const fetchParentMetadata = async (
  node: Pick<Package.Node, 'id' | 'parentId'>,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.PackageMetadata> => {

  if (node.parentId === Package.Workspace.id) return Package.Workspace
  const parentMetadata = await fetchPackageMetadata({ id: node.parentId }, database, state)
  return parentMetadata
}

export const fetchPackageMetadata = async (
  packageMetadataPartial: Pick<Package.SnippetMetadata, 'id'>,
  database: PackageDatabase,
  state: PackageState
): Promise<Package.PackageMetadata> => {

  if (packageMetadataPartial.id === Package.Workspace.id) return Package.Workspace

  state.setPackageStatus(packageMetadataPartial, PackageStatus.Loading)
  const packageMetadata = await database.fetchPackageMetadata(packageMetadataPartial)
  state.setPackageMetadata(packageMetadata)
  state.setPackageStatus(packageMetadataPartial, PackageStatus.Default)

  return packageMetadata
}

export const savePackageMetadata = async (
  pkg: Package.PackageMetadata,
  database: PackageDatabase,
  state: PackageState,
): Promise<void> => {

  state.setPackageStatus(pkg, PackageStatus.Loading)
  pkg.editedAt = Date.now()
  await database.updatePackageMetadata(pkg)
  state.setPackageMetadata(pkg)
  state.setPackageStatus(pkg, PackageStatus.Default)
}
