import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import URI from '@theia/core/lib/common/uri';

export const VUENGINE_EXT = 'vuengine';

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
    items?: ProjectFileItemsWithContributor
    templates?: ProjectFileTemplatesWithContributor
    types?: ProjectFileTypesWithContributor
  }
  items?: ProjectFileItemsByType
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
  schema: JsonSchema
  uiSchema?: UISchemaElement
  icon?: string
  category?: string
  multiple: boolean
  templates?: string[]
};

export interface ProjectFileItemsByType {
  [typeId: string]: ProjectFileItems
};

export interface ProjectFileItems {
  [itemId: string]: ProjectFileItem
};

export interface ProjectFileItemsWithContributor {
  [typeId: string]: ProjectFileItemWithContributor
};

export interface ProjectFileItem {
  [id: string]: unknown
};

export interface ProjectFileItemWithContributor extends ProjectFileItem {
  [id: string]: unknown & WithContributor
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

export interface ProjectFileItemSaveEvent {
  typeId: string
  itemId: string
  item: ProjectFileItem
}

export interface ProjectFileItemDeleteEvent {
  typeId: string
  itemId: string
}
