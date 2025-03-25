import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Package } from '../../core/entities/Package'
import {
  PackageState,
  SnippetStatus,
  PackageStatus,
  DrawingStatus,
  TextStatus
} from '../../core/repositories/PackageState'
import { AppDispatch, RootState } from './app/store'
import { createSelector } from 'reselect'

interface ExplorerState {
  snippetMetadata: Record<Package.NodeId, Package.SnippetMetadata>
  packageMetadata: Record<Package.NodeId, Package.PackageMetadata>
  snippetContent: Record<Package.NodeId, Package.SnippetContent>
  snippetStatus: Record<Package.NodeId, SnippetStatus>
  packageStatus: Record<Package.NodeId, PackageStatus>

  drawingMetadata: Record<Package.NodeId, Package.DrawingMetadata>
  drawingContent: Record<Package.NodeId, Package.DrawingContent>
  drawingStatus: Record<Package.NodeId, DrawingStatus>

  textMetadata: Record<Package.NodeId, Package.TextMetadata>
  textContent: Record<Package.NodeId, Package.TextContent>
  textStatus: Record<Package.NodeId, TextStatus>
}

const initialState: ExplorerState = {
  snippetMetadata: {},
  packageMetadata: {
    [Package.Workspace.id]: Package.Workspace
  },
  snippetContent: {},
  snippetStatus: {},
  packageStatus: {
    [Package.Workspace.id]: PackageStatus.Default
  },
  drawingMetadata: {},
  drawingContent: {},
  drawingStatus: {},
  textMetadata: {},
  textContent: {},
  textStatus: {},
}

const reduxPackageState = createSlice({
  name: 'ReduxPackageState',
  initialState,
  reducers: {
    setPackageMetadata(state, { payload }: PayloadAction<Package.PackageMetadata>) {
      state.packageMetadata[payload.id] = payload
    },
    setSnippetMetadata(state, { payload }: PayloadAction<Package.SnippetMetadata>) {
      state.snippetMetadata[payload.id] = payload
    },
    setSnippetContent(state, { payload }: PayloadAction<Package.SnippetContent>) {
      state.snippetContent[payload.id] = payload
    },
    setSnippetStatus(state, { payload }: PayloadAction<{ snippet: Pick<Package.Node, 'id'>, status: SnippetStatus }>) {
      if (payload.status === SnippetStatus.Deleted) {
        delete state.snippetStatus[payload.snippet.id]
      } else {
        state.snippetStatus[payload.snippet.id] = payload.status
      }
    },
    setPackageStatus(state, { payload }: PayloadAction<{ pkg: Pick<Package.Node, 'id'>, status: PackageStatus }>) {
      if (payload.status === PackageStatus.Deleted) {
        delete state.packageStatus[payload.pkg.id]
      } else {
        state.packageStatus[payload.pkg.id] = payload.status
      }
    },
    deletePackageMetadata(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.packageMetadata[payload.id]
    },
    deleteSnippetMetadata(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.snippetMetadata[payload.id]
    },
    deleteSnippetContent(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.snippetContent[payload.id]
    },

    setDrawingMetadata(state, { payload }: PayloadAction<Package.DrawingMetadata>) {
      state.drawingMetadata[payload.id] = payload
    },
    setDrawingContent(state, { payload }: PayloadAction<Package.DrawingContent>) {
      state.drawingContent[payload.id] = payload
    },
    setDrawingStatus(state, { payload }: PayloadAction<{ drawing: Pick<Package.Node, 'id'>; status: DrawingStatus }>) {
      if (payload.status === DrawingStatus.Deleted) {
        delete state.drawingStatus[payload.drawing.id]
      } else {
        state.drawingStatus[payload.drawing.id] = payload.status
      }
    },
    deleteDrawingMetadata(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.drawingMetadata[payload.id]
    },
    deleteDrawingContent(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.drawingContent[payload.id]
    },

    setTextMetadata(state, { payload }: PayloadAction<Package.TextMetadata>) {
      state.textMetadata[payload.id] = payload
    },
    setTextContent(state, { payload }: PayloadAction<Package.TextContent>) {
      state.textContent[payload.id] = payload
    },
    setTextStatus(state, { payload }: PayloadAction<{ text: Pick<Package.Node, 'id'>; status: TextStatus }>) {
      if (payload.status === TextStatus.Deleted) {
        delete state.textStatus[payload.text.id]
      } else {
        state.textStatus[payload.text.id] = payload.status
      }
    },
    deleteTextMetadata(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.textMetadata[payload.id]
    },
    deleteTextContent(state, { payload }: PayloadAction<Pick<Package.Node, 'id'>>) {
      delete state.textContent[payload.id]
    },
  },
})

export const selectDrawingMetadata = (drawing: Pick<Package.DrawingMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.drawingMetadata],
    (drawingMetadata) => drawingMetadata[drawing.id]
  )

export const selectDrawingContent = (drawing: Pick<Package.DrawingMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.drawingContent],
    (drawingContent) => drawingContent[drawing.id]
  )

export const selectDrawingStatus = (drawing: Pick<Package.DrawingMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.drawingStatus],
    (drawingStatus) => drawingStatus[drawing.id]
  )

