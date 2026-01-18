import { nls } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';
import { ControlPosition } from 'react-draggable';
import { nanoid } from '../../editors/browser/components/Common/Utils';
import { Displays } from '../../editors/browser/components/Common/VUEngineTypes';
import { createEmptyPixelData } from '../../editors/browser/components/PixelEditor/PixelEditor';
import { DEFAULT_IMAGE_SIZE } from '../../editors/browser/components/PixelEditor/PixelEditorTypes';
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
  excludeFromDashboard?: boolean
  icon?: string
  schema: any
  uiSchema?: any
  templates?: string[]
  forFiles?: string[]
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

export interface WithId {
  _id: string
}

export interface WithFileUri {
  _fileUri: URI
}

export interface WithVersion {
  _version: string
}

export interface WithType {
  type: ProjectDataType & WithContributor
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

export enum ProjectUpdateMode {
  All = 'all',
  LowerVersionOnly = 'lowerVersionOnly',
}

export interface DashboardConfigPositionMap {
  [id: string]: ControlPosition
};

export interface DashboardConfig {
  positions: DashboardConfigPositionMap
}

export interface GameConfig {
  projectTitle: string
  projectAuthor: string
  plugins: { [id: string]: object }
  dashboard: DashboardConfig
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
      template: 'PluginConfig.h.njk',
      itemSpecific: 'PluginFile'
    },
    'PluginConfigMake': {
      targets: [{
        path: 'config.make',
        root: ProjectDataTemplateTargetRoot.file,
      }],
      template: 'PluginConfig.make.njk',
      itemSpecific: 'PluginFile'
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
      excludeFromDashboard: true,
      schema: {
        title: nls.localize('vuengine/projects/typeLabels/gameConfig', 'Game Config'),
        properties: {
          dashboard: {
            type: 'object',
            properties: {
              positions: {
                type: 'object',
                properties: {},
                additionalProperties: true,
              },
            },
            additionalProperties: false,
          },
          plugins: {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
          projectAuthor: {
            type: 'string'
          },
          projectTitle: {
            type: 'string'
          },
          additionalProperties: false,
        },
        required: []
      },
      icon: 'codicon codicon-gear',
      templates: ['PluginsConfig']
    },
    Image: {
      file: '.image',
      schema: {
        title: nls.localize('vuengine/projects/typeLabels/image', 'Image'),
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
          colorMode: {
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
    Pixel: {
      enabled: false,
      file: '.pixel',
      schema: {
        title: nls.localize('vuengine/projects/typeLabels/pixel', 'Pixel Art'),
        properties: {
          colorMode: {
            type: 'number'
          },
          frames: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string'
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: {
                        type: 'number',
                      }
                    }
                  },
                  isVisible: {
                    type: 'boolean',
                    default: true,
                  },
                  name: {
                    type: 'string'
                  },
                  parallax: {
                    type: 'number'
                  },
                  displays: {
                    type: 'string',
                    default: 'ON'
                  },
                },
                additionalProperties: false,
              }
            },
            default: [[{
              data: createEmptyPixelData(DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_SIZE),
              displays: Displays.Both,
              id: nanoid(),
              isVisible: true,
              name: '',
              parallax: 0,
            }]]
          },
        },
        required: []
      },
      uiSchema: {
        type: 'PixelEditor',
        scope: '#'
      },
      icon: 'codicon codicon-symbol-color'
    },
    PluginFile: {
      file: 'vuengine.plugin',
      excludeFromDashboard: true,
      schema: {
        title: nls.localize('vuengine/projects/typeLabels/pluginFile', 'VUEngine Plugin'),
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
              type: 'object',
              properties: {},
              additionalProperties: {
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
                  minimum: 1,
                  default: 1,
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
      icon: 'codicon codicon-plug',
      templates: [
        'PluginConfig',
        'PluginConfigMake',
      ]
    },
    RomInfo: {
      file: 'RomInfo',
      schema: {
        title: nls.localize('vuengine/projects/typeLabels/romInfo', 'ROM Info'),
        properties: {
          gameTitle: {
            type: 'string',
            description: "The game's title",
            minLength: 0,
            maxLength: 20,
            default: 'VUENGINE PROJECT'
          },
          gameCodeSystem: {
            type: 'string',
            minLength: 1,
            maxLength: 1,
            default: 'V'
          },
          gameCodeId: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            default: 'VU'
          },
          gameCodeLanguage: {
            type: 'string',
            minLength: 1,
            maxLength: 1,
            default: 'E'
          },
          makerCode: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            default: '  '
          },
          revision: {
            type: 'integer',
            minimum: 0,
            maximum: 9,
            default: 0
          }
        }
      },
      uiSchema: {
        type: 'RomInfoEditor',
        scope: '#'
      },
      icon: 'codicon codicon-chip',
      templates: ['RomInfo']
    }
  }
};
