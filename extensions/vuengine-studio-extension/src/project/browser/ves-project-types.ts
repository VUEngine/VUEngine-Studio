import URI from '@theia/core/lib/common/uri';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';
import { DEFAULT_SPRITE_SIZE } from '../../editors/browser/components/SpriteEditor/SpriteEditorTypes';
import { VesPluginsData } from '../../plugins/browser/ves-plugin';

export const VUENGINE_WORKSPACE_EXT = 'workspace';

export const PROJECT_CHANNEL_NAME = 'Project Data';

export interface ProjectData {
  items?: ProjectDataItems
  templates?: ProjectDataTemplates
  types?: ProjectDataTypes
};

export interface ProjectDataWithContributor {
  plugins?: { [id: string]: VesPluginsData }
  items?: ProjectDataItemsByTypeWithContributor
  templates?: ProjectDataTemplatesWithContributor
  types?: ProjectDataTypesWithContributor
};

export interface ProjectDataItemsByType {
  [typeId: string]: ProjectDataItems
};

export interface ProjectDataItems {
  [itemId: string]: ProjectDataItem
};

export interface ProjectDataItem {
  [id: string]: unknown
};

export interface ProjectDataItemsWithContributor extends ProjectDataItem {
  [id: string]: unknown & WithContributor & WithFileUri
};

export interface ProjectDataItemsByTypeWithContributor {
  [typeId: string]: ProjectDataItemsWithContributor
};

export interface ProjectDataTypes {
  [typeId: string]: ProjectDataType
};

export interface ProjectDataTypesWithContributor extends ProjectDataTypes {
  [typeId: string]: ProjectDataType & WithContributor
};

export interface ProjectDataType {
  enabled?: boolean
  file: string
  icon?: string
  schema: any
  uiSchema?: any
  templates?: string[]
  forFiles?: string[]
  delete?: string[]
};

export interface ProjectDataTemplates {
  [key: string]: ProjectDataTemplate
}

export interface ProjectDataTemplatesWithContributor extends ProjectDataTemplates {
  [key: string]: ProjectDataTemplate & WithContributor
}

export interface ProjectDataTemplateEvent {
  type: ProjectDataTemplateEventType
  value?: unknown
}

export enum ProjectDataTemplateEventType {
  installedPluginsChanged = 'installedPluginsChanged',
  itemOfTypeGotDeleted = 'itemOfTypeGotDeleted',
}

export enum ProjectDataTemplateTargetRoot {
  project = 'project',
  file = 'file',
}
export enum ProjectDataTemplateTargetForEachOfType {
  var = 'var',
  fileInFolder = 'fileInFolder',
}

export interface ProjectDataTemplateTarget {
  path: string
  root: ProjectDataTemplateTargetRoot
  forEachOf?: { [ProjectDataTemplateTargetForEachOfType.var]: string } | { [ProjectDataTemplateTargetForEachOfType.fileInFolder]: string | string[] }
  conditions?: RulesLogic<AdditionalOperation>
}

export interface ProjectDataTemplate {
  enabled?: boolean
  targets: ProjectDataTemplateTarget[]
  template: string
  encoding?: ProjectDataTemplateEncoding
  itemSpecific?: string
  events?: ProjectDataTemplateEvent[]
}

export interface WithContributor {
  _contributor: ProjectContributor
  _contributorUri: URI
}

export interface WithFileUri {
  _fileUri: URI
}

export enum ProjectDataTemplateEncoding {
  ShiftJIS = 'shift_jis',
  utf8 = 'utf8',
  win1252 = 'win1252',
}

export enum ProjectContributor {
  Engine = 'engine',
  Plugin = 'plugin',
  Project = 'project',
  Studio = 'studio',
}

