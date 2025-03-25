// src/userInterface/components/TextEditorWrapper/Toolbar.tsx

import React from 'react'
import styles from './Toolbar.module.scss'

interface ToolbarProps {
  onSave: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  lastSaved: Date | null;
  error: string | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onDownload, onDelete, onRename, lastSaved, error }) => {
  const handleRename = () => {
    const newName = prompt('Enter new name:')
    if (newName) {
      onRename(newName)
    }
  }

  return (
    <div className={styles.toolbar}>
      <button className={styles.button} onClick={onSave}>Save</button>
      <button className={styles.button} onClick={onDownload}>Download</button>
      <button className={styles.button} onClick={handleRename}>Rename</button>
      <button className={styles.button} onClick={onDelete}>Delete</button>
      {lastSaved && (
        <span className={styles.lastSaved}>
          Last saved: {lastSaved.toLocaleTimeString()}
        </span>
      )}
      {error && (
        <span className={styles.error}>{error}</span>
      )}
    </div>
  )
}

export default Toolbar
