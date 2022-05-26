import { JsonSchema } from '@jsonforms/core';

export interface ProjectFileWithContributor {
  contributor: string
  data: ProjectFile
}

export interface ProjectFileType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [id: string]: any
};

export interface ProjectFileTypes {
  [typeId: string]: ProjectFileType
};

export interface ProjectFileContribution {
  types?: ProjectFileTypes
};

export interface ProjectFile {
  folders: {
    path: string
  }[],
  plugins: string[]
  types: ProjectFileTypes
  contributions?: ProjectFileContribution
};

export interface ProjectFileTypesCombined {
  typesCombined: ProjectFileTypes
};

export interface RegisteredTypeParent {
  typeId: string
  multiple: boolean
};

export interface RegisteredType {
  _contributor: string
  schema: JsonSchema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema?: any
  parent?: RegisteredTypeParent
  icon?: string
  leaf?: boolean
};

export interface RegisteredTypes {
  [typeId: string]: RegisteredType
};
