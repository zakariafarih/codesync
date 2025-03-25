// src/userInterface/components/TextEditorWrapper/TextEditorWrapper.tsx

import React, { useEffect, useState, useCallback } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

import { useTextAdapter } from '../../../adapters/TextAdapter'
import { Package } from '../../../core/entities/Package'
import Toolbar from './Toolbar'
import styles from './index.module.scss'

export interface TextEditorWrapperProps {
  textMetadata: Package.TextMetadata;
}

export function TextEditorWrapper({ textMetadata }: TextEditorWrapperProps) {
  const { loadText, saveText, removeText } = useTextAdapter(textMetadata)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load the initial editor content via the adapter.
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadText()
        // We assume the adapter returns the editor content as HTML in the "lexicalData" field.
        setContent(loaded.lexicalData || '')
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading text:', err)
        setError('Error loading text.')
        setIsLoading(false)
      }
    })()
  }, [loadText])

  // Save the content via the adapter.
  const handleSave = useCallback(async () => {
    try {
      await saveText(content)
      setLastSaved(new Date())
      setError(null)
    } catch (err) {
      console.error('Save failed:', err)
      setError('Save failed.')
    }
  }, [content, saveText])

  // Download the content as an HTML file.
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const element = document.createElement('a')
    element.href = url
    element.download = `${textMetadata.name}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  }, [content, textMetadata.name])

  // Delete the text item via the adapter.
  const handleDelete = useCallback(async () => {
    try {
      await removeText()
      // Optionally, clear the editor content after deletion.
      setContent('')
      setLastSaved(null)
      setError(null)
    } catch (err) {
      console.error('Delete failed:', err)
      setError('Delete failed.')
    }
  }, [removeText])

  // Rename handler (for demonstration, this logs the new name; you might call a rename API)
  const handleRename = useCallback(async (newName: string) => {
    // In a real implementation, you'd update the text item's metadata (e.g. via a renameText() usecase)
    console.log(`Renaming text item to: ${newName}`)
    // For example, you might dispatch an action to update the Redux state with the new name.
  }, [])

  // Update content when the editor changes.
  const handleChange = useCallback((value: string) => {
    setContent(value)
  }, [])

  if (isLoading) {
    return <div className={styles.loading}>Loading editor...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Toolbar
          onSave={handleSave}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRename={handleRename}
          lastSaved={lastSaved}
          error={error}
        />
      </div>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['link', 'image'],
            ['clean']
          ],
          // You can add additional modules (e.g. image resize) here if needed.
        }}
        formats={[
          'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
          'list', 'bullet', 'indent', 'link', 'image'
        ]}
      />
    </div>
  )
}

export default TextEditorWrapper
