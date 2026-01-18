import type { Edge } from '@xyflow/react';
import type { AppNode } from './nodes';

export interface Project {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
}

export interface ProjectExport {
  version: string;
  project: Project;
  exportedAt: number;
}
