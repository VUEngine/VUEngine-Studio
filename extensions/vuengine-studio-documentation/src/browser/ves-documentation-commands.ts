import { Command } from '@theia/core';

export namespace VesDocumentationCommands {
    export const CATEGORY = 'Documentation';

    export const OPEN_HANDBOOK: Command = {
        id: 'ves:documentation',
        category: CATEGORY,
        label: 'Open Handbook'
    };
}
