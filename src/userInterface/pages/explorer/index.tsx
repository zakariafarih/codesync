import { Explorer } from '../../components/Explorer'
import { Package } from '../../../core/entities/Package'
import { usePackageAdapter } from '../../../adapters/PackageAdapter'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PackageStatus } from '../../../core/repositories/PackageState'

export function ExplorerPage() {
  const { folderId, parentId } = useParams()

  let workspace: Pick<Package.PackageMetadata, 'parentId' | 'id'> = Package.Workspace

  if (folderId && parentId) {
    workspace = { parentId, id: folderId }
  }

  const { fetchPackageMetadata, packageStatus, packageMetadata } = usePackageAdapter(workspace)
  useEffect(fetchPackageMetadata, [])

  if (packageMetadata === undefined || packageStatus === PackageStatus.Loading) {
    return <p>Loading...</p>
  }

  return (
    <Explorer workspace={packageMetadata} />
  )
}
