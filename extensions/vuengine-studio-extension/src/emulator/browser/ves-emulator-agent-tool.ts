import { ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VES_TOOL_PROVIDER } from '../../ai/browser/ves-agent-tools';
import { VesEmulatorProbe } from './ves-emulator-probe';

@injectable()
export class VesEmulatorAgentTool implements ToolProvider {

  static readonly NAME = 'emulator';

  static readonly DESCRIPTION = 'Look into and drive the Virtual Boy game running in the emulator. \
Memory, CPU registers, disassembly, VIP/VSU/VB Color state, screenshots, watchpoints that tell who reads or \
writes an address, breakpoints, memory search, code coverage and patching code. \
Give one command line, e.g. "status", "capture shot.png", "regs", "dis", "vip objects", \
"peek g_stats 32", "watch --frames 300 --write g_stats.lives --capture stack", "fork one". \
Run "help" first for every command and option. \
status, pause, resume, capture, save and load act on the game being played; every other command runs on a \
copy of the moment (a fork) so the player notices nothing — "fork <name>" keeps one to continue with \
--fork <name>. Names of variables and functions come from the build\'s .elf. \
File paths are relative to the workspace folder; files written come back there. \
"restart" starts the newest build from the beginning (the build tool makes one).';

  static readonly COMMAND_DESCRIPTION = 'The command line, without a program name: e.g. "help", "regs", '
    + '"run --frames 60 --keys 0-5:STA --fork one". Quote arguments with spaces as a shell would.';

  @inject(VesEmulatorProbe)
  protected readonly probe!: VesEmulatorProbe;

  static readonly PARAMETERS = {
    type: 'object' as const,
    properties: {
      command: { type: 'string' as const, description: VesEmulatorAgentTool.COMMAND_DESCRIPTION },
    },
    required: ['command'],
  };

  getTool(): ToolRequest {
    return {
      id: VesEmulatorAgentTool.NAME,
      name: VesEmulatorAgentTool.NAME,
      providerName: VES_TOOL_PROVIDER,
      description: VesEmulatorAgentTool.DESCRIPTION,
      parameters: VesEmulatorAgentTool.PARAMETERS,
      handler: argString => this.answer(argString),
      getArgumentsShortLabel: argString => {
        const command = this.commandOf(argString);
        return command === undefined ? undefined : { label: command, hasMore: false };
      },
    };
  }

  async answer(args: unknown): Promise<string> {
    const command = this.commandOf(args);
    if (command === undefined) {
      return 'error: give a command line as "command", e.g. {"command": "help"}';
    }
    try {
      const { text, code } = await this.probe.run(command);
      return code === 0 ? text : `${text}${text.endsWith('\n') ? '' : '\n'}(exit code ${code})`;
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  protected commandOf(args: unknown): string | undefined {
    try {
      const parsed = typeof args === 'string' ? JSON.parse(args) : args;
      const command = (parsed as { command?: unknown } | undefined)?.command;
      return typeof command === 'string' ? command : undefined;
    } catch {
      return undefined;
    }
  }
}