export const selectPackageContent = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) =>
  createSelector(
    [
      (state: RootState) => state.packageState.packageMetadata,
      (state: RootState) => state.packageState.snippetMetadata,
      (state: RootState) => state.packageState.drawingMetadata,
      (state: RootState) => state.packageState.textMetadata,
    ],
    (pkgMeta, snippetMeta, drawingMeta, textMeta) => {
      const contentMap = new Map<string, Package.PackageContent[number]>()
  
      Object.values(pkgMeta).forEach((node) => {
        if (node && node.parentId === packageMetadata.id) {
          contentMap.set(node.id, node)
        }
      })
  
      Object.values(snippetMeta).forEach((node) => {
        if (node && node.parentId === packageMetadata.id) {
          contentMap.set(node.id, node)
        }
      })
  
      Object.values(drawingMeta).forEach((node) => {
        if (node && node.parentId === packageMetadata.id) {
          contentMap.set(node.id, node)
        }
      })

      Object.values(textMeta).forEach((node) => {
        if (node && node.parentId === packageMetadata.id) {
          contentMap.set(node.id, node)
        }
      })
  
      return Array.from(contentMap.values())
    }
  )

export const selectPackageMetadata = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.packageMetadata],
    (packageMetadataMap) => packageMetadataMap[packageMetadata.id]
  )

export const selectSnippetMetadata = (snippetMetadata: Pick<Package.SnippetMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.snippetMetadata],
    (snippetMetadataMap) => snippetMetadataMap[snippetMetadata.id]
  )

export const selectSnippetContent = (snippetMetadata: Pick<Package.SnippetMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.snippetContent],
    (snippetContentMap) => snippetContentMap[snippetMetadata.id]
  )

export const selectPackageStatus = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.packageStatus],
    (packageStatusMap) => packageStatusMap[packageMetadata.id]
  )

export const selectAncestors = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.packageMetadata],
    (packageMetadataMap) => {
      let currentNode: Package.PackageMetadata | undefined = packageMetadataMap[packageMetadata.id]
      const ancestors: Package.PackageMetadata[] = []
      while (currentNode && currentNode.id !== Package.Workspace.id) {
        ancestors.push(currentNode)
        currentNode = packageMetadataMap[currentNode.parentId]
      }
      ancestors.push(Package.Workspace)
      return ancestors.reverse()
    }
  )

export const selectSnippetStatus = (snippetMetadata: Pick<Package.SnippetMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.snippetStatus],
    (snippetStatusMap) => snippetStatusMap[snippetMetadata.id]
  )

export const selectTextMetadata = (text: Pick<Package.TextMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.textMetadata],
    (textMetadata) => textMetadata[text.id]
  )

export const selectTextContent = (text: Pick<Package.TextMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.textContent],
    (textContent) => textContent[text.id]
  )

export const selectTextStatus = (text: Pick<Package.TextMetadata, 'id'>) =>
  createSelector(
    [(state: RootState) => state.packageState.textStatus],
    (textStatus) => textStatus[text.id]
  )

export default reduxPackageState.reducer

class ReduxPackageStateManager implements PackageState {
  private readonly dispatch: AppDispatch

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch
  }

  setPackageMetadata(pkg: Package.PackageMetadata): void {
    this.dispatch(reduxPackageState.actions.setPackageMetadata(pkg))
  }
  setSnippetMetadata(snippet: Package.SnippetMetadata): void {
    this.dispatch(reduxPackageState.actions.setSnippetMetadata(snippet))
  }
  setSnippetContent(content: Package.SnippetContent): void {
    this.dispatch(reduxPackageState.actions.setSnippetContent(content))
  }
  setSnippetStatus(snippet: Pick<Package.Node, 'id'>, status: SnippetStatus): void {
    this.dispatch(reduxPackageState.actions.setSnippetStatus({ snippet, status }))
  }
  setPackageStatus(pkg: Pick<Package.Node, 'id'>, status: PackageStatus): void {
    this.dispatch(reduxPackageState.actions.setPackageStatus({ pkg, status }))
  }
  deleteSnippetContent(snippet: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deleteSnippetContent(snippet))
  }
  deleteSnippetMetadata(snippet: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deleteSnippetMetadata(snippet))
  }
  deletePackageMetadata(pkg: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deletePackageMetadata(pkg))
  }
  setDrawingMetadata(drawing: Package.DrawingMetadata): void {
    this.dispatch(reduxPackageState.actions.setDrawingMetadata(drawing))
  }
  setDrawingContent(content: Package.DrawingContent): void {
    this.dispatch(reduxPackageState.actions.setDrawingContent(content))
  }
  setDrawingStatus(drawing: Pick<Package.Node, 'id'>, status: DrawingStatus): void {
    this.dispatch(reduxPackageState.actions.setDrawingStatus({ drawing, status }))
  }
  deleteDrawingMetadata(drawing: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deleteDrawingMetadata(drawing))
  }
  deleteDrawingContent(drawing: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deleteDrawingContent(drawing))
  }
  // NEW: Text methods
  setTextMetadata(text: Package.TextMetadata): void {
    this.dispatch(reduxPackageState.actions.setTextMetadata(text))
  }
  setTextContent(content: Package.TextContent): void {
    this.dispatch(reduxPackageState.actions.setTextContent(content))
  }
  setTextStatus(text: Pick<Package.Node, 'id'>, status: TextStatus): void {
    this.dispatch(reduxPackageState.actions.setTextStatus({ text, status }))
  }
  deleteTextMetadata(text: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deleteTextMetadata(text))
  }
  deleteTextContent(text: Pick<Package.Node, 'id'>): void {
    this.dispatch(reduxPackageState.actions.deleteTextContent(text))
  }
}

let reduxPackageStateManagerInstance: ReduxPackageStateManager
export const useReduxPackageState = (dispatch: AppDispatch) => {
  if (reduxPackageStateManagerInstance === undefined) {
    reduxPackageStateManagerInstance = new ReduxPackageStateManager(dispatch)
  }
  return reduxPackageStateManagerInstance
}
