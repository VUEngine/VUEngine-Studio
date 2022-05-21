import { JsonSchema } from '@jsonforms/core';

export interface ProjectFileType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [id: string]: any;
};

export interface ProjectFile {
  plugins: string[]
  types: {
    [typeId: string]: ProjectFileType
  }
};

export interface RegisteredTypeParent {
  typeId: string,
  multiple: boolean,
};

export interface RegisteredType {
  schema: JsonSchema,
  uiSchema?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  parent?: RegisteredTypeParent,
  icon: string,
  leaf?: boolean,
};

export interface RegisteredTypes {
  [typeId: string]: RegisteredType
};
