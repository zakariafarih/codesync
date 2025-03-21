import { ReactComponent as ChevronRightIcon } from '../../icons/chevron-right.svg'
import { ReactComponent as FileIcon } from '../../icons/file.svg'
import { FolderAddOutlined, FileAddOutlined } from '@ant-design/icons'
import { CloudDownloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { Empty } from 'antd'
import { useState, useEffect } from 'react'
import style from './index.module.scss'

// Redux, hooks, store
import { useAppDispatch, useAppSelector } from '../../../infrastructure/state/app/hooks'
import { selectFolderExpansionState, toggleExpansion } from '../../../infrastructure/state/sideExplorerSlice'

// Domain
import { Package as PackageEntity } from '../../../core/entities/Package'
import { PackageStatus } from '../../../core/repositories/PackageState'
import { usePackageAdapter, useSnippetAdapter } from '../../../adapters/PackageAdapter'

// UI Components
import { CreateModal } from '../Modal'
import { DeleteModal } from '../DeleteModal'

/** The props for the top-level side explorer. */
interface SideExplorerProps {
  workspace: PackageEntity.PackageMetadata
  openSnippet: (node: PackageEntity.SnippetMetadata | PackageEntity.DrawingMetadata) => void
}

/** The props for Explorer items rendering. */
interface ExplorerItemsProps {
  packageName: PackageEntity.PackageMetadata
  openSnippet: (node: PackageEntity.SnippetMetadata | PackageEntity.DrawingMetadata) => void
}

/** The props for the snippet component. */
interface SnippetProps {
  snippet: PackageEntity.SnippetMetadata
  openSnippet: (node: PackageEntity.SnippetMetadata) => void
}

/** The props for the package item. */
interface PackageProps {
  packageName: PackageEntity.PackageMetadata
  openSnippet: (node: PackageEntity.SnippetMetadata | PackageEntity.DrawingMetadata) => void
}

/** The props for the drawing item. */
interface DrawingProps {
  drawing: PackageEntity.DrawingMetadata
  openSnippet: (node: PackageEntity.SnippetMetadata | PackageEntity.DrawingMetadata) => void
}

/**
 * The main SideExplorer:
 * - Renders the workspace name
 * - Provides "Create Snippet/Package/Drawing" triggers
 * - Calls <FolderItems> to list child items
 */
export function SideExplorer({ workspace, openSnippet }: SideExplorerProps) {
  const { createSnippet, createPackage, createDrawing } = usePackageAdapter(workspace)

  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)

  /**
   * For drawings, we can either do a separate modal or a direct prompt.
   * Below, we’ll do a simple `prompt` to get the drawing’s name.
   */
  const createNewDrawing = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const name = prompt('Enter name for new Drawing:', 'Untitled Board')
    if (name) {
      createDrawing({ name })
    }
  }

  const createNewSnippet = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsSnippetModalOpen(true)
  }

  const createNewPackage = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsPackageModalOpen(true)
  }

  return (
    <>
      <div className={style.workspaceName}>
        <div className={style.left}>
          <span>{workspace.name}</span>
        </div>
        <div className={style.right}>

          {/* Add icon for creating new package */}
          <FolderAddOutlined
            className={style.iconButton}
            title={`Create new package in ${workspace.name}`}
            onClick={createNewPackage}
          />

          {/* Add icon for creating new snippet */}
          <FileAddOutlined
            className={style.iconButton}
            title={`Create new snippet in ${workspace.name}`}
            onClick={createNewSnippet}
          />

          <span
            className={style.iconButton}
            title="Create new drawing in this package"
            onClick={createNewDrawing}
          >
            📝
          </span>
        </div>
      </div>

      <FolderItems packageName={workspace} openSnippet={openSnippet} />

      {/* Snippet creation modal */}
      <CreateModal
        title="Create New Snippet"
        isOpen={isSnippetModalOpen}
        onOk={(name) => {
          createSnippet({ name })
          setIsSnippetModalOpen(false)
        }}
        onCancel={() => setIsSnippetModalOpen(false)}
        placeholder="Enter snippet name"
      />

      {/* Package creation modal */}
      <CreateModal
        title="Create New Package"
        isOpen={isPackageModalOpen}
        onOk={(name) => {
          createPackage({ name })
          setIsPackageModalOpen(false)
        }}
        onCancel={() => setIsPackageModalOpen(false)}
        placeholder="Enter package name"
      />
    </>
  )
}

/**
 * Renders a package’s contents: snippet/package/drawing.
 */
