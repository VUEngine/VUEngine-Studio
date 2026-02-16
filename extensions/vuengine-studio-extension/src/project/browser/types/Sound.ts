import { nls } from '@theia/core';
import {
    VSU_ENVELOPE_INITIAL_VALUE_DEFAULT,
    VSU_ENVELOPE_INITIAL_VALUE_MAX,
    VSU_ENVELOPE_INITIAL_VALUE_MIN,
    VSU_ENVELOPE_STEP_TIME_DEFAULT,
    VSU_ENVELOPE_STEP_TIME_MAX,
    VSU_ENVELOPE_STEP_TIME_MIN,
    VSU_INTERVAL_DEFAULT,
    VSU_INTERVAL_MAX,
    VSU_INTERVAL_MIN,
    VSU_NOISE_TAP,
    VSU_NUMBER_OF_CHANNELS,
    VSU_SWEEP_MODULATION_FREQUENCY_DEFAULT,
    VSU_SWEEP_MODULATION_FREQUENCY_MAX,
    VSU_SWEEP_MODULATION_FREQUENCY_MIN,
    VSU_SWEEP_MODULATION_INTERVAL_DEFAULT,
    VSU_SWEEP_MODULATION_INTERVAL_MAX,
    VSU_SWEEP_MODULATION_INTERVAL_MIN,
    VSU_SWEEP_MODULATION_SHIFT_DEFAULT,
    VSU_SWEEP_MODULATION_SHIFT_MAX,
    VSU_SWEEP_MODULATION_SHIFT_MIN,
    VsuEnvelopeDirection,
    VsuSweepDirection,
    VsuSweepModulationFunction
} from '../../../editors/browser/components/SoundEditor/Emulator/VsuTypes';
import { SET_INT_DEFAULT, SoundEditorTrackType, SoundGroup, TRACK_PRIORITY_DEFAULT } from '../../../editors/browser/components/SoundEditor/SoundEditorTypes';
import { SoundSpecTemplate } from '../template/SoundSpec';
import { ProjectDataType } from '../ves-project-types';

export const SoundType: ProjectDataType = {
    file: '.sound',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/sound', 'Sound'),
        properties: {
            name: {
                type: 'string'
            },
            author: {
                type: 'string'
            },
            comment: {
                type: 'string'
            },
            group: {
                type: 'string',
                default: SoundGroup.General
            },
            tracks: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            default: SoundEditorTrackType.WAVE
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
                        priority: {
                            type: 'number',
                            default: TRACK_PRIORITY_DEFAULT
                        },
                        skippable: {
                            type: 'boolean',
                            default: true
                        }
                    },
                    additionalProperties: false
                },
                maxItems: VSU_NUMBER_OF_CHANNELS
            },
            patterns: {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string'
                        },
                        type: {
                            type: 'string',
                            default: SoundEditorTrackType.WAVE
                        },
                        size: {
                            type: 'number',
                            default: 16
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
                            default: SoundEditorTrackType.WAVE
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
                            minItems: 32,
                            default: [62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0]
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
                                    minimum: VSU_INTERVAL_MIN,
                                    maximum: VSU_INTERVAL_MAX,
                                    default: VSU_INTERVAL_DEFAULT,
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
                                    minimum: 0,
                                    maximum: 1,
                                    default: VsuEnvelopeDirection.Decay,
                                },
                                initialValue: {
                                    type: 'integer',
                                    minimum: VSU_ENVELOPE_INITIAL_VALUE_MIN,
                                    maximum: VSU_ENVELOPE_INITIAL_VALUE_MAX,
                                    default: VSU_ENVELOPE_INITIAL_VALUE_DEFAULT,
                                },
                                stepTime: {
                                    type: 'integer',
                                    minimum: VSU_ENVELOPE_STEP_TIME_MIN,
                                    maximum: VSU_ENVELOPE_STEP_TIME_MAX,
                                    default: VSU_ENVELOPE_STEP_TIME_DEFAULT,
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
                                    minimum: 0,
                                    maximum: 1,
                                    default: VsuSweepModulationFunction.Sweep,
                                },
                                frequency: {
                                    type: 'integer',
                                    minimum: VSU_SWEEP_MODULATION_FREQUENCY_MIN,
                                    maximum: VSU_SWEEP_MODULATION_FREQUENCY_MAX,
                                    default: VSU_SWEEP_MODULATION_FREQUENCY_DEFAULT,
                                },
                                interval: {
                                    type: 'integer',
                                    minimum: VSU_SWEEP_MODULATION_INTERVAL_MIN,
                                    maximum: VSU_SWEEP_MODULATION_INTERVAL_MAX,
                                    default: VSU_SWEEP_MODULATION_INTERVAL_DEFAULT,
                                },
                                direction: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 1,
                                    default: VsuSweepDirection.Down,
                                },
                                shift: {
                                    type: 'integer',
                                    minimum: VSU_SWEEP_MODULATION_SHIFT_MIN,
                                    maximum: VSU_SWEEP_MODULATION_SHIFT_MAX,
                                    default: VSU_SWEEP_MODULATION_SHIFT_DEFAULT,
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
                            maximum: VSU_NOISE_TAP.length,
                        },
                        setInt: {
                            type: 'boolean',
                            default: SET_INT_DEFAULT
                        },
                    },
                    additionalProperties: false
                }
            },
            size: {
                type: 'number',
                default: 256
            },
            speed: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'object',
                    properties: {},
                    additionalProperties: {
                        type: 'integer'
                    }
                },
                default: {
                    0: 64
                }
            },
            timeSignature: {
                type: 'object',
                properties: {},
                additionalProperties: {
                    type: 'object',
                    properties: {},
                    additionalProperties: {
                        type: 'string'
                    }
                },
                default: {
                    0: '4/4'
                }
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
