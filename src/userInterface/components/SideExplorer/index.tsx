import React, { useEffect, useState } from 'react'
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
import { useNavigate } from 'react-router-dom'
import { useDrawingAdapter } from '../../../adapters/DrawingAdapter'

// Drag & Drop move functions and supporting hooks
import { moveSnippet } from '../../../core/usecases/Snippet'
import { movePackage } from '../../../core/usecases/Package'
import { moveDrawing } from '../../../core/usecases/Drawing'
import { useLocalPackageDatabase } from '../../../infrastructure/databases/LocalPackageDatabase'
import { useReduxPackageState } from '../../../infrastructure/state/PackageState'

export interface SideExplorerProps {
  workspace: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

interface ExplorerItemsProps {
  packageName: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

interface SnippetProps {
  snippet: Package.SnippetMetadata;
  openSnippet: (node: Package.SnippetMetadata) => void;
}

interface DrawingProps {
  drawing: Package.DrawingMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

interface PackageProps {
  packageName: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata) => void;
}

/** 
 * SideExplorer displays the workspace header and action buttons, then renders FolderItems.
 */
export function SideExplorer({ workspace, openSnippet }: SideExplorerProps) {
  const { createSnippet, createPackage, createDrawing } = usePackageAdapter(workspace)
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isDrawingModalOpen, setDrawingModalOpen] = useState(false)

  const handleDrawingModalOk = (name: string) => {
    createDrawing({ name })
    setDrawingModalOpen(false)
  }
  const createNewDrawing = () => setDrawingModalOpen(true)
  const createNewSnippet = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsSnippetModalOpen(true)
  }
  const createNewPackage = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsPackageModalOpen(true)
  }

  return (
    <>
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
          <EditOutlined
            className={style.iconButton}
            title={`Create new drawing in ${workspace.name}`}
            onClick={createNewDrawing}
          />
        </div>
      </div>

      <FolderItems packageName={workspace} openSnippet={openSnippet} />

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

      <CreateModal
        title="Create New Drawing"
        isOpen={isDrawingModalOpen}
        onOk={handleDrawingModalOk}
        onCancel={() => setDrawingModalOpen(false)}
        placeholder="Enter drawing name"
      />
    </>
  )
}

/** 
 * FolderItems renders the contents of a package.
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
          return <Snippet key={item.id} snippet={item} openSnippet={openSnippet} />
        case Package.NodeType.package:
          return <PackageItem key={item.id} packageName={item} openSnippet={openSnippet} />
        case Package.NodeType.drawing:
          return <DrawingItem key={item.id} drawing={item} openSnippet={openSnippet} />
        default:
          return <div key={(item as any).id}>Unknown node type</div>
        }
      })}
    </>
  )
}

/** 
 * Snippet component – draggable snippet row.
 */
