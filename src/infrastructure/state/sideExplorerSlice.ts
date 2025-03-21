import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './app/store'
import { Package } from '../../core/entities/Package'

// Update the state interface:
// - "workspace" now uses PackageMetadata (instead of FolderMetadata)
export interface ExplorerState {
  expanded: Record<string, boolean>
  workspace: Package.PackageMetadata
}

// The function for generating a unique key remains similar.
const packageUUID = (metadata: Package.PackageMetadata) => `${metadata.id}`

const initialState: ExplorerState = {
  expanded: {},
  // Use the updated WorkSpace (of type PackageMetadata) from the domain
  workspace: Package.Workspace
}

export const sideExplorerSlice = createSlice({
  name: 'sideExplorer',
  initialState,
  reducers: {
    toggleExpansion(state, { payload }: PayloadAction<Package.PackageMetadata>) {
      const pkg = payload
      state.expanded[packageUUID(pkg)] = !state.expanded[packageUUID(pkg)]
    },
    expand(state, { payload }: PayloadAction<Package.PackageMetadata>) {
      const pkg = payload
      state.expanded[packageUUID(pkg)] = true
    },
    collapse(state, { payload }: PayloadAction<Package.PackageMetadata>) {
      const pkg = payload
      state.expanded[packageUUID(pkg)] = false
    }
  },
})

export const { expand, collapse, toggleExpansion } = sideExplorerSlice.actions

// Update selectors to use PackageMetadata instead of FolderMetadata
export const selectFolderExpansionState = (metadata: Package.PackageMetadata) => (state: RootState) =>
  Boolean(state.sideExplorer.expanded[packageUUID(metadata)])
export const selectWorkspace = (state: RootState) => state.sideExplorer.workspace

export default sideExplorerSlice.reducer
