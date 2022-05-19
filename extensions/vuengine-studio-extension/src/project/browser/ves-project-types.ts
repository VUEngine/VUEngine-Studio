import { JsonSchema } from '@jsonforms/core';

export interface ProjectFileType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [id: string]: any;
};

export interface ProjectFile {
  types: {
    [typeId: string]: ProjectFileType
  }
};

export interface ProjectNodes {
  [typeId: string]: {
    typeId: string,
    title: string,
    icon: string,
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
};

export interface RegisteredTypes {
  [typeId: string]: RegisteredType
};
