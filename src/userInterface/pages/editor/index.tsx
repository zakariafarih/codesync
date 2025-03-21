import { useParams } from 'react-router-dom'
import { Package as PackageEntity } from '../../../core/entities/Package'
import { MonacoEditorWrapper } from '../../components/MonacoEditorWrapper'
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
    createSnippet
  } = usePackageAdapter(workspace)
  useEffect(fetchPackageMetadata, [])
  useEffect(fetchPackageContent, [])

  const openFile = useMemo(() => (snippet: PackageEntity.SnippetMetadata, dynamicPosition = true) => {
    const targetIndex = files.findIndex((pane) => pane.key === snippet.id)

    if (targetIndex === -1) {
      let activeIndex = files.findIndex((pane) => pane.key === activeFileKey)
      if (activeIndex === -1 || !dynamicPosition) activeIndex = files.length - 1

      setFiles([
        ...files.slice(0, activeIndex + 1),
        {
          key: snippet.id,
          label: snippet.name,
          children: <MonacoEditorWrapper snippetMetadata={snippet} />,
        },
        ...files.slice(activeIndex + 1),
      ])
    }

    setActiveFileKey(snippet.id)
    return
  }, [files, activeFileKey])

  const closeFile = useMemo(() => (targetKey: TargetKey) => {
    const targetIndex = files.findIndex((pane) => pane.key === targetKey)
    const newPanes = files.filter((pane) => pane.key !== targetKey)
    if (newPanes.length && targetIndex !== -1) {
      const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex]
      setActiveFileKey(key)
    }
    setFiles(newPanes)
    return
  }, [files])

  useEffect(() => {
    packageContent.forEach(node => {
      if (node.type === PackageEntity.NodeType.snippet && node.id === fileId) {
        openFile(node)
      }
    })
  }, [packageContent.length])

  const anchors = [100, window.innerHeight * 0.6]
  const ref = useRef<FloatingPanelRef>(null)
  const { width: windowWidth } = useWindowSize()

  const onChange = (key: string) => {
    setActiveFileKey(key)
  }

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

  if (packageMetadata === undefined) {
    return <p>Could not Find Package</p>
  }

  return (
    <div className={style.container}>
      {windowWidth >= 800 ? (
        <SubNav title='Editor' className={style.sideNav}>
          <SideExplorer workspace={packageMetadata} openSnippet={openFile} />
        </SubNav>
      ) : (
        <FloatingPanel anchors={anchors} ref={ref}>
          <div style={{ padding: '0 16px 16px 16px' }}>
            <SideExplorer workspace={packageMetadata} openSnippet={openFile} />
          </div>
        </FloatingPanel>
      )}
      <Tabs
        className={style.editorArea}
        onChange={onChange}
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
          openFile(snippet, false)
          setIsSnippetModalOpen(false)
        }}
        onCancel={() => setIsSnippetModalOpen(false)}
        placeholder="Enter snippet name"
      />
    </div>
  )
}