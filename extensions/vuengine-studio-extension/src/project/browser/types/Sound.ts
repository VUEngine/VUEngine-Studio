import { nls } from '@theia/core';
import { SoundSpecTemplate } from '../template/SoundSpec';
import { ProjectDataType } from '../ves-project-types';

export const SoundType: ProjectDataType = {
    file: '.sound',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/sound', 'Sound'),
        properties: {
            name: {
                type: 'string',
                default: ''
            },
            author: {
                type: 'string',
                default: ''
            },
            comment: {
                type: 'string',
                default: ''
            },
            tracks: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            default: 'wave'
                        },
                        instrument: {
                            type: 'string'
                        },
                        sequence: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string'
                            }
                        },
                        allowSkip: {
                            type: 'boolean',
                            default: false
                        }
                    },
                    additionalProperties: false
                },
                maxItems: 6
            },
            patterns: {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            default: ''
                        },
                        type: {
                            type: 'string',
                            default: 'wave'
                        },
                        size: {
                            type: 'number',
                            default: 4
                        },
                        events: {
                            type: 'object',
                            properties: {},
                            additionalProperties: {
                                type: 'object',
                                properties: {},
                                additionalProperties: {
                                    type: ['integer', 'string']
                                }
                            }
                        }
                    }
                }
            },
            instruments: {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        },
                        type: {
                            type: 'string',
                            default: 'wave'
                        },
                        color: {
                            type: 'number',
                            default: 4
                        },
                        waveform: {
                            type: 'array',
                            items: {
                                type: 'integer',
                                default: 0,
                                maximum: 63,
                                minimum: 0
                            },
                            maxItems: 32,
                            minItems: 32
                        },
                        volume: {
                            type: 'object',
                            properties: {
                                left: {
                                    type: 'integer',
                                    default: 15,
                                    minimum: 0,
                                    maximum: 15
                                },
                                right: {
                                    type: 'integer',
                                    default: 15,
                                    minimum: 0,
                                    maximum: 15
                                }
                            },
                            additionalProperties: false
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
                            additionalProperties: false
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
                                    type: 'number',
                                    default: 0
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
                                }
                            },
                            additionalProperties: false
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
                                    type: 'number',
                                    default: 1
                                },
                                frequency: {
                                    type: 'integer',
                                    minimum: 0,
                                    maximum: 1
                                },
                                interval: {
                                    type: 'integer',
                                    minimum: 1,
                                    maximum: 7
                                },
                                direction: {
                                    type: 'number',
                                    default: 0
                                },
                                shift: {
                                    type: 'integer',
                                    default: 7,
                                    minimum: 0,
                                    maximum: 7
                                }
                            },
                            additionalProperties: false
                        },
                        modulationData: {
                            type: 'array',
                            items: {
                                type: 'integer',
                                minimum: 0,
                                maximum: 255,
                                default: 0
                            },
                            minItems: 32,
                            maxItems: 32
                        },
                        tap: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 7
                        }
                    },
                    additionalProperties: false
                }
            },
            size: {
                type: 'number',
                default: 64
            },
            speed: {
                type: 'integer',
                default: 64,
                minimum: 1,
                maximum: 128
            },
            loop: {
                type: 'boolean',
                default: false
            },
            loopPoint: {
                type: 'number',
                default: 0
            },
            section: {
                type: 'string',
                default: 'rom'
            }
        },
        required: []
    },
    uiSchema: {
        type: 'SoundEditor',
        scope: '#'
    },
    icon: 'codicon codicon-music',
    templates: [
        SoundSpecTemplate
    ]
};
