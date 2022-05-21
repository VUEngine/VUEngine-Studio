import { RegisteredTypes } from '../../../project/browser/ves-project-types';

export const registeredTypes: RegisteredTypes = {
  BrightnessRepeats: {
    schema: {
      title: 'Brightness Repeat',
      properties: {
        typeId: {
          const: 'BrightnessRepeats'
        }
      }
    },
    icon: 'fa fa-sun-o'
  },
  BrightnessRepeat: {
    schema: {
      title: 'Brightness Repeat',
      properties: {
        typeId: {
          const: 'BrightnessRepeat'
        },
        name: {
          type: 'string'
        },
        mirror: {
          type: 'boolean',
          default: true
        },
        values: {
          type: 'array',
          items: {
            type: 'integer',
            default: 15,
            minimum: 0,
            maximum: 15
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'BrightnessRepeats',
      multiple: true
    },
    icon: 'fa fa-table'
  },
  ColumnTables: {
    schema: {
      title: 'Column Table',
      properties: {
        typeId: {
          const: 'ColumnTables'
        }
      }
    },
    icon: 'fa fa-table'
  },
  ColumnTable: {
    schema: {
      title: 'Column Table',
      properties: {
        typeId: {
          const: 'ColumnTable'
        },
        name: {
          type: 'string'
        },
        description: {
          type: 'string'
        },
        mirror: {
          type: 'boolean',
          default: true
        },
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              repeat: {
                type: 'integer',
                default: 15,
                minimum: 0,
                maximum: 15
              },
              time: {
                type: 'integer',
                default: 15,
                minimum: 0,
                maximum: 15
              },
            }
          },
          maxItems: 256,
          minItems: 128
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'ColumnTables',
      multiple: true
    },
    icon: 'fa fa-table'
  },
  Compiler: {
    schema: {
      title: 'Compiler Config',
      properties: {
        typeId: {
          const: 'Compiler'
        },
        framePointer: {
          type: 'boolean',
          default: false
        },
        optimization: {
          type: 'string',
          enum: [
            'O0',
            'O1',
            'O2',
            'O3',
            'Ofast',
            'Os',
          ],
          default: 'O2'
        },
        output: {
          type: 'string',
          enum: [
            'c',
          ],
          default: 'c'
        },
        prologFunctions: {
          type: 'boolean',
          default: false
        },
        scrambleBinary: {
          type: 'boolean',
          default: false
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'ProjectSettings',
      multiple: false
    },
    icon: 'fa fa-cogs'
  },
  CompilerMemorySections: {
    schema: {
      title: 'Memory Sections',
      properties: {
        typeId: {
          const: 'CompilerMemorySections'
        },
        dram: {
          type: 'object',
          properties: {
            length: {
              type: 'integer',
              default: -24,
              maximum: 0
            },
            origin: {
              type: 'string'
            }
          }
        },
        exp: {
          type: 'object',
          properties: {
            length: {
              type: 'integer',
              default: 16,
              minimum: 0
            },
            origin: {
              type: 'string',
              default: '0x04000000'
            }
          }
        },
        rom: {
          type: 'object',
          properties: {
            length: {
              type: 'integer',
              default: 16,
              minimum: 0
            },
            origin: {
              type: 'string',
              default: '0x07000000'
            }
          }
        },
        sram: {
          type: 'object',
          properties: {
            length: {
              type: 'integer',
              default: 16,
              minimum: 0
            },
            origin: {
              type: 'string',
              default: '0x06000000'
            }
          }
        },
        wram: {
          type: 'object',
          properties: {
            length: {
              type: 'integer',
              default: 64,
              minimum: 0
            },
            origin: {
              type: 'string',
              default: '0x05000000'
            }
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'Compiler',
      multiple: false
    },
    icon: 'fa fa-cogs'
  },
  CompilerMemoryUsage: {
    schema: {
      title: 'Memory Usage',
      properties: {
        typeId: {
          const: 'CompilerMemoryUsage'
        },
        initializedData: {
          type: 'string',
          enum: [
            '.dram_bss',
            '.sbss',
            '.sdata',
            '.sram_bss'
          ],
          default: '.sdata'
        },
        memoryPool: {
          type: 'string',
          enum: [
            '.dram_bss',
            '.sbss',
            '.sdata',
            '.sram_bss'
          ],
          default: '.sdata'
        },
        staticSingletons: {
          type: 'string',
          enum: [
            '.dram_bss',
            '.sbss',
            '.sdata',
            '.sram_bss'
          ],
          default: '.dram_bss'
        },
        uninitializedData: {
          type: 'string',
          enum: [
            '.dram_bss',
            '.sbss',
            '.sdata',
            '.sram_bss'
          ],
          default: '.sbss'
        },
        virtualTables: {
          type: 'string',
          enum: [
            '.dram_bss',
            '.sbss',
            '.sdata',
          ],
          default: '.dram_bss'
        },
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'Compiler',
      multiple: false
    },
    icon: 'fa fa-cogs'
  },
  DebugMacros: {
    schema: {
      title: 'Debug Macros',
      properties: {
        typeId: {
          const: 'DebugMacros'
        },
        macros: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              value: {
                type: 'string'
              },
              define: {
                type: 'boolean',
                default: false
              },
              dependent: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'ProjectSettings',
      multiple: false
    },
    icon: 'fa fa-bug'
  },
  EngineConfig: {
    schema: {
      title: 'Engine Config',
      properties: {
        typeId: {
          const: 'EngineConfig'
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'ProjectSettings',
      multiple: false
    },
    icon: 'fa fa-sliders'
  },
  EngineConfigAffine: {
    schema: {
      title: 'Affine',
      properties: {
        typeId: {
          const: 'EngineConfigAffine'
        },
        maxRowsPerCall: {
          type: 'integer',
          default: 16
        },
        maxScale: {
          type: 'integer',
          default: 2
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-clone'
  },
  EngineConfigAnimation: {
    schema: {
      title: 'Animation',
      properties: {
        typeId: {
          const: 'EngineConfigAnimation'
        },
        maxAnimationFunctionNameLength: {
          type: 'integer',
          default: 16
        },
        maxAnimationFunctions: {
          type: 'integer',
          default: 32
        },
        maxFramesPerAnimationFunction: {
          type: 'integer',
          default: 16
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-film'
  },
  EngineConfigBrightness: {
    schema: {
      title: 'Brightness',
      properties: {
        typeId: {
          const: 'EngineConfigBrightness'
        },
        brightRed: {
          type: 'integer',
          default: 128
        },
        mediumRed: {
          type: 'integer',
          default: 64
        },
        darkRed: {
          type: 'integer',
          default: 32
        },
        fadeDelay: {
          type: 'integer',
          default: 16
        },
        fadeIncrement: {
          type: 'integer',
          default: 1
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-sun-o'
  },
  EngineConfigChars: {
    schema: {
      title: 'Chars',
      properties: {
        typeId: {
          const: 'EngineConfigChars'
        },
        totalChars: {
          type: 'integer',
          default: 2048
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-table'
  },
  EngineConfigCommunications: {
    schema: {
      title: 'Communications',
      properties: {
        typeId: {
          const: 'EngineConfigCommunications'
        },
        enabled: {
          type: 'boolean',
          default: false
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-commenting-o'
  },
  EngineConfigDebug: {
    schema: {
      title: 'Debug',
      properties: {
        typeId: {
          const: 'EngineConfigDebug'
        },
        alertForTornFrames: {
          type: 'boolean',
          default: false
        },
        alertStackOverflow: {
          type: 'boolean',
          default: false
        },
        alertVipOvertime: {
          type: 'boolean',
          default: false
        },
        dimmForProfiling: {
          type: 'boolean',
          default: false
        },
        enableProfiler: {
          type: 'boolean',
          default: false
        },
        printDetailedMemoryPoolStatus: {
          type: 'boolean',
          default: false
        },
        printFramerate: {
          type: 'boolean',
          default: false
        },
        printMemoryPoolStatus: {
          type: 'boolean',
          default: false
        },
        profileGame: {
          type: 'boolean',
          default: false
        },
        profileGameStateDuringVipInterrupt: {
          type: 'boolean',
          default: false
        },
        profileStreaming: {
          type: 'boolean',
          default: false
        },
        showDetailedMemoryPoolStatus: {
          type: 'boolean',
          default: false
        },
        showGameProfiling: {
          type: 'boolean',
          default: false
        },
        showMemoryPoolStatus: {
          type: 'boolean',
          default: false
        },
        showStackOverflowAlert: {
          type: 'boolean',
          default: false
        },
        showStreamingProfiling: {
          type: 'boolean',
          default: false
        },
        stackHeadroom: {
          type: 'integer',
          default: 1000
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-bug'
  },
  EngineConfigExceptions: {
    schema: {
      title: 'Exceptions',
      properties: {
        typeId: {
          const: 'EngineConfigExceptions'
        },
        position: {
          type: 'object',
          properties: {
            x: {
              type: 'integer',
              default: 0,
              maximum: 47,
              minimum: 0
            },
            y: {
              type: 'integer',
              default: 0,
              maximum: 27,
              minimum: 0
            }
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-exclamation-circle'
  },
  EngineConfigFrameRate: {
    schema: {
      title: 'Frame Rate',
      properties: {
        typeId: {
          const: 'EngineConfigFrameRate'
        },
        forceVipSync: {
          type: 'boolean',
          default: false
        },
        frameCycle: {
          type: 'integer',
          default: 0,
          minimum: 0
        },
        runDelayedMessagesAtHalfFrameRate: {
          type: 'boolean',
          default: false
        },
        timerResolution: {
          type: 'integer',
          default: 10
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-fast-forward'
  },
  EngineConfigMemoryPools: {
    schema: {
      title: 'Memory Pools',
      properties: {
        typeId: {
          const: 'EngineConfigMemoryPools'
        },
        cleanUp: {
          type: 'boolean',
          default: false
        },
        warningThreshold: {
          type: 'integer',
          default: 85,
          minimum: 25
        },
        pools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objects: {
                type: 'integer',
                default: 1,
                minimum: 1
              },
              size: {
                type: 'integer',
                default: 1,
                minimum: 1
              }
            }
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-database'
  },
  EngineConfigOptics: {
    schema: {
      title: 'Optics',
      properties: {
        typeId: {
          const: 'EngineConfigOptics'
        },
        baseFactor: {
          type: 'integer',
          default: 32,
          minimum: 0
        },
        cameraMinimumDisplacementPixelsPower: {
          type: 'integer',
          default: 1,
          minimum: 0
        },
        distanceEyeScreen: {
          type: 'integer',
          default: 384,
          minimum: 0
        },
        horizontalViewPointCenter: {
          type: 'integer',
          default: 192,
          minimum: 0
        },
        maximumXViewDistance: {
          type: 'integer',
          default: 2048,
          minimum: 0
        },
        maximumYViewDistance: {
          type: 'integer',
          default: 4096,
          minimum: 0
        },
        parallaxCorrectionFactor: {
          type: 'integer',
          default: 4,
          minimum: 0
        },
        scalingModifierFactor: {
          type: 'integer',
          default: 1,
          minimum: 0
        },
        screenDepth: {
          type: 'integer',
          default: 2048,
          minimum: 0
        },
        screenHeight: {
          type: 'integer',
          default: 224,
          minimum: 0
        },
        screenWidth: {
          type: 'integer',
          default: 384,
          minimum: 0
        },
        verticalViewPointCenter: {
          type: 'integer',
          default: 112,
          minimum: 0
        },
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-eye'
  },
  EngineConfigPalettes: {
    schema: {
      title: 'Palettes',
      properties: {
        typeId: {
          const: 'EngineConfigPalettes'
        },
        bgMapPalette0: {
          type: 'string',
          default: '11100100'
        },
        bgMapPalette1: {
          type: 'string',
          default: '11100000'
        },
        bgMapPalette2: {
          type: 'string',
          default: '10010000'
        },
        bgMapPalette3: {
          type: 'string',
          default: '01010000'
        },
        objectPalette0: {
          type: 'string',
          default: '11100100'
        },
        objectPalette1: {
          type: 'string',
          default: '11100000'
        },
        objectPalette2: {
          type: 'string',
          default: '10010000'
        },
        objectPalette3: {
          type: 'string',
          default: '01010000'
        },
        printingPalette: {
          type: 'integer',
          default: 0,
          maximum: 3,
          minimum: 0,
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-paint-brush'
  },
  EngineConfigPhysics: {
    schema: {
      title: 'Physics',
      properties: {
        typeId: {
          const: 'EngineConfigPhysics'
        },
        bodiesToCheckForGravity: {
          type: 'integer',
          default: 10,
          minimum: 0
        },
        frictionForceFactorPower: {
          type: 'integer',
          default: 2,
          minimum: 0
        },
        gravity: {
          type: 'number',
          default: 20,
          minimum: 0
        },
        maximumBouncinessCoefficient: {
          type: 'integer',
          default: 1,
          minimum: 0
        },
        stopBouncingVelocityThreshold: {
          type: 'integer',
          default: 48,
          minimum: 0
        },
        stopVelocityThreshold: {
          type: 'integer',
          default: 8,
          minimum: 0
        },
        timeElapsedDivisor: {
          type: 'integer',
          default: 2,
          minimum: 0
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-compass'
  },
  EngineConfigRandom: {
    schema: {
      title: 'Random',
      properties: {
        typeId: {
          const: 'EngineConfigRandom'
        },
        addUserInputAndTimeToRandomSeed: {
          type: 'boolean',
          default: false
        },
        seedCycles: {
          type: 'integer',
          default: 2,
          minimum: 1
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-random'
  },
  EngineConfigSound: {
    schema: {
      title: 'Sound',
      properties: {
        typeId: {
          const: 'EngineConfigSound'
        },
        leftEarCenter: {
          type: 'integer',
          default: 96
        },
        rightEarCenter: {
          type: 'integer',
          default: 288
        },
        stereoHorizontalAttenuationFactor: {
          type: 'integer',
          default: 50,
          minimum: 0
        },
        stereoVerticalAttenuationFactor: {
          type: 'integer',
          default: 50,
          minimum: 0
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-volume-up'
  },
  EngineConfigSprite: {
    schema: {
      title: 'Sprite',
      properties: {
        typeId: {
          const: 'EngineConfigSprite'
        },
        totalLayers: {
          type: 'integer',
          default: 32,
          minimum: 1
        },
        hackBgmapSpriteHeight: {
          type: 'boolean',
          default: true
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-image'
  },
  EngineConfigSram: {
    schema: {
      title: 'SRAM',
      properties: {
        typeId: {
          const: 'EngineConfigSram'
        },
        totalSram: {
          type: 'integer',
          default: 8192,
          minimum: 0
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-microchip'
  },
  EngineConfigTexture: {
    schema: {
      title: 'Texture',
      properties: {
        typeId: {
          const: 'EngineConfigTexture'
        },
        bgmapsPerSegments: {
          type: 'integer',
          default: 14,
          minimum: 0
        },
        printing: {
          type: 'object',
          properties: {
            offset: {
              type: 'object',
              properties: {
                x: {
                  type: 'integer',
                  default: 0,
                  minimum: 0
                },
                y: {
                  type: 'integer',
                  default: 0,
                  minimum: 0
                },
                z: {
                  type: 'integer',
                  default: 0,
                  minimum: 0
                },
                parallax: {
                  type: 'integer',
                  default: 0,
                  minimum: 0
                }
              }
            },
            printableArea: {
              type: 'integer',
              default: 1792,
              minimum: 0
            }
          }
        },
        paramTableSegments: {
          type: 'integer',
          default: 1,
          minimum: 0
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'EngineConfig',
      multiple: false
    },
    icon: 'fa fa-file-image-o'
  },
  Events: {
    schema: {
      title: 'Events',
      properties: {
        typeId: {
          const: 'Events'
        },
        events: {
          type: 'array',
          items: {
            type: 'string',
            default: 'NewEvent'
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'ProjectSettings',
      multiple: false
    },
    icon: 'fa fa-bullhorn'
  },
  Entities: {
    schema: {
      title: 'Entities',
      properties: {
        typeId: {
          const: 'Entities'
        }
      }
    },
    icon: 'fa fa-id-card-o'
  },
  Entity: {
    schema: {
      title: 'Entity',
      properties: {
        typeId: {
          const: 'Entity'
        },
        name: {
          type: 'string',
          default: 'Name'
        },
        class: {
          type: 'string',
          default: 'Entity'
        },
        extraInfo: {
          type: 'string'
        },
        pixelSize: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              minimum: 0
            },
            y: {
              type: 'number',
              minimum: 0
            },
            z: {
              type: 'number',
              minimum: 0
            }
          }
        }
      },
      required: [
        'name'
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/name'
        },
        {
          type: 'Control',
          scope: '#/properties/class'
        },
        {
          type: 'Control',
          scope: '#/properties/extraInfo'
        },
        {
          type: 'Group',
          label: 'Size (x, y, z)',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/pixelSize/properties/x'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/pixelSize/properties/y'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/pixelSize/properties/z'
                }
              ]
            }
          ]
        }
      ]
    },
    parent: {
      typeId: 'Entities',
      multiple: true
    },
    icon: 'fa fa-id-card-o'
  },
  EntityAnimations: {
    schema: {
      title: 'Animations',
      properties: {
        typeId: {
          const: 'EntityAnimations'
        },
        default: {
          type: 'string'
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'fa fa-film'
  },
  EntityAnimation: {
    schema: {
      title: 'Animation',
      properties: {
        typeId: {
          const: 'EntityAnimation'
        },
        name: {
          type: 'string'
        },
        cycles: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
          default: 8
        },
        callback: {
          type: 'string'
        },
        loop: {
          type: 'boolean',
          default: false,
        },
        frames: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0
          }
        },
      },
      required: [
        'name'
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'EntityAnimations',
      multiple: true
    },
    icon: 'fa fa-film'
  },
  EntityBehaviors: {
    schema: {
      title: 'Behaviors',
      properties: {
        typeId: {
          const: 'EntityBehaviors'
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'fa fa-map-signs'
  },
  EntityChildren: {
    schema: {
      title: 'Children',
      properties: {
        typeId: {
          const: 'EntityChildren'
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'fa fa-sitemap'
  },
  EntityCollisions: {
    schema: {
      title: 'Collisions',
      properties: {
        typeId: {
          const: 'EntityCollisions'
        },
        inGameType: {
          type: 'string',
          default: 'None'
        },
        shapes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'LineField',
                  'Box',
                  'InverseBox',
                  'Ball'
                ]
              },
              pixelSize: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              displacement: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  },
                  parallax: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              rotation: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              scale: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              checkForCollisions: {
                type: 'boolean',
                default: false
              },
              layers: {
                type: 'string'
              },
              layersToIgnore: {
                type: 'string'
              }
            }
          }
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'fa fa-object-ungroup'
  },
  EntityMeshes: {
    schema: {
      title: 'Meshes',
      properties: {
        typeId: {
          const: 'EntityMeshes'
        },
        meshes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromVertex: {
                type: 'string'
              },
              toVertex: {
                type: 'string'
              },
              bufferIndex: {
                type: 'integer',
                minimum: 0,
                maximum: 255
              }
            }
          }
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'codicon codicon-globe'
  },
  EntityPhysics: {
    schema: {
      title: 'Physics',
      properties: {
        typeId: {
          const: 'EntityPhysics'
        },
        enabled: {
          type: 'boolean',
          default: false
        },
        mass: {
          type: 'number'
        },
        friction: {
          type: 'number'
        },
        bounciness: {
          type: 'number'
        },
        maximumVelocity: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              minimum: 0
            },
            y: {
              type: 'number',
              minimum: 0
            },
            z: {
              type: 'number',
              minimum: 0
            }
          }
        },
        maximumSpeed: {
          type: 'number'
        },
      },
      required: [
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'Enable physics',
          scope: '#/properties/enabled'
        },
        {
          type: 'VerticalLayout',
          rule: {
            effect: 'HIDE',
            condition: {
              scope: '#/properties/enabled',
              schema: {
                const: false
              }
            }
          },
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/mass'
                },
                {
                  type: 'Control',
                  scope: '#/properties/friction'
                },
                {
                  type: 'Control',
                  scope: '#/properties/bounciness'
                }
              ]
            },
            {
              type: 'Group',
              label: 'Maximum Velocity (x, y, z)',
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      label: false,
                      scope: '#/properties/maximumVelocity/properties/x'
                    },
                    {
                      type: 'Control',
                      label: false,
                      scope: '#/properties/maximumVelocity/properties/y'
                    },
                    {
                      type: 'Control',
                      label: false,
                      scope: '#/properties/maximumVelocity/properties/z'
                    }
                  ]
                }
              ]
            },
            {
              type: 'Control',
              scope: '#/properties/maximumSpeed'
            }
          ]
        }
      ]
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'fa fa-compass'
  },
  EntitySprites: {
    schema: {
      title: 'Sprites',
      properties: {
        typeId: {
          const: 'EntitySprites'
        },
        type: {
          type: 'string',
          enum: [
            'Bgmap',
            'Object'
          ],
          default: 'Bgmap'
        },
        useZDisplacementInProjection: {
          type: 'boolean',
          default: false
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'Entity',
      multiple: false
    },
    icon: 'fa fa-picture-o'
  },
  EntitySprite: {
    schema: {
      title: 'Sprite',
      properties: {
        typeId: {
          const: 'EntitySprite'
        },
        name: {
          type: 'string'
        },
        class: {
          type: 'string',
          default: 'BgmapSprite'
        },
        bgmapMode: {
          type: 'string',
          enum: ['BGMAP', 'AFFINE', 'OBJECT', 'HBIAS'],
          default: 'BGMAP'
        },
        displayMode: {
          type: 'string',
          enum: ['Both', 'Left', 'Right'],
          default: 'Both'
        },
        transparency: {
          type: 'string',
          enum: ['None', 'Even', 'Odd'],
          default: 'None'
        },
        displacement: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              minimum: 0
            },
            y: {
              type: 'number',
              minimum: 0
            },
            z: {
              type: 'number',
              minimum: 0
            },
            parallax: {
              type: 'number',
              minimum: 0
            }
          }
        },
        manipulationFunction: {
          type: 'string'
        },
        texture: {
          type: 'object',
          properties: {
            charset: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'animatedSingle',
                    'animatedSingleOptimized',
                    'animatedShared',
                    'animatedSharedCoordinated',
                    'animatedMulti',
                    'notAnimated'
                  ],
                  default: 'notAnimated'
                }
              }
            },
            image: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                chars: {
                  type: 'integer',
                  minimum: 0
                }
              }
            },
            padding: {
              type: 'object',
              properties: {
                x: {
                  type: 'integer',
                  minimum: 0
                },
                y: {
                  type: 'integer',
                  minimum: 0
                }
              }
            },
            palette: {
              type: 'integer',
              minimum: 0,
              maximum: 3
            },
            recycleable: {
              type: 'boolean',
              default: false
            },
            size: {
              type: 'object',
              properties: {
                x: {
                  type: 'integer',
                  minimum: 0
                },
                y: {
                  type: 'integer',
                  minimum: 0
                }
              }
            },
          },
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/name'
        },
        {
          type: 'Control',
          scope: '#/properties/class'
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/bgmapMode'
            },
            {
              type: 'Control',
              scope: '#/properties/displayMode'
            },
            {
              type: 'Control',
              scope: '#/properties/transparency'
            }
          ]
        },
        {
          type: 'HorizontalLayout',
          rule: {
            effect: 'SHOW',
            condition: {
              scope: '#/properties/bgmapMode',
              schema: {
                enum: ['AFFINE', 'HBIAS']
              }
            }
          },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/manipulationFunction'
            }
          ]
        },
        {
          type: 'Group',
          label: 'Displacement (x, y, z, parallax)',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/x'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/y'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/z'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/parallax'
                }
              ]
            }
          ]
        },
        {
          type: 'Group',
          label: 'Texture',
          elements: [
            {
              type: 'Control',
              label: 'Charset Type',
              scope: '#/properties/texture/properties/charset/properties/type'
            },
            {
              type: 'Group',
              label: 'Image',
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/texture/properties/image/properties/name'
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/texture/properties/image/properties/chars'
                    }
                  ]
                },
                {
                  type: 'Group',
                  label: 'Padding (X, Y)',
                  elements: [
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/padding/properties/x'
                        },
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/padding/properties/y'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'Control',
                  scope: '#/properties/texture/properties/palette'
                },
                {
                  type: 'Control',
                  scope: '#/properties/texture/properties/recycleable'
                },
                {
                  type: 'Group',
                  label: 'Size (X, Y)',
                  elements: [
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/size/properties/x'
                        },
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/size/properties/y'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    parent: {
      typeId: 'EntitySprites',
      multiple: true
    },
    icon: 'fa fa-picture-o'
  },
  Fonts: {
    schema: {
      title: 'Fonts',
      properties: {
        typeId: {
          const: 'Fonts'
        }
      }
    },
    icon: 'fa fa-font'
  },
  Font: {
    schema: {
      title: 'Font',
      properties: {
        typeId: {
          const: 'Font'
        },
        name: {
          type: 'string'
        },
        tiles: {
          type: 'string'
        },
        type: {
          type: 'string',
          enum: ['bgmap', 'object'],
          default: 'bgmap'
        },
        offset: {
          type: 'integer',
          default: 0,
          minimum: 0
        },
        characterCount: {
          type: 'integer',
          default: 256,
          minimum: 0
        },
        charactersPerLine: {
          type: 'integer',
          default: 16,
          minimum: 0
        },
        size: {
          type: 'object',
          properties: {
            x: {
              type: 'integer',
              default: 1,
              minimum: 1
            },
            y: {
              type: 'integer',
              default: 1,
              minimum: 1
            }
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'Fonts',
      multiple: true
    },
    icon: 'fa fa-font'
  },
  Images: {
    schema: {
      title: 'Images',
      properties: {
        typeId: {
          const: 'Images'
        }
      }
    },
    icon: 'fa fa-image'
  },
  Image: {
    schema: {
      title: 'Image',
      properties: {
        typeId: {
          const: 'Image'
        },
        images: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        name: {
          type: 'string'
        },
        section: {
          type: 'string',
          enum: ['rom', 'exp'],
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
              enum: ['off', 'rle'],
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
              enum: ['off', 'rle'],
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
        }
      },
      required: [
        'images',
        'section',
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
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
            },
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
                      scope: '#/properties/animation/properties/frameWidth'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    parent: {
      typeId: 'Images',
      multiple: true
    },
    icon: 'fa fa-image'
  },
  I18n: {
    schema: {
      title: 'Internationalization',
      properties: {
        typeId: {
          const: 'I18n'
        },
        strings: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    icon: 'fa fa-language',
    leaf: true
  },
  I18nLanguage: {
    schema: {
      title: 'Language',
      properties: {
        typeId: {
          const: 'I18nLanguage'
        },
        name: {
          type: 'string'
        },
        code: {
          type: 'string',
          maxLength: 2,
          minLength: 2
        },
        id: {
          type: 'string'
        },
        flag: {
          type: 'string'
        },
        order: {
          type: 'integer',
          minimum: 0
        },
        strings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              translation: {
                type: 'string'
              }
            }
          }
        }
      },
      required: [],
      additionalProperties: false
    },
    parent: {
      typeId: 'I18n',
      multiple: true
    },
    icon: 'fa fa-language'
  },
  ProjectSettings: {
    schema: {
      title: 'Project Settings',
      properties: {
        typeId: {
          const: 'ProjectSettings'
        }
      }
    },
    icon: 'fa fa-cog'
  },
  Project: {
    schema: {
      title: 'Project',
      properties: {
        typeId: {
          const: 'Project'
        },
        title: {
          type: 'string',
          default: 'VUEngine Project'
        },
        author: {
          type: 'string'
        },
        description: {
          type: 'string'
        }
      },
      required: [
        'name'
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'Project Name',
          scope: '#/properties/title'
        },
        {
          type: 'Control',
          label: 'Author(s)',
          scope: '#/properties/author'
        },
        {
          type: 'Control',
          label: 'Description',
          scope: '#/properties/description'
        }
      ]
    },
    parent: {
      typeId: 'ProjectSettings',
      multiple: false
    },
    icon: 'fa fa-cog'
  },
  RomHeader: {
    schema: {
      title: 'ROM Header',
      properties: {
        typeId: {
          const: 'RomHeader'
        },
        gameTitle: {
          type: 'string',
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
          maxLength: 2
        },
        revision: {
          type: 'integer',
          maximum: 9,
          minimum: 0,
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
      ],
      additionalProperties: false
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
            },
          ],
        },
        {
          type: 'Control',
          label: 'Maker Code',
          scope: '#/properties/makerCode'
        },
        {
          type: 'Control',
          label: 'Revision',
          scope: '#/properties/revision'
        }
      ]
    },
    parent: {
      typeId: 'ProjectSettings',
      multiple: false
    },
    icon: 'fa fa-microchip'
  },
  RumbleEffects: {
    schema: {
      title: 'Rumble Effects',
      properties: {
        typeId: {
          const: 'RumbleEffects'
        }
      }
    },
    icon: 'codicon codicon-screen-full codicon-rotate-90'
  },
  RumbleEffect: {
    schema: {
      title: 'Rumble Effect',
      properties: {
        typeId: {
          const: 'RumbleEffect'
        },
        name: {
          type: 'string'
        },
        effect: {
          type: 'integer',
          default: 0,
          maximum: 123,
          minimum: 0
        },
        frequency: {
          type: 'integer',
          enum: [160, 240, 320, 400],
          default: 160
        },
        sustainPositive: {
          type: 'integer',
          maximum: 255,
          minimum: 0,
          default: 255
        },
        sustainNegative: {
          type: 'integer',
          maximum: 255,
          minimum: 0,
          default: 255
        },
        overdrive: {
          type: 'integer',
          maximum: 255,
          minimum: 0,
          default: 255
        },
        break: {
          type: 'integer',
          maximum: 255,
          minimum: 0,
          default: 255
        },
        stopBeforeStarting: {
          type: 'boolean',
          default: true
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    parent: {
      typeId: 'RumbleEffects',
      multiple: true
    },
    icon: 'codicon codicon-screen-full codicon-rotate-90'
  },
  Sounds: {
    schema: {
      title: 'Sound & Music',
      properties: {
        typeId: {
          const: 'Sounds'
        }
      }
    },
    icon: 'fa fa-music'
  },
  Stages: {
    schema: {
      title: 'Stages',
      properties: {
        typeId: {
          const: 'Stages'
        }
      }
    },
    icon: 'fa fa-cube'
  },
};
