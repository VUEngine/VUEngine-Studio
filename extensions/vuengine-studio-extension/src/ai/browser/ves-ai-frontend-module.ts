import { ChatAgent } from '@theia/ai-chat/lib/common';
import { ChatViewWidget } from '@theia/ai-chat-ui/lib/browser/chat-view-widget';
import { Agent, bindToolProvider } from '@theia/ai-core/lib/common';
import { CommandContribution, PreferenceContribution } from '@theia/core';
import { codicon, FrontendApplicationContribution, RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VES_AGENT_ACCESS_PATH, VesAgentAccess } from '../common/ves-agent-access-protocol';
import { VES_SOURCE_SEARCH_PATH, VesSourceSearch } from '../common/ves-source-search-protocol';
import { VesAgentAccessClientImpl, VesAgentAccessContribution } from './ves-agent-access-contribution';
import { VesAgentTools } from './ves-agent-tools';
import { VesEngineAgentTool } from './ves-engine-agent-tool';
import { VesVuengineAgent } from './ves-vuengine-agent';
import { VesAiPreferenceSchema } from './ves-ai-preferences';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(PreferenceContribution).toConstantValue({ schema: VesAiPreferenceSchema });
    bind(VesAgentTools).toSelf().inSingletonScope();

    // searching the engine's sources, on the backend
    bind(VesSourceSearch).toDynamicValue(ctx =>
        ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider).createProxy<VesSourceSearch>(VES_SOURCE_SEARCH_PATH)
    ).inSingletonScope();

    // the engine's sources for AI agents
    bindToolProvider(VesEngineAgentTool, bind);

    // the @VUEngine agent
    bind(VesVuengineAgent).toSelf().inSingletonScope();
    bind(Agent).toService(VesVuengineAgent);
    bind(ChatAgent).toService(VesVuengineAgent);

    // tools for agents outside the IDE (agent access)
    bind(VesAgentAccessClientImpl).toSelf().inSingletonScope();
    bind(VesAgentAccess).toDynamicValue(ctx => {
        const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return connection.createProxy<VesAgentAccess>(VES_AGENT_ACCESS_PATH, ctx.container.get(VesAgentAccessClientImpl));
    }).inSingletonScope();
    bind(VesAgentAccessContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesAgentAccessContribution);
    bind(CommandContribution).toService(VesAgentAccessContribution);

    // icon of the AI chat panel
    rebind(ChatViewWidget).toSelf().onActivation((_, widget) => {
        widget.title.iconClass = codicon('robot');
        return widget;
    });
});
