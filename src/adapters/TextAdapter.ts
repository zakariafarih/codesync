import { useDispatch, useSelector } from 'react-redux'
import { useMemo } from 'react'
import { updateTextMetadata, useLocalPackageDatabase } from '../infrastructure/databases/LocalPackageDatabase'
import { 
  useReduxPackageState, 
  selectTextMetadata, 
  selectTextContent, 
  selectTextStatus 
} from '../infrastructure/state/PackageState'
import { createText, fetchText, updateText, deleteText } from '../core/usecases/Text'
import { Package } from '../core/entities/Package'
import { AppDispatch } from '../infrastructure/state/app/store'

export function useTextAdapter(text: Pick<Package.TextMetadata, 'id'>) {
  const dispatch: AppDispatch = useDispatch()
  const packageState = useReduxPackageState(dispatch)
  const localDB = useLocalPackageDatabase('db1')

  const textMetadata = useSelector(selectTextMetadata(text))
  const textContent = useSelector(selectTextContent(text))
  const textStatus = useSelector(selectTextStatus(text))
  

  const loadText = useMemo(() => async () => {
    try {
      const result = await fetchText(text, localDB, packageState)
      return result
    } catch (error) {
      console.error('Failed to load text:', error)
      throw error
    }
  }, [text.id, localDB, packageState])


  const saveText = useMemo(() => async (lexicalData: string) => {
    if (!textMetadata) {
      console.error('Text metadata not found. Cannot save.')
      return
    }
    const updatedText = {
      ...textMetadata,
      lexicalData,
      editedAt: Date.now(),
    } as Package.TextMetadata & Package.TextContent

    try {
      await updateText(updatedText, localDB, packageState)
    } catch (error) {
      console.error('Failed to save text:', error)
      throw error
    }
  }, [textMetadata, localDB, packageState])


  const removeText = useMemo(() => async () => {
    await deleteText(text, localDB, packageState)
  }, [text.id])

  const renameText = useMemo(() => async (newName: string) => {
    if (!textMetadata) {
      console.error('Cannot rename text: metadata not found')
      return
    }
    try {
      await updateTextMetadata({
        ...textMetadata,
        name: newName,
        editedAt: Date.now()
      }, localDB, packageState)
    } catch (err) {
      console.error('Failed to rename text:', err)
      throw err
    }
  }, [textMetadata, localDB, packageState])

  const createNewText = useMemo(() => async (params: { name: string, parentId?: string }) => {
    try {
      return await createText(params, localDB, packageState)
    } catch (error) {
      console.error('Failed to create text:', error)
      throw error
    }
  }, [localDB, packageState])

  return {
    textMetadata,
    textContent,
    textStatus,
    loadText,
    saveText,
    removeText,
    createNewText,
    renameText,
  }
}
