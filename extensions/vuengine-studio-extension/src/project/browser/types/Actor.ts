import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const ActorType: ProjectDataType = {
    file: '.actor',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/actor', 'Actor'),
        properties: {
            extraProperties: {
                type: 'object',
                properties: {
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
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false
            },
            animations: {
                type: 'object',
                properties: {
                    default: {
                        type: 'number'
                    },
                    totalFrames: {
                        type: 'integer',
                        minimum: 1,
                        default: 1
                    },
                    multiframe: {
                        type: 'boolean',
                        default: false
                    }
                },
                additionalProperties: false
            },
            components: {
                type: 'object',
                properties: {
                    animations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                },
                                cycles: {
                                    type: 'integer',
                                    minimum: 1,
                                    maximum: 255,
                                    default: 8
                                },
                                callback: {
                                    type: 'string'
                                },
                                loop: {
                                    type: 'boolean',
                                    default: true
                                },
                                frames: {
                                    type: 'array',
                                    items: {
                                        type: 'integer',
                                        minimum: 0
                                    }
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    bodies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
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
                                maximumSpeed: {
                                    type: 'number'
                                },
                                maximumVelocity: {
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
                                gravityAxes: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                },
                                rotationAxes: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    children: {
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
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    colliders: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                },
                                type: {
                                    type: 'string',
                                    default: 'Ball'
                                },
                                pixelSize: {
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
                                },
                                displacement: {
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
                                rotation: {
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
                                scale: {
                                    type: 'object',
                                    properties: {
                                        x: {
                                            type: 'number',
                                            default: 1
                                        },
                                        y: {
                                            type: 'number',
                                            default: 1
                                        },
                                        z: {
                                            type: 'number',
                                            default: 1
                                        }
                                    },
                                    additionalProperties: false
                                },
                                checkForCollisions: {
                                    type: 'boolean',
                                    default: false
                                },
                                layers: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                },
                                layersToCheck: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    mutators: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                mutationClass: {
                                    type: 'string'
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    sounds: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                itemId: {
                                    type: 'string'
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    sprites: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                _imageData: {
                                    type: 'integer',
                                    default: 0
                                },
                                name: {
                                    type: 'string'
                                },
                                sourceType: {
                                    type: 'string',
                                    default: 'image'
                                },
                                imageProcessingSettings: {
                                    type: 'object',
                                    properties: {
                                        colorDistanceFormula: {
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
                                            default: false
                                        }
                                    },
                                    additionalProperties: false
                                },
                                bgmapMode: {
                                    type: 'string',
                                    default: 'Bgmap'
                                },
                                colorMode: {
                                    type: 'number',
                                    default: 0,
                                    min: 0,
                                    max: 1
                                },
                                displayMode: {
                                    type: 'string',
                                    default: 'Mono'
                                },
                                displays: {
                                    type: 'string',
                                    default: 'ON'
                                },
                                isAnimated: {
                                    type: 'boolean',
                                    default: true
                                },
                                transparency: {
                                    type: 'string',
                                    default: 'None'
                                },
                                displacement: {
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
                                manipulationFunction: {
                                    type: 'string'
                                },
                                optimizeTiles: {
                                    type: 'boolean',
                                    default: true
                                },
                                shareTiles: {
                                    type: 'boolean',
                                    default: true
                                },
                                texture: {
                                    type: 'object',
                                    properties: {
                                        files: {
                                            type: 'array',
                                            items: {
                                                type: 'string'
                                            }
                                        },
                                        files2: {
                                            type: 'array',
                                            items: {
                                                type: 'string'
                                            }
                                        },
                                        padding: {
                                            type: 'object',
                                            properties: {
                                                x: {
                                                    type: 'integer',
                                                    maximum: 255,
                                                    minimum: 0
                                                },
                                                y: {
                                                    type: 'integer',
                                                    maximum: 255,
                                                    minimum: 0
                                                }
                                            },
                                            additionalProperties: false
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
                                        flip: {
                                            type: 'object',
                                            properties: {
                                                x: {
                                                    type: 'boolean',
                                                    default: false
                                                },
                                                y: {
                                                    type: 'boolean',
                                                    default: false
                                                }
                                            },
                                            additionalProperties: false
                                        },
                                        repeat: {
                                            type: 'object',
                                            properties: {
                                                mode: {
                                                    type: 'string',
                                                    default: '1x1'
                                                },
                                                x: {
                                                    type: 'boolean',
                                                    default: false
                                                },
                                                y: {
                                                    type: 'boolean',
                                                    default: false
                                                },
                                                size: {
                                                    type: 'object',
                                                    properties: {
                                                        x: {
                                                            type: 'number'
                                                        },
                                                        y: {
                                                            type: 'number'
                                                        }
                                                    },
                                                    additionalProperties: false
                                                }
                                            },
                                            additionalProperties: false
                                        }
                                    },
                                    additionalProperties: false
                                },
                                section: {
                                    type: 'string',
                                    default: 'rom'
                                },
                                compression: {
                                    type: 'string',
                                    default: 'none'
                                }
                            },
                            additionalProperties: false
                        }
                    },
                    wireframes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                },
                                type: {
                                    type: 'string',
                                    default: 'Sphere'
                                },
                                displacement: {
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
                                color: {
                                    type: 'integer',
                                    minimum: 0,
                                    maximum: 3,
                                    default: 3
                                },
                                transparency: {
                                    type: 'string',
                                    default: 'None'
                                },
                                interlaced: {
                                    type: 'boolean',
                                    default: false
                                },
                                segments: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            fromVertex: {
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
                                            toVertex: {
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
                                            }
                                        },
                                        additionalProperties: false
                                    }
                                },
                                length: {
                                    type: 'integer',
                                    default: 32
                                },
                                radius: {
                                    type: 'integer',
                                    default: 32
                                },
                                drawCenter: {
                                    type: 'boolean',
                                    default: true
                                }
                            },
                            additionalProperties: false
                        }
                    }
                },
                additionalProperties: false
            },
            inGameType: {
                type: 'string',
                default: 'None'
            },
            logic: {
                type: 'object',
                properties: {
                    customAllocator: {
                        type: 'string'
                    },
                    configuration: {
                        type: 'object',
                        properties: {},
                        additionalProperties: {
                            type: 'string'
                        }
                    }
                },
                additionalProperties: false
            },
            sprites: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        default: 'Bgmap'
                    }
                },
                additionalProperties: false
            }
        },
        required: []
    },
    uiSchema: {
        type: 'ActorEditor',
        scope: '#'
    },
    icon: 'codicon codicon-smiley',
    templates: [
        'ActorImageData',
        'ActorSpec'
    ]
};
