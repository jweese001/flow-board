import type { NodeTypes } from '@xyflow/react';
import { CharacterNode } from './CharacterNode';
import { SettingNode } from './SettingNode';
import { PropNode } from './PropNode';
import { StyleNode } from './StyleNode';
import { ExtrasNode } from './ExtrasNode';
import { ShotNode } from './ShotNode';
import { OutfitNode } from './OutfitNode';
import { CameraNode } from './CameraNode';
import { ActionNode } from './ActionNode';
import { NegativeNode } from './NegativeNode';
import { ParametersNode } from './ParametersNode';
import { EditNode } from './EditNode';
import { ReferenceNode } from './ReferenceNode';
import { OutputNode } from './OutputNode';
import { PageNode } from './PageNode';
import { TransformNode } from './TransformNode';
import { CompNode } from './CompNode';

// Registry of all custom node types for React Flow
export const nodeTypes: NodeTypes = {
  // Asset Nodes
  character: CharacterNode,
  setting: SettingNode,
  prop: PropNode,
  style: StyleNode,
  extras: ExtrasNode,
  // Modifier Nodes
  shot: ShotNode,
  outfit: OutfitNode,
  camera: CameraNode,
  // Scene Nodes
  action: ActionNode,
  // Technical Nodes
  negative: NegativeNode,
  parameters: ParametersNode,
  edit: EditNode,
  reference: ReferenceNode,
  // Terminal Nodes
  output: OutputNode,
  // Layout Nodes
  page: PageNode,
  // Transform Nodes
  transform: TransformNode,
  // Composition Nodes
  comp: CompNode,
};

// Re-export individual nodes
export { CharacterNode } from './CharacterNode';
export { SettingNode } from './SettingNode';
export { PropNode } from './PropNode';
export { StyleNode } from './StyleNode';
export { ExtrasNode } from './ExtrasNode';
export { ShotNode } from './ShotNode';
export { OutfitNode } from './OutfitNode';
export { CameraNode } from './CameraNode';
export { ActionNode } from './ActionNode';
export { NegativeNode } from './NegativeNode';
export { ParametersNode } from './ParametersNode';
export { EditNode } from './EditNode';
export { ReferenceNode } from './ReferenceNode';
export { OutputNode } from './OutputNode';
export { PageNode } from './PageNode';
export { TransformNode } from './TransformNode';
export { CompNode } from './CompNode';
export { BaseNode, NodeField } from './BaseNode';
