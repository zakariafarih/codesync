/* eslint-disable linebreak-style */
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Excalidraw, serializeAsJSON, restore } from '@excalidraw/excalidraw'
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import { NonDeletedExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import { AppState } from '@excalidraw/excalidraw/types/types'
import { BinaryFiles } from '@excalidraw/excalidraw/types/types'
import { useDrawingAdapter } from '../../../adapters/DrawingAdapter'
import { Package } from '../../../core/entities/Package'
import style from './index.module.scss'

interface ExcalidrawEditorWrapperProps {
  drawingMetadata: Package.DrawingMetadata
}

type ExcalidrawOnChange = (
  elements: readonly NonDeletedExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles
) => void

const ExcalidrawWithRef = Excalidraw as unknown as React.ForwardRefExoticComponent<
  Omit<React.ComponentProps<typeof Excalidraw>, 'ref'> & React.RefAttributes<ExcalidrawImperativeAPI>
>

export function ExcalidrawEditorWrapper({ drawingMetadata }: ExcalidrawEditorWrapperProps) {
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const { drawingContent, loadDrawing, saveDrawing, downloadDrawing } = useDrawingAdapter(drawingMetadata)
  
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!hasLoaded) {
      loadDrawing()
        .then(() => setHasLoaded(true))
        .catch((err) => console.error('Error loading drawing:', err))
    }
  }, [loadDrawing, hasLoaded])

  useEffect(() => {
    if (hasLoaded && drawingContent?.sceneData && excalidrawRef.current) {
      try {
        const sceneJson = JSON.parse(drawingContent.sceneData)
        const { elements, appState } = restore(sceneJson, null, null)
        excalidrawRef.current.updateScene({ elements, appState })
      } catch (err) {
        console.error('[Excalidraw] Failed to load sceneData:', err)
      }
    }
  }, [drawingContent, hasLoaded])

  const onChange = useCallback<ExcalidrawOnChange>(
    (elements, appState, files) => {
      const data = serializeAsJSON(elements, appState, files, 'local')
      saveDrawing(data)
    },
    [saveDrawing]
  )

  const handleDownload = () => {
    downloadDrawing()
  }

  return (
    <div className={style.container}>
      <div className={style.header}>
        <button onClick={handleDownload}>Download Drawing</button>
      </div>
      <ExcalidrawWithRef ref={excalidrawRef} onChange={onChange} />
    </div>
  )
}
