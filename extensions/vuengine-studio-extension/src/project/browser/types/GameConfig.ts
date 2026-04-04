import { nls } from '@theia/core';
import { PluginsConfigTemplate } from '../template/PluginsConfig';
import { ProjectDataType } from '../ves-project-types';
import { vbToolsLdTemplate } from '../template/vbToolsLd';
import { vbLdTemplate } from '../template/vbLd';
import { ConfigMakeTemplate } from '../template/ConfigMake';
import { ConfigTemplate } from '../template/Config';
import { RomInfoTemplate } from '../template/RomInfo';
import { GameEventsTemplate } from '../template/GameEvents';
import { ColliderLayersTemplate } from '../template/ColliderLayers';
import { InGameTypesTemplate } from '../template/InGameTypes';
import { MessagesTemplate } from '../template/Messages';

export const GameConfigType: ProjectDataType = {
    file: 'GameConfig',
    excludeFromDashboard: true,
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/gameConfig', 'Game Configuration'),
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
            colliderLayers: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            },
            compiler: {
                type: 'object',
                properties: {
                    framePointer: {
                        type: 'boolean',
                        default: false
                    },
                    optimization: {
                        type: 'string',
                        default: 'O2'
                    },
                    prologFunctions: {
                        type: 'boolean',
                        default: false
                    },
                    memorySections: {
                        type: 'object',
                        properties: {
                            dram: {
                                type: 'object',
                                properties: {
                                    length: {
                                        type: 'integer',
                                        default: 32,
                                        minimum: 0
                                    },
                                    origin: {
                                        type: 'string',
                                        default: '0x0003D800'
                                    }
                                },
                                additionalProperties: false
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
                                },
                                additionalProperties: false
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
                                },
                                additionalProperties: false
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
                                },
                                additionalProperties: false
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
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false
                    },
                    memoryUsage: {
                        type: 'object',
                        properties: {
                            initializedData: {
                                type: 'string',
                                default: '.sdata'
                            },
                            memoryPool: {
                                type: 'string',
                                default: '.sdata'
                            },
                            staticSingletons: {
                                type: 'string',
                                default: '.dram_bss'
                            },
                            uninitializedData: {
                                type: 'string',
                                default: '.sbss'
                            },
                            virtualTables: {
                                type: 'string',
                                default: '.dram_bss'
                            }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false,
            },
            engine: {
                type: 'object',
                properties: {
                    affine: {
                        type: 'object',
                        properties: {
                            maxRowsPerCall: {
                                type: 'integer',
                                default: 16
                            },
                            maxScale: {
                                type: 'integer',
                                default: 2
                            }
                        },
                        additionalProperties: false
                    },
                    animation: {
                        type: 'object',
                        properties: {
                            maxAnimationFunctionNameLength: {
                                type: 'integer',
                                default: 16
                            },
                            maxFramesPerAnimationFunction: {
                                type: 'integer',
                                default: 32
                            }
                        },
                        additionalProperties: false
                    },
                    brightness: {
                        type: 'object',
                        properties: {
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
                        additionalProperties: false
                    },
                    tiles: {
                        type: 'object',
                        properties: {
                            totalTiles: {
                                type: 'integer',
                                default: 2048
                            }
                        },
                        additionalProperties: false
                    },
                    debug: {
                        type: 'object',
                        properties: {
                            alertGraphicsDepletion: {
                                type: 'boolean',
                                default: true
                            },
                            diagnostics: {
                                type: 'string',
                                default: 'NONE'
                            },
                            enableProfiler: {
                                type: 'boolean',
                                default: false
                            },
                            stackHeadroom: {
                                type: 'integer',
                                default: 1000
                            }
                        },
                        additionalProperties: false
                    },
                    exceptions: {
                        type: 'object',
                        properties: {
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
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false
                    },
                    frameRate: {
                        type: 'object',
                        properties: {
                            frameCycle: {
                                type: 'integer'
                            },
                            timerResolution: {
                                type: 'integer',
                                default: 10
                            }
                        },
                        additionalProperties: false
                    },
                    macros: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'string'
                                },
                                enabled: {
                                    type: 'boolean',
                                    default: true
                                },
                                name: {
                                    type: 'string',
                                    default: ''
                                },
                                type: {
                                    type: 'string',
                                    default: 'define'
                                },
                                value: {
                                    type: 'string',
                                    default: ''
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    math: {
                        type: 'object',
                        properties: {
                            fixedPointPrecision: {
                                type: 'integer',
                                default: 6
                            }
                        },
                        additionalProperties: false
                    },
                    memoryPools: {
                        type: 'object',
                        properties: {
                            warningThreshold: {
                                type: 'integer',
                                default: 85,
                                minimum: 1,
                                maximum: 100
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
                                    },
                                    additionalProperties: false
                                },
                                default: [
                                    {
                                        objects: 450,
                                        size: 16
                                    },
                                    {
                                        objects: 700,
                                        size: 20
                                    },
                                    {
                                        objects: 350,
                                        size: 28
                                    },
                                    {
                                        objects: 30,
                                        size: 40
                                    },
                                    {
                                        objects: 60,
                                        size: 68
                                    },
                                    {
                                        objects: 50,
                                        size: 80
                                    },
                                    {
                                        objects: 40,
                                        size: 108
                                    },
                                    {
                                        objects: 40,
                                        size: 116
                                    },
                                    {
                                        objects: 10,
                                        size: 140
                                    },
                                    {
                                        objects: 10,
                                        size: 152
                                    }
                                ]
                            }
                        },
                        additionalProperties: false
                    },
                    optics: {
                        type: 'object',
                        properties: {
                            baseFactor: {
                                type: 'integer',
                                default: 32,
                                minimum: 0
                            },
                            cameraNearPlane: {
                                type: 'integer',
                                default: 0
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
                            useLegacyCoordinateProjection: {
                                type: 'boolean',
                                default: false
                            }
                        },
                        additionalProperties: false
                    },
                    palettes: {
                        type: 'object',
                        properties: {
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
                                minimum: 0
                            }
                        },
                        additionalProperties: false
                    },
                    physics: {
                        type: 'object',
                        properties: {
                            angleToPreventColliderDisplacement: {
                                type: 'integer',
                                default: 10,
                                minimum: 0,
                                maximum: 128
                            },
                            frictionForceFactorPower: {
                                type: 'integer',
                                default: 2,
                                minimum: 0
                            },
                            gravity: {
                                type: 'integer',
                                default: 10,
                                minimum: 0,
                                maximum: 100
                            },
                            highPrecision: {
                                type: 'boolean',
                                default: false
                            },
                            maximumBouncinessCoefficient: {
                                type: 'integer',
                                default: 1,
                                minimum: 0
                            },
                            maximumFrictionCoefficient: {
                                type: 'integer',
                                default: 1,
                                minimum: 0,
                                maximum: 256
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
                            },
                            collidersMaximumSize: {
                                type: 'integer',
                                default: 256,
                                minimum: 0
                            }
                        },
                        additionalProperties: false
                    },
                    random: {
                        type: 'object',
                        properties: {
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
                        additionalProperties: false
                    },
                    sound: {
                        type: 'object',
                        properties: {
                            earDisplacement: {
                                type: 'integer',
                                default: 384,
                                minimum: 0
                            },
                            stereoAttenuationDistance: {
                                type: 'integer',
                                default: 2048,
                                minimum: 0
                            },
                            groups: {
                                type: 'object',
                                properties: {
                                    general: {
                                        type: 'integer',
                                        default: 15,
                                        minimum: 0,
                                        maximun: 15
                                    },
                                    music: {
                                        type: 'integer',
                                        default: 15,
                                        minimum: 0,
                                        maximum: 15
                                    },
                                    effects: {
                                        type: 'integer',
                                        default: 15,
                                        minimum: 0,
                                        maximum: 15
                                    },
                                    other: {
                                        type: 'integer',
                                        default: 15,
                                        minimum: 0,
                                        maximum: 15
                                    }
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false
                    },
                    sprite: {
                        type: 'object',
                        properties: {
                            totalLayers: {
                                type: 'integer',
                                default: 32,
                                minimum: 1,
                                maximum: 32
                            },
                            totalObjects: {
                                type: 'integer',
                                default: 1024,
                                minimum: 1,
                                maximum: 1024
                            },
                            spritesRotateIn3D: {
                                type: 'boolean',
                                default: true
                            },
                            hackBgmapSpriteHeight: {
                                type: 'boolean',
                                default: true
                            }
                        },
                        additionalProperties: false
                    },
                    sram: {
                        type: 'object',
                        properties: {
                            totalSram: {
                                type: 'integer',
                                default: 8192,
                                minimum: 0
                            }
                        },
                        additionalProperties: false
                    },
                    texture: {
                        type: 'object',
                        properties: {
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
                                            parallax: {
                                                type: 'integer',
                                                default: 0,
                                                minimum: 0
                                            }
                                        },
                                        additionalProperties: false
                                    }
                                },
                                additionalProperties: false
                            },
                            paramTableSegments: {
                                type: 'integer',
                                default: 1,
                                minimum: 0
                            }
                        },
                        additionalProperties: false
                    },
                    wireframes: {
                        type: 'object',
                        properties: {
                            sort: {
                                type: 'boolean',
                                default: true
                            },
                            interlacedThreshold: {
                                type: 'integer',
                                default: 4096,
                                maximum: 8191,
                                minimum: 512
                            },
                            lineShrinkingPadding: {
                                type: 'integer',
                                default: 0,
                                maximum: 256,
                                minimum: 0
                            },
                            frustumExtensionPower: {
                                type: 'integer',
                                default: 0,
                                maximum: 4,
                                minimum: 0
                            },
                            verticalLineOptimization: {
                                type: 'boolean',
                                default: false
                            }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false,
            },
            events: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            },
            inGameTypes: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            },
            messages: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'string'
                }
            },
            romInfo: {
                type: 'object',
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
                },
                additionalProperties: false,
            },
            additionalProperties: false,
        },
        required: []
    },
    uiSchema: {
        type: 'GameConfigEditor',
        scope: '#'
    },
    icon: 'codicon codicon-gear',
    templates: [
        PluginsConfigTemplate,
        ConfigTemplate,
        ConfigMakeTemplate,
        vbLdTemplate,
        vbToolsLdTemplate,
        RomInfoTemplate,
        GameEventsTemplate,
        ColliderLayersTemplate,
        InGameTypesTemplate,
        MessagesTemplate,
    ]
};
