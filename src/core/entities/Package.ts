export namespace Package {
  export type NodeId = string

  export enum NodeType {
    package = 'package',
    snippet = 'snippet',
  }

  export interface Node {
    id: NodeId
    name: string
    /** Parent ID is Null when Node is the root */
    parentId: NodeId
    type: NodeType
    editedAt: EpochTimeStamp
    createdAt: EpochTimeStamp
  }

  export interface SnippetMetadata extends Node {
    type: NodeType.snippet
  }

  export interface PackageMetadata extends Node {
    type: NodeType.package
  }

  export interface SnippetContent {
    id: SnippetMetadata['id']
    content: string
  }

  export type SnippetType = SnippetMetadata & SnippetContent
  export type PackageContent = (SnippetMetadata | PackageMetadata)[]

  export const Workspace: PackageMetadata = {
    type: NodeType.package,
    id: 'home',
    name: 'WorkSpace',
    parentId: 'root',
    editedAt: 0,
    createdAt: 0
  }
}
