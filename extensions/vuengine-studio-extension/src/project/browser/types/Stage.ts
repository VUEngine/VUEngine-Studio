import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const StageType: ProjectDataType = {
    enabled: false,
    file: '.stage',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/stage', 'Stage'),
        properties: {
            actors: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        itemId: {
                            type: 'string'
                        },
                        onScreenPosition: {
                            type: 'object',
                            properties: {
                                x: {
                                    type: 'number'
                                },
                                y: {
                                    type: 'number'
                                },
                                z: {
                                    type: 'number'
                                }
                            },
                            additionalProperties: false
                        },
                        onScreenRotation: {
                            type: 'object',
                            properties: {
                                x: {
                                    type: 'number'
                                },
                                y: {
                                    type: 'number'
                                },
                                z: {
                                    type: 'number'
                                }
                            },
                            additionalProperties: false
                        },
                        onScreenScale: {
                            type: 'object',
                            properties: {
                                x: {
                                    type: 'number'
                                },
                                y: {
                                    type: 'number'
                                },
                                z: {
                                    type: 'number'
                                }
                            },
                            additionalProperties: false
                        },
                        name: {
                            type: 'string'
                        },
                        children: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        extraInfo: {
                            type: 'string'
                        },
                        loadRegardlessOfPosition: {
                            type: 'boolean',
                            default: false
                        },
                        pinToScreen: {
                            type: 'boolean',
                            default: false
                        }
                    },
                    additionalProperties: false
                }
            },
            level: {
                type: 'object',
                properties: {
                    cameraFrustum: {
                        type: 'object',
                        properties: {
                            x0: {
                                type: 'number',
                                default: 0
                            },
                            x1: {
                                type: 'number',
                                default: 0
                            },
                            y0: {
                                type: 'number',
                                default: 0
                            },
                            y1: {
                                type: 'number',
                                default: 0
                            },
                            z0: {
                                type: 'number',
                                default: 0
                            },
                            z1: {
                                type: 'number',
                                default: 0
                            }
                        },
                        additionalProperties: false
                    },
                    cameraInitialPosition: {
                        type: 'object',
                        properties: {
                            x: {
                                type: 'number'
                            },
                            y: {
                                type: 'number'
                            },
                            z: {
                                type: 'number'
                            },
                            parallax: {
                                type: 'number'
                            }
                        },
                        additionalProperties: false
                    },
                    size: {
                        type: 'object',
                        properties: {
                            x: {
                                type: 'number',
                                minimum: 1,
                                default: 32
                            },
                            y: {
                                type: 'number',
                                minimum: 1,
                                default: 32
                            },
                            z: {
                                type: 'number',
                                minimum: 1,
                                default: 32
                            }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false
            },
            physics: {
                type: 'object',
                properties: {
                    frictionCoefficient: {
                        type: 'number'
                    },
                    gravity: {
                        type: 'object',
                        properties: {
                            x: {
                                type: 'number'
                            },
                            y: {
                                type: 'number'
                            },
                            z: {
                                type: 'number'
                            }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false
            },
            rendering: {
                type: 'object',
                properties: {
                    colorConfig: {
                        type: 'object',
                        properties: {
                            backgroundColor: {
                                type: 'number'
                            },
                            brightness: {
                                type: 'object',
                                properties: {
                                    dark: {
                                        type: 'number'
                                    },
                                    medium: {
                                        type: 'string'
                                    },
                                    bright: {
                                        type: 'string'
                                    }
                                },
                                additionalProperties: false
                            },
                            brightnessRepeat: {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    maximumAffineRowsToComputePerCall: {
                        type: 'number'
                    },
                    objectSpritesContainersSize: {
                        type: 'array',
                        items: {
                            type: 'number'
                        }
                    },
                    objectSpritesContainersZPosition: {
                        type: 'array',
                        items: {
                            type: 'number'
                        }
                    },
                    paletteConfig: {
                        type: 'object',
                        properties: {
                            bgmap: {
                                type: 'object',
                                properties: {
                                    gplt0: {
                                        type: 'number'
                                    },
                                    gplt1: {
                                        type: 'number'
                                    },
                                    gplt2: {
                                        type: 'number'
                                    },
                                    gplt3: {
                                        type: 'number'
                                    }
                                },
                                additionalProperties: false
                            },
                            object: {
                                type: 'object',
                                properties: {
                                    jplt0: {
                                        type: 'number'
                                    },
                                    jplt1: {
                                        type: 'number'
                                    },
                                    jplt2: {
                                        type: 'number'
                                    },
                                    jplt3: {
                                        type: 'number'
                                    }
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false
                    },
                    paramTableSegments: {
                        type: 'number'
                    },
                    pixelOptical: {
                        type: 'object',
                        properties: {
                            maximumXViewDistance: {
                                type: 'number'
                            },
                            maximumYViewDistance: {
                                type: 'number'
                            },
                            cameraNearPlane: {
                                type: 'number'
                            },
                            baseDistance: {
                                type: 'number'
                            },
                            horizontalViewPointCenter: {
                                type: 'number'
                            },
                            verticalViewPointCenter: {
                                type: 'number'
                            },
                            scalingFactor: {
                                type: 'number'
                            }
                        },
                        additionalProperties: false
                    },
                    texturesMaximumRowsToWrite: {
                        type: 'number'
                    }
                },
                additionalProperties: false
            },
            sound: {
                type: 'object',
                properties: {
                    midiPlaybackCounterPerInterrupt: {
                        type: 'number'
                    },
                    pcmTargetPlaybackRefreshRate: {
                        type: 'number'
                    }
                },
                additionalProperties: false
            },
            timer: {
                type: 'object',
                properties: {
                    resolution: {
                        type: 'number'
                    },
                    timePerInterrupt: {
                        type: 'number'
                    },
                    timePerInterruptUnits: {
                        type: 'number'
                    }
                },
                additionalProperties: false
            }
        },
        required: []
    },
    uiSchema: {
        type: 'StageEditor',
        scope: '#'
    },
    icon: 'codicon codicon-symbol-method',
    templates: []
};
