// src/userInterface/components/SideExplorer/index.tsx

import React, { useEffect, useState } from 'react'
import {
  RightOutlined,
  FileOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  DeleteOutlined,
  EditOutlined,
  CloudDownloadOutlined,
  FileTextOutlined  // NEW: Icon for text items
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
import { useDrawingAdapter } from '../../../adapters/DrawingAdapter'
import { createText } from '../../../core/usecases/Text' // NEW: text usecase
import { useLocalPackageDatabase } from '../../../infrastructure/databases/LocalPackageDatabase'
import { useReduxPackageState } from '../../../infrastructure/state/PackageState'

// UI Components
import { CreateModal } from '../Modal'
import { DeleteModal } from '../DeleteModal'
import { useNavigate } from 'react-router-dom'

// Drag & Drop move functions and supporting hooks
import { moveSnippet } from '../../../core/usecases/Snippet'
import { movePackage } from '../../../core/usecases/Package'
import { moveDrawing } from '../../../core/usecases/Drawing'
import { useTextAdapter } from '../../../adapters/TextAdapter'

export interface SideExplorerProps {
  workspace: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata | Package.TextMetadata) => void;
}

interface ExplorerItemsProps {
  packageName: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata | Package.TextMetadata) => void;
}

interface SnippetProps {
  snippet: Package.SnippetMetadata;
  openSnippet: (node: Package.SnippetMetadata) => void;
}

interface DrawingProps {
  drawing: Package.DrawingMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata | Package.TextMetadata) => void;
}

interface PackageProps {
  packageName: Package.PackageMetadata;
  openSnippet: (node: Package.SnippetMetadata | Package.DrawingMetadata | Package.TextMetadata) => void;
}

// NEW: TextProps for text item component
interface TextProps {
  text: Package.TextMetadata;
  openSnippet: (node: Package.TextMetadata) => void;
}

/** 
 * SideExplorer displays the workspace header and action buttons, then renders FolderItems.
 */
export function SideExplorer({ workspace, openSnippet }: SideExplorerProps) {
  const { createSnippet, createPackage, createDrawing } = usePackageAdapter(workspace)
  const dispatch = useAppDispatch()

  // Local modals for snippet, package, drawing, and now text.
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isDrawingModalOpen, setDrawingModalOpen] = useState(false)
  const [isTextModalOpen, setIsTextModalOpen] = useState(false) // NEW

  // For text creation, we need to access the local database and redux state.
  const localDB = useLocalPackageDatabase('db1')
  const reduxState = useReduxPackageState(dispatch)

  // Handlers for drawing, snippet, package (existing)
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

  // NEW: Handler for creating a new Text item.
  const createNewText = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsTextModalOpen(true)
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
          <FileTextOutlined
            className={style.iconButton}
            title={`Create new text in ${workspace.name}`}
            onClick={createNewText}
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

      {/* NEW: Modal for creating a new Text item */}
      <CreateModal
        title="Create New Text"
        isOpen={isTextModalOpen}
        onOk={async (name) => {
          try {
            // Create new text item using the createText usecase.
            const newText = await createText(
              { name, parentId: workspace.id },
              localDB,
              reduxState
            )
            // Optionally, open the new text in the editor (if your openSnippet function supports text)
            openSnippet(newText)
            setIsTextModalOpen(false)
          } catch (error) {
            console.error('Failed to create text item:', error)
          }
        }}
        onCancel={() => setIsTextModalOpen(false)}
        placeholder="Enter text name"
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
          // NEW: Render text items
        case Package.NodeType.text:
          return <TextItem key={item.id} text={item as Package.TextMetadata} openSnippet={openSnippet} />
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
  const { deleteSnippet, downloadSnippet, renameSnippet } = useSnippetAdapter(snippet)
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

  const handleRename = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    const newName = prompt(`Rename snippet: ${snippet.name}`, snippet.name)
    if (newName && newName !== snippet.name) {
      await renameSnippet(newName)
    }
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
          <EditOutlined
            className={style.iconButton}
            title={`Rename Snippet: ${snippet.name}`}
            onClick={handleRename}
          />
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

