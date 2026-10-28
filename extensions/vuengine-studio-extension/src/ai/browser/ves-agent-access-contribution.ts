import { Command, CommandContribution, CommandRegistry, MessageService, nls, PreferenceService } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesAgentAccess, VesAgentAccessClient, VesAgentTool } from '../common/ves-agent-access-protocol';
import { DEFAULT_AGENT_ACCESS_PORT, VesAiPreferenceIds } from './ves-ai-preferences';
import { VesAgentTools } from './ves-agent-tools';

export namespace VesAiCommands {
  export const COPY_AGENT_ACCESS_CONFIG: Command = Command.toLocalizedCommand(
    {
      id: 'agentAccess.copyConfig',
      label: 'Copy Agent Access Configuration',
      category: 'AI',
    },
    'vuengine/ai/commands/copyAgentAccessConfig',
    'vuengine/ai/commands/category'
  );
}

@injectable()
export class VesAgentAccessClientImpl implements VesAgentAccessClient {

  @inject(VesAgentTools)
  protected readonly tools!: VesAgentTools;

  async listTools(): Promise<VesAgentTool[]> {
    return this.tools.list();
  }

  callTool(name: string, args: string): Promise<string> {
    return this.tools.call(name, args);
  }
}

@injectable()
export class VesAgentAccessContribution implements FrontendApplicationContribution, CommandContribution {

  @inject(VesAgentAccess)
  protected readonly access!: VesAgentAccess;
  @inject(PreferenceService)
  protected readonly preferenceService!: PreferenceService;
  @inject(MessageService)
  protected readonly messageService!: MessageService;
  @inject(ClipboardService)
  protected readonly clipboardService!: ClipboardService;

  protected lastError?: string;

  async onStart(): Promise<void> {
    await this.preferenceService.ready;
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      if (preferenceName === VesAiPreferenceIds.ENABLED || preferenceName === VesAiPreferenceIds.PORT) {
        this.apply();
      }
    });
    window.addEventListener('focus', () => this.access.activate().catch(() => undefined));
    this.apply();
  }

  protected async apply(): Promise<void> {
    const enabled = this.preferenceService.get<boolean>(VesAiPreferenceIds.ENABLED, false);
    const port = this.preferenceService.get<number>(VesAiPreferenceIds.PORT, DEFAULT_AGENT_ACCESS_PORT);
    try {
      const status = await this.access.configure(enabled, port);
      if (status.error && status.error !== this.lastError) {
        this.messageService.warn(nls.localize('vuengine/ai/agentAccessFailed', 'Agent access could not start: {0}', status.error));
      }
      this.lastError = status.error;
    } catch (error) {
      console.error('[agent access] could not be configured:', error);
    }
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(VesAiCommands.COPY_AGENT_ACCESS_CONFIG, {
      execute: () => this.copyConfig(),
    });
  }

   protected async copyConfig(): Promise<void> {
    if (!this.preferenceService.get<boolean>(VesAiPreferenceIds.ENABLED, false)) {
      await this.preferenceService.updateValue(VesAiPreferenceIds.ENABLED, true);
      await this.apply();
    }
    const config = await this.access.config();
    if (!config) {
      const status = await this.access.status();
      this.messageService.error(nls.localize('vuengine/ai/agentAccessFailed', 'Agent access could not start: {0}', status.error ?? '?'));
      return;
    }
    const server = { type: 'http', url: config.url, headers: { Authorization: `Bearer ${config.token}` } };
    await this.clipboardService.writeText(JSON.stringify({ mcpServers: { 'vuengine-studio': server } }, undefined, 2));
    this.messageService.info(nls.localize(
      'vuengine/ai/agentAccessCopied',
      'Copied: an MCP configuration for VUEngine Studio\'s agent tools. Paste it into a project\'s .mcp.json, '
      + 'or give Claude Code the part inside "vuengine-studio" with: claude mcp add-json vuengine-studio \'…\''
    ));
  }
}