export function FolderItems({ packageName, openSnippet }: ExplorerItemsProps) {
  const { fetchPackageContent, packageContent, packageStatus } = usePackageAdapter(packageName)

  useEffect(fetchPackageContent, [])

  if (packageStatus === PackageStatus.ContentLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      {packageContent.length === 0 && (
        <Empty className={style.empty} description="Package Empty" />
      )}
      {packageContent.map((item) => {
        switch (item.type) {
        case PackageEntity.NodeType.snippet:
          return (
            <Snippet
              key={item.id}
              snippet={item}
              openSnippet={openSnippet}
            />
          )
        case PackageEntity.NodeType.package:
          return (
            <PackageItem
              key={item.id}
              packageName={item}
              openSnippet={openSnippet}
            />
          )
        case PackageEntity.NodeType.drawing:
          return (
            <DrawingItem
              key={item.id}
              drawing={item}
              openSnippet={openSnippet}
            />
          )
        default:
          return <div key={(item as any).id}>Unknown node type</div>
        }
      })}
    </>
  )
}

/** Renders a single snippet row. */
export function Snippet({ snippet, openSnippet }: SnippetProps) {
  const { deleteSnippet, downloadSnippet } = useSnippetAdapter(snippet)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const deleteThisSnippet = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsDeleteModalOpen(true)
  }

  const downloadThisSnippet = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    downloadSnippet()
  }

  return (
    <div className={style.file}>
      <div
        className={`${style.name} ${style.entry}`}
        onClick={() => openSnippet(snippet)}
      >
        <div className={style.left}>
          <span className={style.icon}>
            <FileIcon />
          </span>
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

      <DeleteModal
        title="Delete Snippet"
        isOpen={isDeleteModalOpen}
        onOk={() => {
          deleteSnippet()
          setIsDeleteModalOpen(false)
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        itemName={snippet.name}
      />
    </div>
  )
}

/** Renders a single drawing row, letting user open it in the editor or rename/delete. */
export function DrawingItem({ drawing, openSnippet }: DrawingProps) {
  // We can use the same “openSnippet” callback here, because
  // the Editor checks “node.type===drawing” => show ExcalidrawEditor
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  // can also do a “downloadDrawing” or “renameDrawing” via a “useDrawingAdapter” if you prefer.

  const handleClick = () => {
    // open the drawing in the editor
    openSnippet(drawing)
  }

  const deleteThisDrawing = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsDeleteModalOpen(true)
  }

  return (
    <div className={style.file}>
      <div className={`${style.name} ${style.entry}`} onClick={handleClick}>
        <div className={style.left}>
          <span className={style.icon}>📝</span>
          <span>{drawing.name}</span>
        </div>
        <div className={style.right}>
          <DeleteOutlined
            className={style.iconButton}
            title={`Delete Drawing: ${drawing.name}`}
            onClick={deleteThisDrawing}
          />
        </div>
      </div>

      <DeleteModal
        title="Delete Drawing"
        isOpen={isDeleteModalOpen}
        onOk={() => {
          // If you have a “useDrawingAdapter” or direct “deleteDrawing()” call, do it here.
          // For example:
          // deleteDrawing(drawing)
          setIsDeleteModalOpen(false)
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        itemName={drawing.name}
      />
    </div>
  )
}

/** A single package row, which can expand to show child items. */
export function PackageItem({ packageName, openSnippet }: PackageProps) {
  const isExpanded = useAppSelector(selectFolderExpansionState(packageName))
  const dispatch = useAppDispatch()
  const { createPackage, createSnippet, deletePackage } = usePackageAdapter(packageName)

  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const deleteThisPackage = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsDeleteModalOpen(true)
  }

  const createNewSnippet = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsSnippetModalOpen(true)
  }

  const createNewPackage = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsPackageModalOpen(true)
  }

  const handleFolderClick = () => {
    dispatch(toggleExpansion(packageName))
  }

  return (
    <div className={style.folder}>
      <div className={`${style.name} ${style.entry}`} onClick={handleFolderClick}>
        <div className={style.left}>
          <span
            className={isExpanded ? `${style.icon} ${style.turn90}` : style.icon}
          >
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
        {isExpanded ? (
          <FolderItems packageName={packageName} openSnippet={openSnippet} />
        ) : null}
      </div>

      {/* Delete package confirm */}
      <DeleteModal
        title="Delete Package"
        isOpen={isDeleteModalOpen}
        onOk={() => {
          deletePackage()
          setIsDeleteModalOpen(false)
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        itemName={packageName.name}
      />

      {/* Create snippet modal */}
      <CreateModal
        title="Create New Snippet"
        isOpen={isSnippetModalOpen}
        onOk={(name) => {
          createSnippet({ name })
          setIsSnippetModalOpen(false)
        }}
        onCancel={() => setIsSnippetModalOpen(false)}
        placeholder="Enter snippet name"
      />

      {/* Create package modal */}
      <CreateModal
        title="Create New Package"
        isOpen={isPackageModalOpen}
        onOk={(name) => {
          createPackage({ name })
          setIsPackageModalOpen(false)
        }}
        onCancel={() => setIsPackageModalOpen(false)}
        placeholder="Enter package name"
      />
    </div>
  )
}
