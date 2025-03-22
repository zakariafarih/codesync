import React, { useEffect, useRef, useCallback, useState, memo } from 'react'
import { Excalidraw, serializeAsJSON, restore } from '@excalidraw/excalidraw'
import { 
  ExcalidrawImperativeAPI, 
  AppState,
  BinaryFiles,
  NormalizedZoomValue,
  LastActiveTool
} from '@excalidraw/excalidraw/types/types'
import { ChartType, NonDeletedExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import { RestoredDataState } from '@excalidraw/excalidraw/types/data/restore'
import { useDrawingAdapter } from '../../../adapters/DrawingAdapter'
import { Package } from '../../../core/entities/Package'
import style from './index.module.scss'

interface ExcalidrawEditorWrapperProps {
  drawingMetadata: Package.DrawingMetadata
}

// Memoize the forwardRef component to avoid unnecessary re-renders.
const ExcalidrawWithRef = memo(
  React.forwardRef<ExcalidrawImperativeAPI, React.ComponentProps<typeof Excalidraw>>(
    (props, ref) => <Excalidraw ref={ref} {...props} />
  )
)
ExcalidrawWithRef.displayName = 'ExcalidrawWithRef'

const defaultAppState: AppState = {
  activeTool: {
    type: 'selection',
    customType: null,
    lastActiveTool: 'selection' as unknown as LastActiveTool,
    locked: false,
  },
  exportEmbedScene: false,
  exportWithDarkMode: false,
  exportScale: 1,
  currentItemStrokeColor: '#000000',
  currentItemBackgroundColor: 'transparent',
  currentItemFillStyle: 'hachure',
  currentItemStrokeWidth: 1,
  currentItemStrokeStyle: 'solid',
  currentItemRoughness: 1,
  currentItemOpacity: 100,
  currentItemFontFamily: 1,
  currentItemFontSize: 20,
  currentItemTextAlign: 'left',
  currentItemStartArrowhead: null,
  currentItemEndArrowhead: null,
  viewBackgroundColor: '#ffffff',
  exportBackground: true,
  scrollX: 0,
  scrollY: 0,
  width: window.innerWidth,
  height: window.innerHeight,
  offsetTop: 0,
  offsetLeft: 0,
  zoom: { value: 1 as NormalizedZoomValue },
  shouldCacheIgnoreZoom: false,
  showWelcomeScreen: false,
  errorMessage: null,
  gridSize: null,
  theme: 'light',
  name: '',
  contextMenu: null,
  isLoading: false,
  draggingElement: null,
  resizingElement: null,
  multiElement: null,
  selectionElement: null,
  isBindingEnabled: false,
  startBoundElement: null,
  suggestedBindings: [],
  editingElement: null,
  editingLinearElement: null,
  penMode: false,
  penDetected: false,
  selectedElementIds: {},
  selectedGroupIds: {},
  lastPointerDownWith: 'mouse',
  zenModeEnabled: false,
  viewModeEnabled: false,
  cursorButton: 'up',
  scrolledOutside: false,
  pendingImageElementId: null,
  editingGroupId: null,
  selectedLinearElement: null,
  collaborators: new Map(),
  showStats: false,
  currentChartType: 'bar' as ChartType,
  pasteDialog: { shown: false, data: null },
  openSidebar: null,
  openDialog: null,
  isSidebarDocked: false,
  currentItemRoundness: 'round',
  isResizing: false,
  isRotating: false,
  openMenu: null,
  openPopup: null,
  previousSelectedElementIds: {},
  toast: null,
  fileHandle: undefined,
  showHyperlinkPopup: false
}

export const ExcalidrawEditorWrapper = memo(({ drawingMetadata }: ExcalidrawEditorWrapperProps) => {
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const { drawingContent, loadDrawing, saveDrawing, downloadDrawing } = useDrawingAdapter(drawingMetadata)
  
  const [hasLoaded, setHasLoaded] = useState(false)
  const [elements, setElements] = useState<NonDeletedExcalidrawElement[]>([])
  const [appState, setAppState] = useState<AppState>(defaultAppState)

  useEffect(() => {
    if (!hasLoaded) {
      loadDrawing()
        .then(() => setHasLoaded(true))
        .catch((err) => console.error('Error loading drawing:', err))
    }
  }, [loadDrawing, hasLoaded])

  useEffect(() => {
    if (hasLoaded && drawingContent?.sceneData) {
      try {
        const sceneJson = JSON.parse(drawingContent.sceneData)
        const restored = restore(sceneJson, null, null) as RestoredDataState
        if (restored) {
          setElements(restored.elements ?? [])
          if (restored.appState) {
            setAppState((prevState) => ({
              ...prevState,
              ...restored.appState,
              width: window.innerWidth,
              height: window.innerHeight,
            }))
          }
        }
      } catch (err) {
        console.error('[Excalidraw] Failed to load sceneData:', err)
      }
    }
  }, [drawingContent, hasLoaded])

  const onChange = useCallback((elements: readonly NonDeletedExcalidrawElement[], state: AppState, files: BinaryFiles) => {
    const data = serializeAsJSON(elements, state, files, 'local')
    saveDrawing(data)
  }, [saveDrawing])

  const handleDownload = useCallback(() => {
    downloadDrawing()
  }, [downloadDrawing])

  if (!hasLoaded) {
    return <div>Loading drawing...</div>
  }

  return (
    <div className={style.container}>
      <div className={style.header}>
        <button onClick={handleDownload}>Download Drawing</button>
      </div>
      <ExcalidrawWithRef
        ref={excalidrawRef}
        onChange={onChange}
        initialData={{
          elements,
          appState: {
            ...appState,
            width: window.innerWidth,
            height: window.innerHeight,
          },
        }}
      />
    </div>
  )
})

ExcalidrawEditorWrapper.displayName = 'ExcalidrawEditorWrapper'