export function DrawingItem({ drawing, openSnippet }: DrawingProps) {
  const { removeDrawing, updateDrawing } = useDrawingAdapter(drawing)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      await removeDrawing()
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error('Failed to delete drawing:', error)
      setError('Failed to delete drawing. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRename = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    const newName = prompt(`Rename drawing: ${drawing.name}`, drawing.name)
    if (newName && newName !== drawing.name) {
      await updateDrawing({ ...drawing, name: newName })
    }
  }

  return (
    <div 
      className={`${style.file} ${isDragging ? style.dragging : ''}`}
      draggable
      onDragStart={(e) => {
        setIsDragging(true)
        e.stopPropagation()
        const data = { type: 'drawing', id: drawing.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div 
        className={`${style.name} ${style.entry}`}
        onClick={() => openSnippet(drawing)}
      >
        <div className={style.left}>
          <EditOutlined className={style.icon} />
          <span>{drawing.name}</span>
        </div>
        <div className={style.right}>
          <EditOutlined
            className={style.iconButton}
            title={`Rename Drawing: ${drawing.name}`}
            onClick={handleRename}
          />
          <DeleteOutlined
            className={`${style.iconButton} ${isDeleting ? style.disabled : ''}`}
            title={`Delete Drawing: ${drawing.name}`}
            onClick={handleDelete}
          />
        </div>
      </div>

      <DeleteModal
        title="Delete Drawing"
        isOpen={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setError(null)
        }}
        itemName={drawing.name}
        confirmLoading={isDeleting}
        error={error} // Add error prop to DeleteModal
      />
    </div>
  )
}

/** 
 * PackageItem component – draggable package row with nested drop target.
 */
export function PackageItem({ packageName, openSnippet }: PackageProps) {
  const isExpanded = useAppSelector(selectFolderExpansionState(packageName))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { createPackage, createSnippet, createDrawing, deletePackage, renamePackage, ansestors } =
    usePackageAdapter(packageName)

  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [isDragging, setIsDragging] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  const localDB = useLocalPackageDatabase('db1')
  const directoryState = useReduxPackageState(dispatch)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true)
    e.stopPropagation()
    const data = { type: 'package', id: packageName.id }
    e.dataTransfer.setData('application/json', JSON.stringify(data))
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false)
  }

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
      if (data.type === 'package') {
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

export function TextItem({ text, openSnippet }: TextProps) {
  const { removeText, renameText } = useTextAdapter(text)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleDelete = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDeleteModalOpen(true)
  }

  const handleRename = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation()
    e.preventDefault()
    const newName = prompt(`Rename text: ${text.name}`, text.name)
    if (newName && newName !== text.name) {
      await renameText(newName)
    }
  }

  return (
    <div 
      className={`${style.file} ${isDragging ? style.dragging : ''}`}
      draggable
      onDragStart={(e) => {
        setIsDragging(true)
        e.stopPropagation()
        const data = { type: 'text', id: text.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div 
        className={`${style.name} ${style.entry}`}
        onClick={() => openSnippet(text)}
      >
        <div className={style.left}>
          <FileTextOutlined className={style.icon} />
          <span>{text.name}</span>
        </div>
        <div className={style.right}>
          <EditOutlined
            className={style.iconButton}
            title={`Rename Text: ${text.name}`}
            onClick={handleRename}
          />
          <DeleteOutlined
            className={style.iconButton}
            title={`Delete Text: ${text.name}`}
            onClick={handleDelete}
          />
        </div>
      </div>

      <DeleteModal
        title="Delete Text"
        isOpen={isDeleteModalOpen}
        onOk={async () => {
          await removeText()
          setIsDeleteModalOpen(false)
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        itemName={text.name}
      />
    </div>
  )
}
