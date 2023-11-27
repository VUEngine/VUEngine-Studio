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
    items?: ProjectFileItemsWithContributor
    templates?: ProjectFileTemplatesWithContributor
    types?: ProjectFileTypesWithContributor
  }
  items?: ProjectFileItems
  name?: string
  plugins?: string[]
  templates?: ProjectFileTemplates
  types?: ProjectFileTypes
};

export interface ProjectFileItemsByType {
  [typeId: string]: ProjectFileItems
};

export interface ProjectFileItems {
  [itemId: string]: ProjectFileItem
};

export interface ProjectFileItem {
  [id: string]: unknown
};

export interface ProjectFileItemWithContributor extends ProjectFileItem {
  [id: string]: unknown & WithContributor
};

export interface ProjectFileItemsWithContributor {
  [typeId: string]: ProjectFileItemWithContributor
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
  schema: any
  uiSchema?: any
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
  events?: ProjectFileTemplateEvent[]
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

export const defaultProjectData: ProjectFile = {
  templates: {
    'image.c': {
      target: 'Converted/${_filename}.c',
      targetRoot: 'file',
      template: 'templates/image.c.nj'
    },
    'romHeader.h': {
      target: 'source/romHeader.h',
      targetRoot: 'project',
      template: 'templates/romHeader.h.nj',
      encoding: ProjectFileTemplateEncoding.ShiftJIS
    }
  },
  types: {
    Image: {
      file: '.imageConv',
      schema: {
        title: 'Image',
        properties: {
          images: {
            type: 'array',
            items: {
              type: 'string',
              default: ''
            },
            minItems: 1,
            default: ['.']
          },
          name: {
            type: 'string',
            default: ''
          },
          section: {
            type: 'string',
            oneOf: [
              {
                const: 'rom',
                title: 'ROM Space'
              },
              {
                const: 'exp',
                title: 'Expansion Space'
              }
            ],
            default: 'rom'
          },
          tileset: {
            type: 'object',
            properties: {
              shared: {
                type: 'boolean',
                default: false
              },
              reduce: {
                type: 'boolean',
                default: false
              },
              compress: {
                type: 'string',
                oneOf: [
                  {
                    const: 'off',
                    title: 'No compression'
                  },
                  {
                    const: 'rle',
                    title: 'Run Length Encoding (RLE)'
                  }
                ],
                default: 'off'
              }
            }
          },
          map: {
            type: 'object',
            properties: {
              generate: {
                type: 'boolean',
                default: true
              },
              reduce: {
                type: 'object',
                properties: {
                  flipped: {
                    type: 'boolean',
                    default: false
                  },
                  unique: {
                    type: 'boolean',
                    default: false
                  }
                }
              },
              compress: {
                type: 'string',
                oneOf: [
                  {
                    const: 'off',
                    title: 'No compression'
                  }
                ],
                default: 'off'
              }
            }
          },
          animation: {
            type: 'object',
            properties: {
              isAnimation: {
                type: 'boolean',
                default: false
              },
              individualFiles: {
                type: 'boolean',
                default: false
              },
              frameWidth: {
                type: 'integer',
                default: 0
              },
              frameHeight: {
                type: 'integer',
                default: 0
              }
            }
          },
          _converted: {
            type: 'array',
            items: {
              image: {
                type: 'string',
                default: ''
              },
              timestamp: {
                type: 'integer'
              },
              name: {
                type: 'string',
                default: ''
              },
              tiles: {
                type: 'integer'
              }
            }
          }
        },
        required: ['images', 'section']
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            label: 'Images',
            scope: '#/properties/_converted'
          },
          {
            type: 'Control',
            label: 'Images',
            scope: '#/properties/images'
          },
          {
            type: 'Control',
            label: 'Name',
            scope: '#/properties/name'
          },
          {
            type: 'Control',
            label: 'Store in',
            scope: '#/properties/section'
          },
          {
            type: 'Group',
            label: 'Charset',
            elements: [
              {
                type: 'HorizontalLayout',
                elements: [
                  {
                    type: 'Control',
                    label: 'Shared',
                    scope: '#/properties/tileset/properties/shared'
                  },
                  {
                    type: 'Control',
                    label: 'Reduction',
                    scope: '#/properties/tileset/properties/reduce'
                  },
                  {
                    type: 'Control',
                    label: 'Compression',
                    scope: '#/properties/tileset/properties/compress'
                  }
                ]
              }
            ]
          },
          {
            type: 'Group',
            label: 'Map',
            elements: [
              {
                type: 'Control',
                label: 'Generate',
                scope: '#/properties/map/properties/generate'
              },
              {
                type: 'HorizontalLayout',
                rule: {
                  effect: 'HIDE',
                  condition: {
                    scope: '#/properties/map/properties/generate',
                    schema: {
                      const: false
                    }
                  }
                },
                elements: [
                  {
                    type: 'Control',
                    label: 'Reduce Flipped',
                    scope: '#/properties/map/properties/reduce/properties/flipped'
                  },
                  {
                    type: 'Control',
                    label: 'Reduce Unique',
                    scope: '#/properties/map/properties/reduce/properties/unique'
                  }
                ]
              }
            ]
          },
          {
            type: 'Group',
            label: 'Animation',
            elements: [
              {
                type: 'Control',
                label: 'Is Animation',
                scope: '#/properties/animation/properties/isAnimation'
              },
              {
                type: 'VerticalLayout',
                rule: {
                  effect: 'HIDE',
                  condition: {
                    scope: '#/properties/animation/properties/isAnimation',
                    schema: {
                      const: false
                    }
                  }
                },
                elements: [
                  {
                    type: 'Control',
                    label: 'Frames are individual images',
                    scope: '#/properties/animation/properties/individualFiles'
                  },
                  {
                    type: 'HorizontalLayout',
                    rule: {
                      effect: 'HIDE',
                      condition: {
                        scope: '#/properties/animation/properties/individualFiles',
                        schema: {
                          const: true
                        }
                      }
                    },
                    elements: [
                      {
                        type: 'Control',
                        label: 'Width',
                        scope: '#/properties/animation/properties/frameWidth'
                      },
                      {
                        type: 'Control',
                        label: 'Height',
                        scope: '#/properties/animation/properties/frameHeight'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      icon: 'fa fa-image',
      templates: ['image.c']
    },
    RomHeader: {
      file: 'RomHeader',
      schema: {
        title: 'ROM Header',
        properties: {
          gameTitle: {
            type: 'string',
            description: "The game's title",
            minLength: 0,
            maxLength: 20,
            default: 'VUENGINE PROJECT'
          },
          'gameCodeSystem': {
            type: 'string',
            description: 'Always \'V\' for \'VUE\'',
            minLength: 1,
            maxLength: 1,
            default: 'V'
          },
          'gameCodeId': {
            type: 'string',
            description: 'Unique game identifier',
            minLength: 2,
            maxLength: 2,
            default: 'VU'
          },
          'gameCodeLanguage': {
            type: 'string',
            description: 'In-game language',
            minLength: 1,
            maxLength: 1,
            default: 'E'
          },
          'makerCode': {
            type: 'string',
            description: "Unique identifier of the game's developer",
            minLength: 2,
            maxLength: 2,
            default: ''
          },
          'revision': {
            type: 'integer',
            description: 'Version of the game, should be counted up with every release',
            minimum: 0,
            maximum: 9,
            default: 0
          }
        },
        required: [
          'gameTitle',
          'gameCodeSystem',
          'gameCodeId',
          'gameCodeLanguage',
          'makerCode',
          'revision'
        ]
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            label: 'Game Title',
            scope: '#/properties/gameTitle'
          },
          {
            type: 'Group',
            label: 'Game Code',
            elements: [
              {
                type: 'HorizontalLayout',
                elements: [
                  {
                    type: 'Control',
                    label: 'System',
                    scope: '#/properties/gameCodeSystem'
                  },
                  {
                    type: 'Control',
                    label: 'ID',
                    scope: '#/properties/gameCodeId'
                  },
                  {
                    type: 'Control',
                    label: 'Language',
                    scope: '#/properties/gameCodeLanguage'
                  }
                ]
              }
            ]
          },
          {
            type: 'Control',
            label: 'Maker Code',
            scope: '#/properties/makerCode'
          },
          {
            type: 'Control',
            label: 'Revision',
            scope: '#/properties/revision',
            options: {
              inputPrefix: '1.'
            }
          }
        ]
      },
      icon: 'fa fa-microchip',
      templates: ['romHeader.h']
    }
  }
};
