export interface RegisteredTemplate {
  source: RegisteredTemplateSource
  key?: string
  extra?: Array<RegisteredTemplateExtra>
  targets: Array<RegisteredTemplateTarget>
  root: string
}

export interface RegisteredTemplateSource {
  type: RegisteredTemplateSourceType
  value: string
}

export interface RegisteredTemplateExtra {
  key: string
  type: RegisteredTemplateSourceType
  root: RegisteredTemplateRoot
  value: string
}

export interface RegisteredTemplateTarget {
  root: RegisteredTemplateRoot
  value: string
  template: string
  encoding?: RegisteredTemplateEncoding
}

export enum RegisteredTemplateSourceType {
  uri = 'uri',
  filetype = 'filetype',
}

export enum RegisteredTemplateRoot {
  activePlugins = 'activePlugins',
  engine = 'engine',
  plugins = 'plugins',
  relative = 'relative',
  workspace = 'workspace',
}

export enum RegisteredTemplateEncoding {
  utf8 = 'utf8',
  win1252 = 'win1252',
}
