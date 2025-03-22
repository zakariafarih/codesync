import React, { ReactNode, useEffect, useRef, useState } from 'react'
import {
  RightOutlined,
  FileOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  DeleteOutlined,
  EditOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons'
import { Empty } from 'antd'
import style from './index.module.scss'

// Redux, hooks, store
import { useAppDispatch, useAppSelector } from '../../../infrastructure/state/app/hooks'
import { selectFolderExpansionState, toggleExpansion } from '../../../infrastructure/state/sideExplorerSlice'

// Domain
import { Package } from '../../../core/entities/Package'
import { PackageStatus } from '../../../core/repositories/PackageState'
import { usePackageAdapter, useSnippetAdapter } from '../../../adapters/PackageAdapter'

// UI Components
import { CreateModal } from '../Modal'
import { DeleteModal } from '../DeleteModal'
import { NavLinkPersist } from '../../supports/Persistence'
import { useNavigate } from 'react-router-dom'
import { useDrawingAdapter } from '../../../adapters/DrawingAdapter'

/** The props for the top-level side explorer. */
export interface SideExplorerProps {
  workspace: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

/** The props for Explorer items rendering. */
interface ExplorerItemsProps {
  packageName: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

/** The props for the snippet component. */
interface SnippetProps {
  snippet: Package.SnippetMetadata;
  openSnippet: (node: Package.SnippetMetadata) => void;
}

/** The props for the package item. */
interface PackageProps {
  packageName: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

/** The props for the drawing item. */
interface DrawingProps {
  drawing: Package.DrawingMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

/**
 * Main SideExplorer component:
 * - Renders the workspace name and provides “create new…” icon buttons.
 * - Calls FolderItems to list child items.
 */
export function SideExplorer({ workspace, openSnippet }: SideExplorerProps) {
  const { createSnippet, createPackage, createDrawing } = usePackageAdapter(workspace)
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)

  // For drawings, we prompt the user for a name and then call createDrawing.
  const createNewDrawing = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const name = prompt('Enter name for new Drawing:', 'Untitled Drawing')
    if (name) {
      createDrawing({ name }).catch(err =>
        console.error('Failed to create drawing:', err)
      )
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
          {/* Create new package */}
          <FolderAddOutlined
            className={style.iconButton}
            title={`Create new package in ${workspace.name}`}
            onClick={createNewPackage}
          />
          {/* Create new snippet */}
          <FileAddOutlined
            className={style.iconButton}
            title={`Create new snippet in ${workspace.name}`}
            onClick={createNewSnippet}
          />
          {/* Create new drawing */}
          <span
            className={style.iconButton}
            title="Create new drawing in this package"
            onClick={createNewDrawing}
          >
            <EditOutlined />
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
 * Renders a package’s contents: snippets, packages, and drawings.
 */
export function FolderItems({ packageName, openSnippet }: ExplorerItemsProps) {
  const { fetchPackageContent, packageContent, packageStatus } = usePackageAdapter(packageName)

  useEffect(() => {
    fetchPackageContent()
  }, [packageName.id, fetchPackageContent])

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
        case Package.NodeType.snippet:
          return (
            <Snippet
              key={item.id}
              snippet={item}
              openSnippet={openSnippet}
            />
          )
        case Package.NodeType.package:
          return (
            <PackageItem
              key={item.id}
              packageName={item}
              openSnippet={openSnippet}
            />
          )
        case Package.NodeType.drawing:
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
            <FileOutlined />
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

/** Renders a single drawing row. */
export function DrawingItem({ drawing, openSnippet }: DrawingProps) {
  // Get drawing adapter functions (including removal)
  const { removeDrawing } = useDrawingAdapter(drawing)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleClick = () => {
    // Open the drawing in the editor.
    openSnippet(drawing)
  }

  // Delete function without any event parameter.
  const deleteThisDrawing = async () => {
    try {
      await removeDrawing()
      setIsDeleteModalOpen(false)
      // Optionally refresh package content here.
    } catch (err) {
      console.error('Failed to delete drawing:', err)
    }
  }

  return (
    <div className={style.file}>
      <div className={`${style.name} ${style.entry}`} onClick={handleClick}>
        <div className={style.left}>
          <span className={style.icon}>
            <EditOutlined />
          </span>
          <span>{drawing.name}</span>
        </div>
        <div className={style.right}>
          <DeleteOutlined
            className={style.iconButton}
            title={`Delete Drawing: ${drawing.name}`}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </div>
      </div>
      <DeleteModal
        title="Delete Drawing"
        isOpen={isDeleteModalOpen}
        onOk={deleteThisDrawing} // Pass our parameterless async function here.
        onCancel={() => setIsDeleteModalOpen(false)}
        itemName={drawing.name}
      />
    </div>
  )
}

/** Renders a single package row that can expand to show its children. */
export function PackageItem({ packageName, openSnippet }: PackageProps) {
  const isExpanded = useAppSelector(selectFolderExpansionState(packageName))
  const dispatch = useAppDispatch()
  // Get functions from package adapter, including createDrawing.
  const { createPackage, createSnippet, createDrawing, deletePackage, renamePackage } =
    usePackageAdapter(packageName)
  const navigate = useNavigate()

  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Handler to delete this package.
  const deleteThisPackage = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsDeleteModalOpen(true)
  }

  // Handler to open modal for new snippet.
  const createNewSnippet = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsSnippetModalOpen(true)
  }

  // Handler to open modal for new package.
  const createNewPackage = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    setIsPackageModalOpen(true)
  }

  // NEW: Handler to create a new drawing in this package.
  const createNewDrawing = (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.stopPropagation()
    event.preventDefault()
    const name = prompt('Enter name for new Drawing in this package:', 'Untitled Drawing')
    if (name) {
      createDrawing({ name })
        .then(() => console.log('Drawing created successfully.'))
        .catch((err) => console.error('Failed to create drawing:', err))
    }
  }

  const handleFolderClick = () => {
    dispatch(toggleExpansion(packageName))
  }

  const renameThisPackage = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.preventDefault()
    const newName = prompt(`Enter New Name for package: ${packageName.name}`, packageName.name)
    if (newName) renamePackage(newName)
    return true
  }

  const openPackageInEditor = async () => {
    navigate(`/editor/${packageName.parentId}/${packageName.id}`)
  }

  return (
    <div className={style.folder}>
      <div className={`${style.name} ${style.entry}`} onClick={handleFolderClick}>
        <div className={style.left}>
          <span className={isExpanded ? `${style.icon} ${style.turn90}` : style.icon}>
            <RightOutlined />
          </span>
          <span>{packageName.name}</span>
        </div>
        <div className={style.right}>
          {/* Icon buttons for actions inside the package */}
          <span
            className={style.iconButton}
            title={`New Drawing in ${packageName.name}`}
            onClick={createNewDrawing}
          >
            <EditOutlined />
          </span>
          <span
            className={style.iconButton}
            title={`New Snippet in ${packageName.name}`}
            onClick={createNewSnippet}
          >
            <FileAddOutlined />
          </span>
          <span
            className={style.iconButton}
            title={`New Package in ${packageName.name}`}
            onClick={createNewPackage}
          >
            <FolderAddOutlined />
          </span>
          <span
            className={style.iconButton}
            title={`Delete Package: ${packageName.name}`}
            onClick={deleteThisPackage}
          >
            <DeleteOutlined />
          </span>
        </div>
      </div>
      <div className={style.child}>
        {isExpanded ? (
          // Render children items (snippets, drawings, packages)
          <FolderItems packageName={packageName} openSnippet={openSnippet} />
        ) : null}
      </div>

      {/* Delete package confirmation modal */}
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
