import URI from '@theia/core/lib/common/uri';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';

export const VUENGINE_WORKSPACE_EXT = 'workspace';

export const PROJECT_CHANNEL_NAME = 'Project Data';

export interface ProjectFile {
  combined?: {
    items?: ProjectFileItemsByTypeWithContributor
    templates?: ProjectFileTemplatesWithContributor
    types?: ProjectFileTypesWithContributor
  }
  items?: ProjectFileItems
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

export interface ProjectFileItemsWithContributor extends ProjectFileItem {
  [id: string]: unknown & WithContributor & WithFileUri
};

export interface ProjectFileItemsByTypeWithContributor {
  [typeId: string]: ProjectFileItemsWithContributor
};

export interface ProjectFileTypes {
  [typeId: string]: ProjectFileType
};

export interface ProjectFileTypesWithContributor extends ProjectFileTypes {
  [typeId: string]: ProjectFileType & WithContributor
};

export interface ProjectFileType {
  enabled?: boolean
  file: string
  icon?: string
  schema: any
  uiSchema?: any
  templates?: string[]
  forFiles?: string[]
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

export enum ProjectFileTemplateTargetRoot {
  project = 'project',
  file = 'file',
}
export enum ProjectFileTemplateTargetForEachOfType {
  var = 'var',
  fileInFolder = 'fileInFolder',
}

export interface ProjectFileTemplateTarget {
  path: string
  root: ProjectFileTemplateTargetRoot
  forEachOf?: { [ProjectFileTemplateTargetForEachOfType.var]: string } | { [ProjectFileTemplateTargetForEachOfType.fileInFolder]: string | string[] }
  conditions?: RulesLogic<AdditionalOperation>
}

export interface ProjectFileTemplate {
  enabled?: boolean
  targets: ProjectFileTemplateTarget[]
  template: string
  encoding?: ProjectFileTemplateEncoding
  itemSpecific?: string
  events?: ProjectFileTemplateEvent[]
}

export interface WithContributor {
  _contributor: ProjectContributor
  _contributorUri: URI
}

export interface WithFileUri {
  _fileUri: URI
}

export enum ProjectFileTemplateEncoding {
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

export const defaultProjectData: ProjectFile = {
  templates: {
    'Image.c': {
      targets: [{
        path: 'Converted/${_forEachOfBasename}.c',
        root: ProjectFileTemplateTargetRoot.file,
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
        root: ProjectFileTemplateTargetRoot.file,
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
        root: ProjectFileTemplateTargetRoot.file,
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
      template: 'Image.c.nj',
      itemSpecific: 'Image'
    },
    'RomInfo.h': {
      targets: [{
        path: 'headers/RomInfo.h',
        root: ProjectFileTemplateTargetRoot.project,
      }],
      template: 'RomInfo.h.nj',
      encoding: ProjectFileTemplateEncoding.ShiftJIS
    }
  },
  types: {
    GameConfig: {
      file: 'GameConfig',
      schema: {
        title: 'Game Config',
        properties: {
          plugins: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          projectTitle: {
            type: 'string'
          }
        },
        required: []
      },
      icon: 'fa fa-cog'
    },
    Image: {
      file: '.imageConv',
      schema: {
        title: 'Image Conversion',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string'
            }
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
              frames: {
                type: 'integer',
                default: 0
              },
            }
          }
        },
        required: ['files', 'section']
      },
      uiSchema: {
        type: 'ImageConvEditor',
        scope: '#'
      },
      icon: 'fa fa-image',
      templates: ['Image.c'],
      forFiles: ['.png']
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
      templates: ['RomInfo.h']
    }
  }
};