export function Snippet({ snippet, openSnippet }: SnippetProps) {
  const { deleteSnippet, downloadSnippet } = useSnippetAdapter(snippet)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const deleteThisSnippet = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDeleteModalOpen(true)
  }

  const downloadThisSnippet = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    downloadSnippet()
  }

  return (
    <div className={`${style.file} ${isDragging ? style.dragging : ''}`}
      draggable
      onDragStart={(e) => {
        setIsDragging(true)
        e.stopPropagation()
        const data = { type: 'snippet', id: snippet.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className={`${style.name} ${style.entry}`}
        onClick={() => openSnippet(snippet)}>
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

/** 
 * DrawingItem component – draggable drawing row.
 */
export function DrawingItem({ drawing, openSnippet }: DrawingProps) {
  const { removeDrawing } = useDrawingAdapter(drawing)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = () => {
    openSnippet(drawing)
  }

  const deleteThisDrawing = async () => {
    try {
      await removeDrawing()
      setIsDeleteModalOpen(false)
    } catch (err) {
      console.error('Failed to delete drawing:', err)
    }
  }

  return (
    <div className={`${style.file} ${isDragging ? style.dragging : ''}`}
      draggable
      onDragStart={(e) => {
        setIsDragging(true)
        e.stopPropagation()
        const data = { type: 'drawing', id: drawing.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className={`${style.name} ${style.entry}`}
        onClick={handleClick}>
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
        onOk={deleteThisDrawing}
        onCancel={() => setIsDeleteModalOpen(false)}
        itemName={drawing.name}
      />
    </div>
  )
}

/** 
 * PackageItem component – draggable package row with nested drop target.
 */
export function PackageItem({ packageName, openSnippet }: PackageProps) {
  // Get expansion state and adapter data (including ansestors)
  const isExpanded = useAppSelector(selectFolderExpansionState(packageName))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { createPackage, createSnippet, createDrawing, deletePackage, renamePackage, ansestors } =
    usePackageAdapter(packageName)

  // Local modal states
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Drag & drop states
  const [isDragging, setIsDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  const localDB = useLocalPackageDatabase('db1')
  const directoryState = useReduxPackageState(dispatch)

  // --- DRAG / DROP HANDLERS FOR THE PACKAGE ITEM ---

  // Header drag handlers – package as drag source
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true)
    e.stopPropagation()
    const data = { type: 'package', id: packageName.id }
    e.dataTransfer.setData('application/json', JSON.stringify(data))
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false)
  }

  // Drop target on the child container
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDropTarget) {
      setIsDropTarget(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropTarget(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropTarget(false)
    try {
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return
      const data = JSON.parse(raw)
      // If the dragged item is a package, prevent dropping it into its own descendant.
      if (data.type === 'package') {
        // Check if the dragged package is the same as this target or one of its ancestors.
        if (data.id === packageName.id || (ansestors && ansestors.some(a => a.id === data.id))) {
          console.warn('Cannot drop a package into its descendant.')
          return
        }
      }
      switch (data.type) {
      case 'snippet':
        await moveSnippet(data.id, packageName.id, localDB, directoryState)
        break
      case 'drawing':
        await moveDrawing(data.id, packageName.id, localDB, directoryState)
        break
      case 'package':
        await movePackage(data.id, packageName.id, localDB, directoryState)
        break
      }
    } catch (err) {
      console.error('Drop failed:', err)
    }
  }

  // --- action handlers ---
  const handleFolderClick = () => {
    dispatch(toggleExpansion(packageName))
  }

  const deleteThisPackage = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDeleteModalOpen(true)
  }

  const createNewSnippet = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsSnippetModalOpen(true)
  }

  const createNewPackage = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsPackageModalOpen(true)
  }

  const createNewDrawing = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    const name = prompt('Enter name for new Drawing:', 'Untitled Drawing')
    if (name) {
      createDrawing({ name })
        .then(() => console.log('Drawing created successfully.'))
        .catch((err) => console.error('Failed to create drawing:', err))
    }
  }

  const openPackageInEditor = async () => {
    navigate(`/editor/${packageName.parentId}/${packageName.id}`)
  }

  const renameThisPackage = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.preventDefault()
    const newName = prompt(`Rename package: ${packageName.name}`, packageName.name)
    if (newName) {
      renamePackage(newName)
    }
  }

  return (
    <div className={style.folder}>
      {/* Package header – draggable */}
      <div
        className={`${style.name} ${style.entry} ${isDragging ? style.dragging : ''}`}
        onClick={handleFolderClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={style.left}>
          <span className={isExpanded ? `${style.icon} ${style.turn90}` : style.icon}>
            <RightOutlined />
          </span>
          <span>{packageName.name}</span>
        </div>
        <div className={style.right}>
          <span className={style.iconButton} title="New Drawing" onClick={createNewDrawing}>
            <EditOutlined />
          </span>
          <span className={style.iconButton} title="New Snippet" onClick={createNewSnippet}>
            <FileAddOutlined />
          </span>
          <span className={style.iconButton} title="New Package" onClick={createNewPackage}>
            <FolderAddOutlined />
          </span>
          <span className={style.iconButton} title="Delete Package" onClick={deleteThisPackage}>
            <DeleteOutlined />
          </span>
        </div>
      </div>

      {/* Child container – drop target */}
      <div
        className={`${style.child} ${isDropTarget ? style.canDrop : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isExpanded ? (
          <FolderItems packageName={packageName} openSnippet={openSnippet} />
        ) : null}
      </div>

      {/* Modals */}
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

      <CreateModal
        title="Create New Snippet"
        isOpen={isSnippetModalOpen}
        onOk={(name) => {
          createSnippet({ name })
          setIsSnippetModalOpen(false)
        }}
        onCancel={() => setIsSnippetModalOpen(false)}
        placeholder="Snippet name"
      />

      <CreateModal
        title="Create New Package"
        isOpen={isPackageModalOpen}
        onOk={(name) => {
          createPackage({ name })
          setIsPackageModalOpen(false)
        }}
        onCancel={() => setIsPackageModalOpen(false)}
        placeholder="Package name"
      />
    </div>
  )
}
