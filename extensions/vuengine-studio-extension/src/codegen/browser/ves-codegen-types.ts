import URI from '@theia/core/lib/common/uri';

export interface registeredTemplate {
  source: URI
  key?: string
  extra?: registeredTemplateExtra
  targets: registeredTemplateTarget[]
}

export interface registeredTemplateExtra {
  [key: string]: URI
}

export interface registeredTemplateTarget {
  uri: URI
  template: URI
}
