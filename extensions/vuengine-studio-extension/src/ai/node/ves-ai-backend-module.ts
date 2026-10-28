import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VES_AGENT_ACCESS_PATH, VesAgentAccessClient } from '../common/ves-agent-access-protocol';
import { VES_SOURCE_SEARCH_PATH } from '../common/ves-source-search-protocol';
import { VesAgentAccessServer } from './ves-agent-access-server';
import { VesSourceSearchServer } from './ves-source-search-server';

export default new ContainerModule(bind => {
    // agent access: MCP for agents outside the IDE
    bind(VesAgentAccessServer).toSelf().inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<VesAgentAccessClient>(VES_AGENT_ACCESS_PATH, client =>
            ctx.container.get(VesAgentAccessServer).connect(client)
        )
    ).inSingletonScope();

    // searching the engine's sources, for the engine tool
    bind(VesSourceSearchServer).toSelf().inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(VES_SOURCE_SEARCH_PATH, () => ctx.container.get(VesSourceSearchServer))
    ).inSingletonScope();
});
