import { useParams } from 'react-router-dom'
import { Package as PackageEntity } from '../../../core/entities/Package'
import { MonacoEditorWrapper } from '../../components/MonacoEditorWrapper'
import { ExcalidrawEditorWrapper } from '../../components/ExcalidrawEditorWrapper'
import { SideExplorer } from '../../components/SideExplorer'
import { usePackageAdapter } from '../../../adapters/PackageAdapter'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PackageStatus } from '../../../core/repositories/PackageState'
import { FloatingPanel, FloatingPanelRef } from 'antd-mobile'
import { Tabs, TabsProps } from 'antd'
import { useWindowSize } from 'react-use'
import { SubNav } from '../../components/Nav/SubNav'
import { CreateModal } from '../../components/Modal'
import style from './index.module.scss'
import { AboutAppWrapper } from '../../components/AboutAppWrapper'

type TargetKey = React.MouseEvent | React.KeyboardEvent | string

type EditorNode =
  | PackageEntity.SnippetMetadata
  | PackageEntity.DrawingMetadata
  | PackageEntity.PackageMetadata;

export function EditorPage() {
  const { parentId, folderId, fileId } = useParams()

  let workspace: Pick<PackageEntity.PackageMetadata, 'parentId' | 'id'> = PackageEntity.Workspace
  if (parentId && folderId) {
    workspace = { parentId, id: folderId }
  }

  const [files, setFiles] = useState<NonNullable<TabsProps['items']>>([
    {
      key: '-1',
      label: 'About',
      children: <AboutAppWrapper />
    }
  ])
  const [activeFileKey, setActiveFileKey] = useState<string>()
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false)

  const {
    fetchPackageMetadata,
    fetchPackageContent,
    packageStatus,
    packageMetadata,
    packageContent,
    createSnippet,
  } = usePackageAdapter(workspace)

  useEffect(fetchPackageMetadata, [])
  useEffect(fetchPackageContent, [])

  /**
   * `openNodeInEditor` checks the node type (snippet vs drawing).
   * If snippet => <MonacoEditorWrapper/>,
   * If drawing => <ExcalidrawEditorWrapper/>.
   */
  const openNodeInEditor = useMemo(
    () =>
      (node: EditorNode, dynamicPosition = true) => {
        // Now node.type can be snippet, drawing, or package
        const targetIndex = files.findIndex((pane) => pane.key === node.id)
  
        if (targetIndex === -1) {
          let activeIndex = files.findIndex((pane) => pane.key === activeFileKey)
          if (activeIndex === -1 || !dynamicPosition) {
            activeIndex = files.length - 1
          }
  
          let editor
          if (node.type === PackageEntity.NodeType.snippet) {
            editor = <MonacoEditorWrapper snippetMetadata={node} />
          } else if (node.type === PackageEntity.NodeType.drawing) {
            editor = <ExcalidrawEditorWrapper drawingMetadata={node} />
          } else {
            // If we do handle packages in the editor, or fallback to a message
            editor = <div>Package Editor Not Implemented: {node.name}</div>
          }
  
          const newItem = {
            key: node.id,
            label: node.name,
            children: editor,
          }
  
          setFiles([
            ...files.slice(0, activeIndex + 1),
            newItem,
            ...files.slice(activeIndex + 1),
          ])
        }
  
        setActiveFileKey(node.id)
      },
    [files, activeFileKey]
  )

  /**
   * Close a tab
   */
  const closeFile = useMemo(() => (targetKey: TargetKey) => {
    const targetIndex = files.findIndex((pane) => pane.key === targetKey)
    const newPanes = files.filter((pane) => pane.key !== targetKey)
    if (newPanes.length && targetIndex !== -1) {
      // fallback to the previous tab
      const { key } = newPanes[
        targetIndex === newPanes.length ? targetIndex - 1 : targetIndex
      ]
      setActiveFileKey(key)
    }
    setFiles(newPanes)
  }, [files])

  // If we have a `fileId` param, try to open that node if it's a snippet or a drawing
  useEffect(() => {
    packageContent.forEach((node) => {
      if (node.id === fileId) {
        switch (node.type) {
        case PackageEntity.NodeType.snippet:
        case PackageEntity.NodeType.drawing:
          openNodeInEditor(node)
          break
        case PackageEntity.NodeType.package:
          break
        }
        
      }
    })
  }, [packageContent.length])

  // side nav floating or full
  const anchors = [100, window.innerHeight * 0.6]
  const ref = useRef<FloatingPanelRef>(null)
  const { width: windowWidth } = useWindowSize()

  /** Switch tabs */
  const onChangeTab = (key: string) => {
    setActiveFileKey(key)
  }

  /** "add" = create snippet, "remove" = close tab */
  const onEdit = async (targetKey: TargetKey, action: 'add' | 'remove') => {
    if (action === 'add') {
      setIsSnippetModalOpen(true)
    } else {
      closeFile(targetKey)
    }
  }

  if (packageStatus === PackageStatus.Loading) {
    return <p>Loading...</p>
  }
  if (!packageMetadata) {
    return <p>Could not find package</p>
  }

  return (
    <div className={style.container}>
      {windowWidth >= 800 ? (
        <SubNav title='Editor' className={style.sideNav}>
          <SideExplorer
            workspace={packageMetadata}
            openSnippet={(node) => openNodeInEditor(node)}
          />
        </SubNav>
      ) : (
        <FloatingPanel anchors={anchors} ref={ref}>
          <div style={{ padding: '0 16px 16px 16px' }}>
            <SideExplorer
              workspace={packageMetadata}
              openSnippet={(node) => openNodeInEditor(node)}
            />
          </div>
        </FloatingPanel>
      )}
      <Tabs
        className={style.editorArea}
        onChange={onChangeTab}
        activeKey={activeFileKey}
        type="editable-card"
        onEdit={onEdit}
        items={files}
        tabBarGutter={0}
      />
      <CreateModal
        title="Create New Snippet"
        isOpen={isSnippetModalOpen}
        onOk={async (name) => {
          const snippet = await createSnippet({ name })
          openNodeInEditor(snippet, false)
          setIsSnippetModalOpen(false)
        }}
        onCancel={() => setIsSnippetModalOpen(false)}
        placeholder="Enter snippet name"
      />
    </div>
  )
}