export const defaultProjectData: ProjectData = {
  templates: {
    'Image': {
      targets: [{
        path: 'Converted/${_forEachOfBasename}.c',
        root: ProjectDataTemplateTargetRoot.file,
        forEachOf: { 'var': 'files' },
        conditions: {
          'and': [
            { '>': [{ 'var': 'files.length' }, 0] },
            {
              'or': [
                { '==': [{ 'var': 'animation.isAnimation' }, false] },
                { '==': [{ 'var': 'animation.individualFiles' }, false] }
              ]
            },
            { '==': [{ 'var': 'tileset.shared' }, false] }
          ]
        }
      }, {
        path: 'Converted/${_forEachOfBasename}.c',
        root: ProjectDataTemplateTargetRoot.file,
        forEachOf: { 'fileInFolder': ['*.png'] },
        conditions: {
          'and': [
            { '==': [{ 'var': 'files.length' }, 0] },
            {
              'or': [
                { '==': [{ 'var': 'animation.isAnimation' }, false] },
                { '==': [{ 'var': 'animation.individualFiles' }, false] }
              ]
            },
            { '==': [{ 'var': 'tileset.shared' }, false] }
          ]
        }
      }, {
        path: 'Converted/${_filename}.c',
        root: ProjectDataTemplateTargetRoot.file,
        conditions: {
          'or': [
            {
              'and': [
                { '==': [{ 'var': 'animation.isAnimation' }, true] },
                { '==': [{ 'var': 'animation.individualFiles' }, true] }
              ]
            },
            { '==': [{ 'var': 'tileset.shared' }, true] }
          ]
        }
      }],
      template: 'Image.c.njk',
      itemSpecific: 'Image'
    },
    'PluginConfig': {
      targets: [{
        path: 'headers/Config.h',
        root: ProjectDataTemplateTargetRoot.file,
      }],
      template: 'PluginConfig.h.njk'
    },
    'PluginConfigMake': {
      targets: [{
        path: 'config.make',
        root: ProjectDataTemplateTargetRoot.file,
      }],
      template: 'PluginConfig.make.njk'
    },
    'PluginsConfig': {
      targets: [{
        path: 'headers/PluginsConfig.h',
        root: ProjectDataTemplateTargetRoot.project,
      }],
      template: 'PluginsConfig.h.njk'
    },
    'RomInfo': {
      targets: [{
        path: 'headers/RomInfo.h',
        root: ProjectDataTemplateTargetRoot.project,
      }],
      template: 'RomInfo.h.njk',
      encoding: ProjectDataTemplateEncoding.ShiftJIS
    }
  },
  types: {
    GameConfig: {
      file: 'GameConfig',
      schema: {
        title: 'Game Config',
        properties: {
          plugins: {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
          projectTitle: {
            type: 'string'
          }
        },
        required: []
      },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            label: 'Project Title',
            scope: '#/properties/projectTitle'
          }
        ]
      },
      icon: 'codicon codicon-gear',
      templates: ['PluginsConfig']
    },
    Image: {
      file: '.image',
      schema: {
        title: 'Image Conversion',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string'
            }
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
              compression: {
                type: 'string',
                oneOf: [
                  {
                    const: 'none',
                    title: 'No compression'
                  },
                  {
                    const: 'rle',
                    title: 'Run Length Encoding (RLE)'
                  }
                ],
                default: 'none'
              }
            },
            additionalProperties: false,
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
                },
                additionalProperties: false,
              },
              compression: {
                type: 'string',
                oneOf: [
                  {
                    const: 'none',
                    title: 'No compression'
                  }
                ],
                default: 'none'
              }
            },
            additionalProperties: false,
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
              frames: {
                type: 'integer',
                default: 0
              },
            },
            additionalProperties: false,
          },
          imageProcessingSettings: {
            type: 'object',
            properties: {
              distanceCalculator: {
                type: 'string',
                default: 'euclidean'
              },
              imageQuantizationAlgorithm: {
                type: 'string',
                default: 'nearest'
              },
              minimumColorDistanceToDither: {
                type: 'number',
                default: 0
              },
              serpentine: {
                type: 'boolean',
                default: false,
              }
            },
            additionalProperties: false,
          },
          'colorMode': {
            type: 'number',
            default: 0,
            min: 0,
            max: 1
          },
        },
        required: ['files', 'section']
      },
      uiSchema: {
        type: 'ImageEditor',
        scope: '#'
      },
      icon: 'codicon codicon-file-media',
      templates: ['Image'],
      forFiles: ['.png']
    },
    PluginFile: {
      file: 'vuengine.plugin',
      schema: {
        title: 'Plugin File',
        properties: {
          displayName: {
            type: 'object',
            properties: {},
            additionalProperties: {
              type: 'string'
            }
          },
          author: {
            type: 'string'
          },
          description: {
            type: 'object',
            properties: {},
            additionalProperties: {
              type: 'string'
            }
          },
          repository: {
            type: 'string'
          },
          license: {
            type: 'string'
          },
          tags: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          },
          dependencies: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          configuration: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                label: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                },
                dataType: {
                  type: 'string',
                },
                type: {
                  type: 'string',
                },
                min: {
                  type: 'integer',
                },
                max: {
                  type: 'integer',
                },
                step: {
                  type: 'integer',
                },
                default: {
                  type: 'integer',
                },
              },
              additionalProperties: false,
            }
          },
        },
        required: []
      },
      uiSchema: {
        type: 'PluginFileEditor',
        scope: '#'
      },
      icon: 'ves-codicon-file-icon codicon codicon-plug medium-purple',
      templates: [
        'PluginConfig',
        'PluginConfigMake',
      ]
    },
    RomInfo: {
      file: 'RomInfo',
      schema: {
        title: 'ROM Info',
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
      templates: ['RomInfo']
    },
    Sprite: {
      enabled: false,
      file: '.sprite',
      schema: {
        title: 'Sprite',
        properties: {
          colorMode: {
            type: 'number'
          },
          dimensions: {
            type: 'object',
            properties: {
              x: {
                type: 'number',
                default: DEFAULT_SPRITE_SIZE
              },
              y: {
                type: 'number',
                default: DEFAULT_SPRITE_SIZE
              }
            },
            additionalProperties: false,
          },
          layers: {
            type: 'object',
            properties: {},
            additionalProperties: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                isVisible: {
                  type: 'boolean'
                },
                data: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        rowIndex: {
                          type: 'integer'
                        },
                        columnIndex: {
                          type: 'integer'
                        },
                        color: {
                          type: 'string'
                        }
                      },
                      additionalProperties: false,
                    }
                  }
                },
                name: {
                  type: 'string'
                },
                parallax: {
                  type: 'number'
                },
                displayMode: {
                  type: 'string',
                  default: 'ON'
                }
              },
              additionalProperties: false,
            }
          }
        },
        required: []
      },
      uiSchema: {
        type: 'SpriteEditor',
        scope: '#'
      },
      icon: 'codicon codicon-circuit-board'
    },
    VsuSandbox: {
      file: '.vsu',
      schema: {
        title: 'VSU Sandbox',
        properties: {
          channels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                enabled: {
                  type: 'boolean',
                  default: false
                },
                interval: {
                  type: 'object',
                  properties: {
                    enabled: {
                      type: 'boolean',
                      default: false
                    },
                    value: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 31
                    }
                  },
                  additionalProperties: false,
                },
                frequency: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 2047
                },
                waveform: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 4
                },
                stereoLevels: {
                  type: 'object',
                  properties: {
                    left: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 15,
                      default: 15,
                    },
                    right: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 15,
                      default: 15,
                    }
                  },
                  additionalProperties: false,
                },
                envelope: {
                  type: 'object',
                  properties: {
                    enabled: {
                      type: 'boolean',
                      default: false
                    },
                    repeat: {
                      type: 'boolean',
                      default: false
                    },
                    direction: {
                      type: 'boolean',
                      default: true
                    },
                    initialValue: {
                      type: 'integer',
                      default: 15,
                      minimum: 0,
                      maximum: 15
                    },
                    stepTime: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 7
                    },
                  },
                  additionalProperties: false,
                },
                sweepMod: {
                  type: 'object',
                  properties: {
                    enabled: {
                      type: 'boolean',
                      default: false
                    },
                    repeat: {
                      type: 'boolean',
                      default: true
                    },
                    function: {
                      type: 'boolean',
                      default: true
                    },
                    frequency: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 1
                    },
                    interval: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 7
                    },
                    direction: {
                      type: 'boolean',
                      default: true
                    },
                    shift: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 7
                    }
                  },
                  additionalProperties: false,
                },
                tapLocation: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 7
                }
              },
              additionalProperties: false,
            },
            minItems: 6,
            maxItems: 6,
          },
          waveforms: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'integer',
                minimum: 1,
                maximum: 64,
                default: 1,
              },
              minItems: 32,
              maxItems: 32
            },
            minItems: 5,
            maxItems: 5
          },
          modulation: {
            type: 'array',
            items: {
              type: 'integer',
              minimum: 1,
              maximum: 256,
              default: 1,
            },
            minItems: 32,
            maxItems: 32
          }
        },
        required: []
      },
      uiSchema: {
        type: 'VsuSandbox',
        scope: '#'
      },
      icon: 'codicon codicon-graph'
    }
  }
};
