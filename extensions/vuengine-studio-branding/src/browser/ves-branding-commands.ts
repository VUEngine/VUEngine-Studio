import { Command } from '@theia/core';

export namespace VesBrandingCommands {
    export const CATEGORY = 'VUEngine Studio';

    export const REPORT_ISSUE: Command = {
        id: 'ves:report-issue',
        category: CATEGORY,
        label: 'Report Issue'
    };
    export const SUPPORT: Command = {
        id: 'ves:support',
        category: CATEGORY,
        label: 'Support VUEngine Studio'
    };
}
