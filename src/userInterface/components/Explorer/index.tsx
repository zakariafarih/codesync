import React, { ReactNode, useEffect, useRef, useState } from 'react'
import styles from './index.module.scss'
import { ReactComponent as ChevronRightIcon } from '../../icons/chevron-right.svg'
import { ReactComponent as PackageIcon } from '../../icons/package.svg'
import { ReactComponent as SnippetIcon } from '../../icons/snippet.svg'
import { ReactComponent as TrashIcon } from '../../icons/trash.svg'
import { ReactComponent as RenameIcon } from '../../icons/rename.svg'
import { ReactComponent as LinkExternalIcon } from '../../icons/link-external.svg'
import { ReactComponent as NewSnippetIcon } from '../../icons/new-snippet.svg'
import { ReactComponent as NewPackageIcon } from '../../icons/new-package.svg'
import { ReactComponent as NewDrawingIcon } from '../../icons/new-drawing.svg'
import { ReactComponent as ClearAllIcon } from '../../icons/clear-all.svg'
import { ReactComponent as VMIcon } from '../../icons/vm.svg'
import { ReactComponent as DesktopDownloadIcon } from '../../icons/desktop-download.svg'
import { ReactComponent as AddIcon } from '../../icons/add.svg'
import { ReactComponent as LinkIcon } from '../../icons/link.svg'
import { ContextMenu, ContextMenuOptions } from '../ContextMenu'
import { NavLinkPersist } from '../../supports/Persistence'
import { Package } from '../../../core/entities/Package'
import { useSnippetAdapter, usePackageAdapter } from '../../../adapters/PackageAdapter'
import { PackageStatus } from '../../../core/repositories/PackageState'
import { useNavigate } from 'react-router-dom'
import { CreateModal } from '../Modal'
import { moveSnippet } from '../../../core/usecases/Snippet'
import { movePackage } from '../../../core/usecases/Package'
import { moveDrawing } from '../../../core/usecases/Drawing'
import { useLocalPackageDatabase } from '../../../infrastructure/databases/LocalPackageDatabase'
import { useAppDispatch } from '../../../infrastructure/state/app/hooks'
import { useReduxPackageState } from '../../../infrastructure/state/PackageState'

// --- ExplorerProps and related interfaces ---

export interface ExplorerProps {
  workspace: Package.PackageMetadata
}

interface PackageItemProps {
  package: Package.PackageMetadata
  showContextMenu: (event: React.MouseEvent<Element, MouseEvent>, item: string | ContextMenuOptions) => void
}

interface SnippetProps {
  package: Package.PackageMetadata
  snippet: Package.SnippetMetadata
  showContextMenu: (event: React.MouseEvent<Element, MouseEvent>, item: string | ContextMenuOptions) => void
}

interface DrawingItemProps {
  package: Package.PackageMetadata
  drawing: Package.DrawingMetadata
  showContextMenu: (event: React.MouseEvent<Element, MouseEvent>, item: string | ContextMenuOptions) => void
}

interface ExplorerItemsProps {
  package: Package.PackageMetadata
  showContextMenu: (event: React.MouseEvent<Element, MouseEvent>, item: string | ContextMenuOptions) => void
}

// --- Context Menu Options ---
const breadcrumbContextOptions: ContextMenuOptions = [
  { icon: LinkIcon, text: 'Copy Link' },
  null,
  { icon: LinkExternalIcon, text: 'Open in New Tab' },
  { icon: LinkExternalIcon, text: 'Open in Editor' },
]

const packageContextOptions: ContextMenuOptions = [
  { icon: NewSnippetIcon, text: 'New Snippet' },
  { icon: NewDrawingIcon, text: 'New Drawing' },
  { icon: NewPackageIcon, text: 'New Package' },
  null,
  { icon: RenameIcon, text: 'Rename Package' },
  { icon: TrashIcon, text: 'Delete Package' },
  null,
  { icon: LinkExternalIcon, text: 'Open Package in Editor' },
]

const deviceExplorerContextOptions: ContextMenuOptions = [
  {
    icon: AddIcon,
    text: 'New Device'
  }
]

const deviceContextOptions: ContextMenuOptions = [
  {
    icon: ClearAllIcon,
    text: 'Format Device'
  },
  {
    icon: TrashIcon,
    text: 'Delete Device'
  },
  {
    icon: LinkExternalIcon,
    text: 'Open Device in Editor'
  }
]

