export namespace Package {
  export type NodeId = string

  export enum NodeType {
    package = 'package',
    snippet = 'snippet',
    drawing = 'drawing',
    text = 'text'
  }

  export interface Node {
    id: NodeId
    name: string
    parentId: NodeId
    type: NodeType
    editedAt: EpochTimeStamp
    createdAt: EpochTimeStamp
  }

  export interface DrawingMetadata extends Node {
    type: NodeType.drawing
  }

  export interface DrawingContent {
    id: DrawingMetadata['id']
    sceneData: string
  }

  export interface SnippetMetadata extends Node {
    type: NodeType.snippet
  }

  export interface PackageMetadata extends Node {
    type: NodeType.package
  }

  export interface TextMetadata extends Node {
    type: NodeType.text
  }

  export interface TextContent {
    id: TextMetadata['id']
    lexicalData: string  
  }

  export interface SnippetContent {
    id: SnippetMetadata['id']
    content: string
  }

  export type PackageContent = (
    | SnippetMetadata 
    | PackageMetadata 
    | DrawingMetadata 
    | TextMetadata
  )[];

  export type SnippetType = SnippetMetadata & SnippetContent

  export const Workspace: PackageMetadata = {
    type: NodeType.package,
    id: 'home',
    name: 'WorkSpace',
    parentId: 'root',
    editedAt: 0,
    createdAt: 0
  }
}
