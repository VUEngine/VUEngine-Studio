import { nls, PreferenceScope } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesAiPreferenceIds {
    export const CATEGORY = 'agentAccess';

    export const ENABLED = [CATEGORY, 'enabled'].join('.');
    export const PORT = [CATEGORY, 'port'].join('.');
}

export const DEFAULT_AGENT_ACCESS_PORT = 47810;

export const VesAiPreferenceSchema: PreferenceSchema = {
    properties: {
        [VesAiPreferenceIds.ENABLED]: {
            type: 'boolean',
            description: nls.localize(
                'vuengine/ai/preferences/agentAccessEnabledDescription',
                'Let AI agents outside VUEngine Studio, such as Claude Code in a terminal, use its agent tools (emulator, build, …) over MCP. \
They connect to 127.0.0.1 with a token from agent-access.json in the configuration folder. \
The command "Copy Agent Access Configuration" puts both on the clipboard.'
            ),
            default: false,
            scope: PreferenceScope.User,
        },
        [VesAiPreferenceIds.PORT]: {
            type: 'number',
            description: nls.localize(
                'vuengine/ai/preferences/agentAccessPortDescription',
                'The port agents connect to, on localhost 127.0.0.1.'
            ),
            default: DEFAULT_AGENT_ACCESS_PORT,
            minimum: 1024,
            maximum: 65535,
            scope: PreferenceScope.User,
        },
    },
};
