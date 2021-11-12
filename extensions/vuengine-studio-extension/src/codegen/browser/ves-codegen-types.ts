export interface Templates {
  events: {
    [TemplateEventType.fileChanged]: {
      [key: string]: Array<string>
    }
    [TemplateEventType.fileWithEndingChanged]: {
      [key: string]: Array<string>
    }
    [TemplateEventType.installedPluginsChanged]: Array<string>
  }
  templates: {
    [key: string]: Template
  }
}

export enum TemplateEventType {
  fileChanged = 'fileChanged',
  fileWithEndingChanged = 'fileWithEndingChanged',
  installedPluginsChanged = 'installedPluginsChanged',
}

export interface Template {
  data?: Array<TemplateDataSource>
  root: TemplateRoot
  target: string
  template: string
  encoding?: TemplateEncoding
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
  changedFile = 'changedFile',
  file = 'file',
  filesWithEnding = 'filesWithEnding',
}

export enum TemplateEncoding {
  utf8 = 'utf8',
  win1252 = 'win1252',
}
