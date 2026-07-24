import { nls } from '@theia/core';
import { PcmSpecTemplate } from '../template/PCM';
import { ProjectDataType } from '../ves-project-types';

export const PcmType: ProjectDataType = {
    file: '.pcm',
    schema: {
        title: nls.localize('vuengine/projects/typeLabels/pcm', 'PCM Conversion'),
        properties: {
            sourceFile: {
                type: 'string',
                default: ''
            },
            author: {
                type: 'string',
                default: ''
            },
            loop: {
                type: 'boolean',
                default: false
            },
            section: {
                type: 'string',
                default: 'rom'
            },
            timer: {
                type: 'object',
                properties: {
                    resolution: {
                        type: 'string',
                        default: '20US'
                    },
                    targetTimePerInterrupt: {
                        type: 'integer',
                        minimum: 1,
                        default: 120
                    },
                    targetTimePerInterruptUnits: {
                        type: 'string',
                        default: 'US'
                    }
                },
                additionalProperties: false
            }
        },
        required: []
    },
    uiSchema: {
        type: 'PCMEditor',
        scope: '#'
    },
    icon: 'codicon ph ph-waveform',
    templates: [
        PcmSpecTemplate
    ],
    forFiles: [
        '.wav'
    ]
};
