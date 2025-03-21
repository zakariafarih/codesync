import style from './index.module.scss'
import Editor, { OnChange, OnMount } from '@monaco-editor/react'
import { useEffect } from 'react'
import { Package } from '../../../core/entities/Package'
import ExtensionLanguageMap from '../../../constants/ExtensionLanguageMap'
import { useSnippetAdapter } from '../../../adapters/PackageAdapter'
import { SnippetStatus } from '../../../core/repositories/PackageState'

export interface MonacoEditorProps {
  snippetMetadata: Package.SnippetMetadata
  className?: string
}

export function MonacoEditorWrapper({ snippetMetadata, className }: MonacoEditorProps) {

  const { fetchSnippet, updateContent, snippetContent, snippetStatus } = useSnippetAdapter(snippetMetadata)

  useEffect(fetchSnippet, [snippetMetadata.id])

  const handleEditorDidMount: OnMount = (editor) => {
    editor.focus()
  }

  const handleChange: OnChange = async (value) => {
    if (value) updateContent(value)
  }

  const isSnippetReady = snippetContent && snippetMetadata && snippetStatus !== SnippetStatus.ContentLoading
  const extension = '.' + (snippetMetadata?.name?.split('.')?.reverse()[0] || '')

  return (
    <div className={`${className || ''} ${style.container}`}>
      {isSnippetReady && <Editor
        key={snippetMetadata.id}
        defaultValue={snippetContent.content}
        defaultLanguage={ExtensionLanguageMap[extension] || 'markdown'}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme='vs-dark'
        options={{ wordWrap: 'on' }}
      />}
    </div>
  )
}
