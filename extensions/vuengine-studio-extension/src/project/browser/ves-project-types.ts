import URI from '@theia/core/lib/common/uri';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';
import { ControlPosition } from 'react-draggable';
import { VesPluginsData } from '../../plugins/browser/ves-plugin';

export const VUENGINE_WORKSPACE_EXT = 'workspace';

export const PROJECT_CHANNEL_NAME = 'Project Data';

export interface ProjectData {
  items: ProjectDataItems
};

export interface ProjectDataWithContributor {
  plugins?: { [id: string]: VesPluginsData }
  items: ProjectDataItemsByTypeWithContributor
};

export interface ProjectDataItemsByType {
  [typeId: string]: ProjectDataItems
};

export interface ProjectDataItems {
  [itemId: string]: ProjectDataItem
};

export interface ProjectDataItem {
  [id: string]: unknown
};

export interface ProjectDataItemsWithContributor extends ProjectDataItem {
  [id: string]: unknown & WithContributor & WithFileUri
};

export interface ProjectDataItemsByTypeWithContributor {
  [typeId: string]: ProjectDataItemsWithContributor
};

export interface ProjectDataTypes {
  [typeId: string]: ProjectDataType
};

export interface ProjectDataType {
  enabled?: boolean
  file: string
  excludeFromDashboard?: boolean
  icon?: string
  schema: any
  uiSchema?: any
  templates?: ProjectDataTemplate[]
  forFiles?: string[]
};

export interface ProjectDataTemplates {
  [key: string]: ProjectDataTemplate
}

export interface ProjectDataTemplateEvent {
  type: ProjectDataTemplateEventType
  value?: unknown
}

export enum ProjectDataTemplateEventType {
  installedPluginsChanged = 'installedPluginsChanged',
  itemOfTypeGotDeleted = 'itemOfTypeGotDeleted',
}

export enum ProjectDataTemplateTargetRoot {
  project = 'project',
  file = 'file',
}
export enum ProjectDataTemplateTargetForEachOfType {
  var = 'var',
  fileInFolder = 'fileInFolder',
}

export interface ProjectDataTemplateTarget {
  path: string
  root: ProjectDataTemplateTargetRoot
  forEachOf?: { [ProjectDataTemplateTargetForEachOfType.var]: string } | { [ProjectDataTemplateTargetForEachOfType.fileInFolder]: string | string[] }
  conditions?: RulesLogic<AdditionalOperation>
}

export interface ProjectDataTemplate {
  enabled?: boolean
  targets: ProjectDataTemplateTarget[]
  template: string
  encoding?: ProjectDataTemplateEncoding
  itemSpecific?: string
  events?: ProjectDataTemplateEvent[]
}

export interface WithContributor {
  _contributor: ProjectContributor
  _contributorUri: URI
}

export interface WithId {
  _id: string
}

export interface WithFileUri {
  _fileUri: URI
}

export interface WithVersion {
  _version: string
}

export interface WithType {
  type: ProjectDataType
}

export enum ProjectDataTemplateEncoding {
  ShiftJIS = 'shift_jis',
  utf8 = 'utf8',
  win1252 = 'win1252',
}

export enum ProjectContributor {
  Engine = 'engine',
  Plugin = 'plugin',
  Project = 'project',
  Studio = 'studio',
}

export enum ProjectUpdateMode {
  All = 'all',
  LowerVersionOnly = 'lowerVersionOnly',
}

export interface DashboardConfigPositionMap {
  [id: string]: ControlPosition
};

export interface DashboardConfig {
  positions: DashboardConfigPositionMap
}

export interface GameConfig {
  projectTitle: string
  projectAuthor: string
  plugins: { [id: string]: object }
  dashboard: DashboardConfig
}
