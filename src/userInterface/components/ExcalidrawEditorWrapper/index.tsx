import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo
} from 'react'
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

// Memoized forwardRef wrapper
const ExcalidrawWithRef = memo(
  React.forwardRef<ExcalidrawImperativeAPI, React.ComponentProps<typeof Excalidraw>>(
    (props, ref) => <Excalidraw ref={ref} {...props} />
  )
)
ExcalidrawWithRef.displayName = 'ExcalidrawWithRef'

// Default app state (make sure to provide all required properties)
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
  const [sceneData, setSceneData] = useState<string>('')
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  const AUTO_SAVE_INTERVAL = 2 * 60 * 1000 // 2 minutes

  // Use a ref to hold the latest sceneData for auto-save
  const sceneDataRef = useRef(sceneData)
  useEffect(() => {
    sceneDataRef.current = sceneData
  }, [sceneData])

  // Load drawing from DB only once
  useEffect(() => {
    const loadInitialContent = async () => {
      try {
        if (!hasLoaded) {
          const result = await loadDrawing()
          setHasLoaded(true)
          
          if (result?.sceneData) {
            setSceneData(result.sceneData)
            try {
              const sceneJson = JSON.parse(result.sceneData)
              const restored = restore(sceneJson, null, null) as RestoredDataState
              
              if (restored) {
                setElements(restored.elements ?? [])
                setAppState(prevState => ({
                  ...prevState,
                  ...restored.appState,
                  width: window.innerWidth,
                  height: window.innerHeight,
                }))
              }
            } catch (err) {
              console.error('[Excalidraw] Failed to restore sceneData:', err)
            }
          }
        }
      } catch (err) {
        console.error('Error loading drawing:', err)
        setHasLoaded(true) // Still set loaded to true to prevent infinite loading
      }
    }

    loadInitialContent()
  }, [loadDrawing, hasLoaded])

  // onChange: update local state and trigger save
  const onChange = useCallback((
    elements: readonly NonDeletedExcalidrawElement[], 
    state: AppState, 
    files: BinaryFiles
  ) => {
    try {
      const data = serializeAsJSON(elements, state, files, 'local')
      setElements([...elements])
      setAppState(prevState => ({
        ...prevState,
        ...state,
      }))
      setSceneData(data)
      setSaveError(null)
    } catch (err) {
      console.error('Error in onChange handler:', err)
      setSaveError('Failed to update drawing state')
    }
  }, [])

  // Manual Save Now button with proper error handling
  const handleSaveNow = useCallback(async () => {
    if (!sceneDataRef.current) return

    try {
      await saveDrawing(sceneDataRef.current)
      setLastSavedTime(new Date())
      setSaveError(null)
    } catch (err) {
      console.error('Failed to save drawing:', err)
      setSaveError('Failed to save drawing')
    }
  }, [saveDrawing])

  // Auto-save with error handling
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (sceneDataRef.current) {
        try {
          await saveDrawing(sceneDataRef.current)
          setLastSavedTime(new Date())
          setSaveError(null)
        } catch (err) {
          console.error('Auto-save failed:', err)
          setSaveError('Auto-save failed')
        }
      }
    }, AUTO_SAVE_INTERVAL)
    
    return () => clearInterval(intervalId)
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
        <button onClick={handleSaveNow}>Save Now</button>
        <div>
          {saveError ? (
            <span style={{ color: 'red' }}>{saveError}</span>
          ) : (
            <span>
              Last saved: {lastSavedTime ? lastSavedTime.toLocaleTimeString() : 'Not saved yet'}
            </span>
          )}
        </div>
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
