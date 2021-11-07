export interface Template {
  event: TemplateEvent
  data?: Array<TemplateDataSource>
  targets: Array<TemplateTarget>
  root: string
}

export interface TemplateEvent {
  type: TemplateEventType
  value: string
}

export enum TemplateEventType {
  fileChanged = 'fileChanged',
  fileWithEndingChanged = 'fileWithEndingChanged',
  installedPluginsChanged = 'installedPluginsChanged',
}

export interface TemplateDataSource {
  key: string
  type: TemplateDataType
  root: TemplateRoot
  value: string
}

export enum TemplateRoot {
  engine = 'engine',
  installedPlugins = 'installedPlugins',
  plugins = 'plugins',
  relative = 'relative',
  workspace = 'workspace',
}

export enum TemplateDataType {
  file = 'file',
  filesWithEnding = 'filesWithEnding',
}

export interface TemplateTarget {
  root: TemplateRoot
  value: string
  template: string
  encoding?: TemplateEncoding
}

export enum TemplateEncoding {
  utf8 = 'utf8',
  win1252 = 'win1252',
}
