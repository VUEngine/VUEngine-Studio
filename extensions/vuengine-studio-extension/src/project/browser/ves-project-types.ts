import { JsonSchema } from '@jsonforms/core';
import URI from '@theia/core/lib/common/uri';

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
  uiSchema?: unknown
  parent?: RegisteredTypeParent
  icon?: string
  leaf?: boolean
  templates?: string[]
};

export interface RegisteredTypeParent {
  typeId: string
  multiple: boolean
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
  mode: ProjectFileTemplateMode
  target: string
  template: URI | string
  encoding?: ProjectFileTemplateEncoding
  events: ProjectFileTemplateEvent[]
}

export interface WithContributor {
  _contributor: string
}

export enum ProjectFileTemplateMode {
  single = 'single',
}

export enum ProjectFileTemplateEncoding {
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