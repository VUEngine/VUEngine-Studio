import { ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import { ContributionProvider } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { VesAgentTool } from '../common/ves-agent-access-protocol';

export const VES_TOOL_PROVIDER = 'vuengine';

@injectable()
export class VesAgentTools {

  @inject(ContributionProvider) @named(ToolProvider)
  protected readonly providers!: ContributionProvider<ToolProvider>;

  tools(): ToolRequest[] {
    return this.providers.getContributions()
      .map(provider => provider.getTool())
      .filter(tool => tool.providerName === VES_TOOL_PROVIDER);
  }

  list(): VesAgentTool[] {
    return this.tools().map(tool => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: { ...tool.parameters, type: 'object' },
    }));
  }

  async call(name: string, args: string): Promise<string> {
    const tool = this.tools().find(candidate => candidate.name === name);
    if (!tool) {
      return `error: there is no tool called ${name}`;
    }
    try {
      const result = await tool.handler(args);
      return typeof result === 'string' ? result : JSON.stringify(result ?? '');
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
