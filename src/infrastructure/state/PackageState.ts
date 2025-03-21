import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Package } from '../../core/entities/Package'
import { PackageState, SnippetStatus, PackageStatus } from '../../core/repositories/PackageState'
import { AppDispatch, RootState } from './app/store'

interface ExplorerState {
  snippetMetadata: Record<Package.NodeId, Package.SnippetMetadata>
  packageMetadata: Record<Package.NodeId, Package.PackageMetadata>
  snippetContent: Record<Package.NodeId, Package.SnippetContent>
  snippetStatus: Record<Package.NodeId, SnippetStatus>
  packageStatus: Record<Package.NodeId, PackageStatus>
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
  },
})

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
}

export default reduxPackageState.reducer

let reduxPackageStateManagerInstance: ReduxPackageStateManager
export const useReduxPackageState = (dispatch: AppDispatch) => {
  if (reduxPackageStateManagerInstance === undefined) {
    reduxPackageStateManagerInstance = new ReduxPackageStateManager(dispatch)
  }
  return reduxPackageStateManagerInstance
}

export const selectPackageContent = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) => {
  return (state: RootState) => {
    const content: (Package.PackageMetadata | Package.SnippetMetadata)[] = []

    for (const nodeId in state.packageState.packageMetadata) {
      const node = state.packageState.packageMetadata[nodeId]
      if (node && node.parentId === packageMetadata.id) {
        content.push(node)
      }
    }

    for (const nodeId in state.packageState.snippetMetadata) {
      const node = state.packageState.snippetMetadata[nodeId]
      if (node && node.parentId === packageMetadata.id) {
        content.push(node)
      }
    }

    return content
  }
}

export const selectPackageMetadata = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) => {
  return (state: RootState): Package.PackageMetadata | undefined => {
    return state.packageState.packageMetadata[packageMetadata.id]
  }
}

export const selectSnippetMetadata = (snippetMetadata: Pick<Package.SnippetMetadata, 'id'>) => {
  return (state: RootState) => {
    return state.packageState.snippetMetadata[snippetMetadata.id]
  }
}

export const selectSnippetContent = (snippetMetadata: Pick<Package.SnippetMetadata, 'id'>) => {
  return (state: RootState): Package.SnippetContent | undefined => {
    return state.packageState.snippetContent[snippetMetadata.id]
  }
}

export const selectPackageStatus = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) => {
  return (state: RootState) => {
    return state.packageState.packageStatus[packageMetadata.id]
  }
}

export const selectAncestors = (packageMetadata: Pick<Package.PackageMetadata, 'id'>) => {
  return (state: RootState) => {
    let currentNode: Package.PackageMetadata | undefined = state.packageState.packageMetadata[packageMetadata.id]
    const ancestors: Package.PackageMetadata[] = []
    while (currentNode && currentNode.id !== Package.Workspace.id) {
      ancestors.push(currentNode)
      currentNode = state.packageState.packageMetadata[currentNode.parentId]
    }
    ancestors.push(Package.Workspace)
    return ancestors.reverse()
  }
}

export const selectSnippetStatus = (snippetMetadata: Pick<Package.SnippetMetadata, 'id'>) => {
  return (state: RootState) => {
    return state.packageState.snippetStatus[snippetMetadata.id]
  }
}
