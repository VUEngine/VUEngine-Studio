import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import URI from '@theia/core/lib/common/uri';

export const VUENGINE_EXT = 'vuengine';

export const CONFIG_ITEM_KEY = '_config';

export interface WorkspaceFile {
  extensions?: {
    recommendations?: {
      [extensionId: string]: string
    }
  }
  folders?: {
    name?: string
    path: string
  }[]
  settings?: {
    [settingId: string]: unknown
  }
}

export interface ProjectFile extends WorkspaceFile {
  combined?: {
    templates?: ProjectFileTemplatesWithContributor
    types?: ProjectFileTypesWithContributor
  }
  name?: string
  plugins?: string[]
  templates?: ProjectFileTemplates
  types?: ProjectFileTypes
};

export interface ProjectFileTypes {
  [typeId: string]: ProjectFileType
};

export interface ProjectFileTypesWithContributor extends ProjectFileTypes {
  [typeId: string]: ProjectFileType & WithContributor
};

export interface ProjectFileType {
  file: string
  icon?: string
  schema: JsonSchema
  uiSchema?: UISchemaElement
  templates?: string[]
};

export interface ProjectFileTemplates {
  [key: string]: ProjectFileTemplate
}

export interface ProjectFileTemplatesWithContributor extends ProjectFileTemplates {
  [key: string]: ProjectFileTemplate & WithContributor
}

export interface ProjectFileTemplateEvent {
  type: ProjectFileTemplateEventType
  value?: unknown
}

export enum ProjectFileTemplateEventType {
  installedPluginsChanged = 'installedPluginsChanged',
  itemOfTypeGotDeleted = 'itemOfTypeGotDeleted',
}

export interface ProjectFileTemplate {
  target: string
  targetRoot: string
  template: string
  encoding?: ProjectFileTemplateEncoding
  itemSpecific?: string
  events: ProjectFileTemplateEvent[]
}

export interface WithContributor {
  _contributor: string
  _contributorUri: URI
}

export enum ProjectFileTemplateEncoding {
  ShiftJIS = 'shift_jis',
  utf8 = 'utf8',
  win1252 = 'win1252',
}