// --- Main Explorer Component ---
export function Explorer({ workspace }: ExplorerProps) {
  const { createPackage, fetchPackageContent, createSnippet, createDrawing } = usePackageAdapter(workspace)
  useEffect(fetchPackageContent, [workspace.id])

  const [contextMenu, setContextMenu] = useState<ReactNode>()
  const [isDrawingModalOpen, setDrawingModalOpen] = useState(false)
  const containerRef = useRef(null)
  const itemsRef = useRef(null)

  const [isSnippetModalOpen, setSnippetModalOpen] = useState(false)
  const [isPackageModalOpen, setPackageModalOpen] = useState(false)

  const handleSnippetModalOk = (name: string) => {
    createSnippet({ name })
    setSnippetModalOpen(false)
  }
  const handlePackageModalOk = (name: string) => {
    createPackage({ name })
    setPackageModalOpen(false)
  }
  const handleDrawingModalOk = (name: string) => {
    createDrawing({ name })
    setDrawingModalOpen(false)
  }

  const createNewSnippet = async () => setSnippetModalOpen(true)
  const createNewPackage = async () => setPackageModalOpen(true)
  const createNewDrawing = async () => setDrawingModalOpen(true)

  const itemsExplorerContextOptions: ContextMenuOptions = [
    { icon: NewSnippetIcon, text: 'New Snippet', onClick: createNewSnippet },
    { icon: NewPackageIcon, text: 'New Package', onClick: createNewPackage },
    { icon: NewDrawingIcon, text: 'New Drawing', onClick: createNewDrawing },
  ]

  const showContextMenu = (
    event: React.MouseEvent<Element, MouseEvent>,
    item: string | ContextMenuOptions
  ) => {
    event.preventDefault()
    if (item === 'items') {
      event.stopPropagation()
      const itemsElm: HTMLDivElement = itemsRef.current!
      if (event.pageY >= itemsElm.offsetTop)
        setContextMenu(<ContextMenu options={itemsExplorerContextOptions} hide={hideContextMenu} event={event} />)
    } else if (item === 'devices') {
      event.stopPropagation()
      const itemsElm: HTMLDivElement = itemsRef.current!
      if (event.pageY >= itemsElm.offsetTop)
        setContextMenu(<ContextMenu options={deviceExplorerContextOptions} hide={hideContextMenu} event={event} />)
    } else if (item === 'package') {
      event.stopPropagation()
      setContextMenu(<ContextMenu options={packageContextOptions} hide={hideContextMenu} event={event} />)
    } else if (item === 'device') {
      event.stopPropagation()
      setContextMenu(<ContextMenu options={deviceContextOptions} hide={hideContextMenu} event={event} />)
    } else if (item === 'breadcrumb') {
      event.stopPropagation()
      setContextMenu(<ContextMenu options={breadcrumbContextOptions} hide={hideContextMenu} event={event} />)
    } else if (typeof item !== 'string') {
      event.stopPropagation()
      setContextMenu(<ContextMenu options={item} hide={hideContextMenu} event={event} />)
    } else {
      throw new Error('[Explorer] Context Type Not Found!!')
    }
  }

  const hideContextMenu = () => setContextMenu(<></>)

  return (
    <>
      {contextMenu}
      <div ref={containerRef} className={styles.container} onContextMenu={(event) => showContextMenu(event, itemsExplorerContextOptions)}>
        <BreadCrumbs package={workspace} showContextMenu={showContextMenu} />
        <hr />
        <div ref={itemsRef}>
          <PackageItems package={workspace} showContextMenu={showContextMenu} />
        </div>
      </div>
      <CreateModal
        title="Create New Snippet"
        isOpen={isSnippetModalOpen}
        onOk={handleSnippetModalOk}
        onCancel={() => setSnippetModalOpen(false)}
        placeholder="Enter snippet name"
      />
      <CreateModal
        title="Create New Package"
        isOpen={isPackageModalOpen}
        onOk={handlePackageModalOk}
        onCancel={() => setPackageModalOpen(false)}
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

// --- BreadCrumbs Component ---
export function BreadCrumbs({ package: pkg, showContextMenu }: ExplorerItemsProps) {
  const { ansestors, fetchAncestors } = usePackageAdapter(pkg)
  useEffect(fetchAncestors, [pkg.id])
  if (ansestors.length === 0) {
    return <div>Loading...</div>
  }
  return (
    <div className={styles.breadcrumbs}>
      {ansestors.map((pkg, index) => {
        const breadcrumbTarget = pkg.id === Package.Workspace.id ? '/explorer' : `/explorer/${pkg.parentId}/${pkg.id}`
        return (
          <React.Fragment key={pkg.id}>
            <NavLinkPersist to={breadcrumbTarget} className={styles.breadcrumb} onContextMenu={(event) => showContextMenu(event, 'breadcrumb')}>
              {pkg.name}
            </NavLinkPersist>
            {index !== ansestors.length - 1 ? <ChevronRightIcon /> : null}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// --- FolderItems Component ---
export function PackageItems({ package: pkg, showContextMenu }: ExplorerItemsProps) {
  const { fetchPackageContent, packageContent, packageStatus } = usePackageAdapter(pkg)
  const itemsRef = useRef(null)
  useEffect(fetchPackageContent, [pkg.id])
  if (packageStatus === PackageStatus.ContentLoading || packageStatus === PackageStatus.Creating) {
    return <div>Loading...</div>
  }
  return (
    <div className={styles.items} ref={itemsRef}>
      {packageContent.length === 0 && <div className={styles.emptyFolderShowCase}>This Package is Empty!</div>}
      {packageContent.map(item => {
        if (item.type === Package.NodeType.package) {
          return <PackageItem key={item.id} package={item} showContextMenu={showContextMenu} />
        } else if (item.type === Package.NodeType.snippet) {
          return <Snippet key={item.id} package={pkg} snippet={item as Package.SnippetMetadata} showContextMenu={showContextMenu} />
        } else if (item.type === Package.NodeType.drawing) {
          return <DrawingItem key={item.id} package={pkg} drawing={item as Package.DrawingMetadata} showContextMenu={showContextMenu} />
        } else {
          const unknownNode = item as Package.Node
          return <div key={unknownNode.id}>Unknown Node Type: {unknownNode.type}</div>
        }
      })}
    </div>
  )
}

// --- Snippet Component ---
export function Snippet({ package: pkg, snippet, showContextMenu }: SnippetProps) {
  const { deleteSnippet, renameSnippet, downloadSnippet } = useSnippetAdapter(snippet)
  const renameThisSnippet = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.preventDefault()
    const newName = prompt(`Enter New Name for snippet: ${snippet.name}`, snippet.name)
    if (newName) renameSnippet(newName)
    return true
  }
  const snippetContextOptions: ContextMenuOptions = [
    { icon: RenameIcon, text: 'Rename Snippet', onClick: renameThisSnippet },
    { icon: TrashIcon, text: 'Delete Snippet', onClick: deleteSnippet },
    null,
    { icon: DesktopDownloadIcon, text: 'Download Snippet', onClick: downloadSnippet },
  ]
  return (
    <NavLinkPersist
      to={`/editor/${pkg.parentId}/${pkg.id}/${snippet.id}`}
      className={styles.item}
      onContextMenu={(event) => showContextMenu(event, snippetContextOptions)}
      draggable
      onDragStart={(e) => {
        const data = { type: 'snippet', id: snippet.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
    >
      <SnippetIcon />
      {snippet.name}
    </NavLinkPersist>
  )
}

// --- DrawingItem Component ---
export function DrawingItem({ package: pkg, drawing, showContextMenu }: DrawingItemProps) {
  const drawingContextOptions: ContextMenuOptions = [
    
  ]
  return (
    <NavLinkPersist
      to={`/editor/${pkg.parentId}/${pkg.id}/${drawing.id}`}
      className={styles.item}
      onContextMenu={(event) => showContextMenu(event, drawingContextOptions)}
      draggable
      onDragStart={(e) => {
        const data = { type: 'drawing', id: drawing.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
    >
      <span>{drawing.name}</span>
    </NavLinkPersist>
  )
}

// --- PackageItem Component ---
export function PackageItem({ package: pkg, showContextMenu }: PackageItemProps) {
  const { deletePackage, renamePackage } = usePackageAdapter(pkg)
  const navigate = useNavigate()
  const [isDragOver, setIsDragOver] = useState(false)
  const dispatch = useAppDispatch()
  const localDatabase = useLocalPackageDatabase('db1')
  const directoryState = useReduxPackageState(dispatch)

  const renameThisPackage = async (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    event.preventDefault()
    const newName = prompt(`Enter New Name for package: ${pkg.name}`, pkg.name)
    if (newName) renamePackage(newName)
    return true
  }
  const openPackageInEditor = async () => {
    navigate(`/editor/${pkg.parentId}/${pkg.id}`)
  }
  const packageContextOptions: ContextMenuOptions = [
    { icon: RenameIcon, text: 'Rename Package', onClick: renameThisPackage },
    { icon: TrashIcon, text: 'Delete Package', onClick: deletePackage },
    null,
    { icon: LinkExternalIcon, text: 'Open Package in Editor', onClick: openPackageInEditor },
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const raw = e.dataTransfer.getData('application/json')
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.type === 'snippet') {
      await moveSnippet(data.id, pkg.id, localDatabase, directoryState)
    } else if (data.type === 'drawing') {
      await moveDrawing(data.id, pkg.id, localDatabase, directoryState)
    } else if (data.type === 'package') {
      await movePackage(data.id, pkg.id, localDatabase, directoryState)
    }
  }

  return (
    <NavLinkPersist
      to={`/explorer/${pkg.parentId}/${pkg.id}`}
      className={`${styles.item} ${isDragOver ? styles.dragOver : ''}`}
      onContextMenu={(event) => showContextMenu(event, packageContextOptions)}
      draggable
      onDragStart={(e) => {
        const data = { type: 'package', id: pkg.id }
        e.dataTransfer.setData('application/json', JSON.stringify(data))
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {pkg.id === 'root' ? <VMIcon /> : <PackageIcon />}
      {pkg.name}
    </NavLinkPersist>
  )
}
