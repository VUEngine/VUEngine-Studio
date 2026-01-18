import { nls } from '@theia/core';
import { ProjectDataType } from '../ves-project-types';

export const CompilerConfigType: ProjectDataType = {
    file: 'CompilerConfig',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/compilerConfig', 'Compiler Config'),
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
        required: []
    },
    uiSchema: {
        type: 'CompilerConfigEditor',
        scope: '#'
    },
    icon: 'codicon codicon-terminal',
    templates: [
        'Config',
        'configMake',
        'vbLd',
        'vbToolsLd'
    ]
};
