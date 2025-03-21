import { ReactComponent as ChevronRightIcon } from '../../icons/chevron-right.svg'
import { ReactComponent as FileIcon } from '../../icons/file.svg'
import style from './index.module.scss'
import { useAppDispatch, useAppSelector } from '../../../infrastructure/state/app/hooks'
import { selectFolderExpansionState, toggleExpansion } from '../../../infrastructure/state/sideExplorerSlice'
import { Package as PackageEntity } from '../../../core/entities/Package'
import { useEffect } from 'react'
import { usePackageAdapter, useSnippetAdapter } from '../../../adapters/PackageAdapter'
import { PackageStatus } from '../../../core/repositories/PackageState'
import { CloudDownloadOutlined, DeleteOutlined, FileAddOutlined, FolderAddOutlined } from '@ant-design/icons'
import { Empty } from 'antd'

interface PackageProps {
  packageName: PackageEntity.PackageMetadata
  openSnippet: (snippet: PackageEntity.SnippetMetadata) => void
}

interface SnippetProps {
  snippet: PackageEntity.SnippetMetadata
  openSnippet: (snippet: PackageEntity.SnippetMetadata) => void
}

interface ExplorerItemsProps {
  packageName: PackageEntity.PackageMetadata
  openSnippet: (snippet: PackageEntity.SnippetMetadata) => void
}

interface SideExplorerProps {
  workspace: PackageEntity.PackageMetadata
  openSnippet: (snippet: PackageEntity.SnippetMetadata) => void
}

export function SideExplorer({ workspace, openSnippet }: SideExplorerProps) {
  const { createSnippet, createPackage } = usePackageAdapter(workspace)

  const createNewSnippet = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const snippetName = prompt('Enter Snippet Name')
    if (snippetName === null) return
    createSnippet({ name: snippetName })
  }

  const createNewPackage = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const packageName = prompt('Enter Package Name')
    if (packageName === null) return
    createPackage({ name: packageName })
  }

  return <>
    <div className={style.workspaceName}>
      <div className={style.left}>
        <span>{workspace.name}</span>
      </div>
      <div className={style.right}>
        <FolderAddOutlined
          className={style.iconButton}
          title={`Create new package in ${workspace.name}`}
          onClick={createNewPackage}
        />
        <FileAddOutlined
          className={style.iconButton}
          title={`Create new snippet in ${workspace.name}`}
          onClick={createNewSnippet}
        />
      </div>
    </div>

    <FolderItems packageName={workspace} openSnippet={openSnippet} />
  </>
}

export function FolderItems({ packageName, openSnippet }: ExplorerItemsProps) {
  const { fetchPackageContent, packageContent, packageStatus } = usePackageAdapter(packageName)

  useEffect(fetchPackageContent, [])

  if (packageStatus === PackageStatus.ContentLoading) {
    return <div>Loading...</div>
  }

  return <>
    {packageContent.length === 0 &&
      <Empty className={style.empty} description="Package Empty" />
    }
    {packageContent.map(item => {
      if (item.type === PackageEntity.NodeType.snippet)
        return <Snippet key={item.id} snippet={item} openSnippet={openSnippet} />
      else
        return <PackageItem key={item.id} packageName={item} openSnippet={openSnippet} />
    })}
  </>
}

export function Snippet({ snippet, openSnippet }: SnippetProps) {
  const { deleteSnippet, downloadSnippet } = useSnippetAdapter(snippet)

  const deleteThisSnippet = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const isConfirmedDelete = confirm(`Permanently Delete Snippet: ${snippet.name}`)
    if (!isConfirmedDelete) return
    deleteSnippet()
  }

  const downloadThisSnippet = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    downloadSnippet()
  }

  return (
    <div className={style.file}>
      <div className={`${style.name} ${style.entry}`} onClick={() => openSnippet(snippet)}>
        <div className={style.left}>
          <span className={style.icon}><FileIcon /></span>
          <span>{snippet.name}</span>
        </div>
        <div className={style.right}>
          <DeleteOutlined
            className={style.iconButton}
            title={`Delete Snippet: ${snippet.name}`}
            onClick={deleteThisSnippet}
          />
          <CloudDownloadOutlined
            className={style.iconButton}
            title={`Download ${snippet.name}`}
            onClick={downloadThisSnippet}
          />
        </div>
      </div>
    </div>
  )
}

export function PackageItem({ packageName, openSnippet }: PackageProps) {
  const isExpanded = useAppSelector(selectFolderExpansionState(packageName))
  const dispatch = useAppDispatch()
  const { createPackage, createSnippet, deletePackage } = usePackageAdapter(packageName)

  const deleteThisPackage = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const isConfirmedDelete = confirm(`Permanently Delete Package: ${packageName.name}`)
    if (!isConfirmedDelete) return
    deletePackage()
  }

  const createNewSnippet = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const snippetName = prompt('Enter Snippet Name')
    if (snippetName === null) return
    createSnippet({ name: snippetName })
  }

  const createNewPackage = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const packageNameInput = prompt('Enter Package Name')
    if (packageNameInput === null) return
    createPackage({ name: packageNameInput })
  }

  const handleFolderClick = () => {
    dispatch(toggleExpansion(packageName))
  }

  return (
    <div className={style.folder}>
      <div className={`${style.name} ${style.entry}`} onClick={handleFolderClick}>
        <div className={style.left}>
          <span className={isExpanded ? `${style.icon} ${style.turn90}` : `${style.icon}`}>
            <ChevronRightIcon />
          </span>
          <span>{packageName.name}</span>
        </div>
        <div className={style.right}>
          <DeleteOutlined
            className={style.iconButton}
            title={`Delete Package: ${packageName.name}`}
            onClick={deleteThisPackage}
          />
          <FolderAddOutlined
            className={style.iconButton}
            title={`Create new package in ${packageName.name}`}
            onClick={createNewPackage}
          />
          <FileAddOutlined
            className={style.iconButton}
            title={`Create new snippet in ${packageName.name}`}
            onClick={createNewSnippet}
          />
        </div>
      </div>
      <div className={style.child}>
        {isExpanded ? <FolderItems packageName={packageName} openSnippet={openSnippet} /> : null}
      </div>
    </div>
  )
}
