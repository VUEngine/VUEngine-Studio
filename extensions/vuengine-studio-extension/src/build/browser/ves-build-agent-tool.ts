import { ToolInvocationContext, ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import { DisposableCollection } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VES_TOOL_PROVIDER } from '../../ai/browser/ves-agent-tools';
import { describeMemoryUsage, readMemoryUsage } from './ves-build-memory';
import { VesBuildService } from './ves-build-service';
import { BuildLogLine, BuildLogLineType, BuildResult } from './ves-build-types';

@injectable()
export class VesBuildAgentTool implements ToolProvider {

  static readonly NAME = 'build';

  static readonly DESCRIPTION = 'Build the VUEngine project the way the Build button does, and wait for the result: \
whether it worked, the errors and warnings with file and line, the ROM\'s size and how full ROM, WRAM and DRAM are. \
Builds in the build mode chosen in VUEngine Studio. A build already running is waited for, then built again, \
so the newest changes are in. An open emulator loads the new ROM by itself; the emulator tool\'s "restart" \
starts it from the beginning, or opens the emulator.';

  static readonly TIMEOUT = 20 * 60 * 1000;
  static readonly MAX_PROBLEMS = 40;

  @inject(VesBuildService)
  protected readonly buildService!: VesBuildService;
  @inject(WorkspaceService)
  protected readonly workspaceService!: WorkspaceService;
  @inject(FileService)
  protected readonly fileService!: FileService;

  getTool(): ToolRequest {
    return {
      id: VesBuildAgentTool.NAME,
      name: VesBuildAgentTool.NAME,
      providerName: VES_TOOL_PROVIDER,
      description: VesBuildAgentTool.DESCRIPTION,
      parameters: {
        type: 'object',
        properties: {
          clean: {
            type: 'boolean',
            description: 'Delete what this build mode built before, the engine and plugins libraries included, \
and build everything again. Only for a build that goes wrong for no reason in the code.',
          },
        },
      },
      handler: (argString, context) => this.answer(argString, context),
    };
  }

  protected async answer(argString: string, context?: ToolInvocationContext): Promise<string> {
    try {
      let clean = false;
      try {
        clean = JSON.parse(argString || '{}').clean === true;
      } catch {
        // no arguments
      }
      return await this.build(clean, context);
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  protected async build(clean: boolean, context?: ToolInvocationContext): Promise<string> {
    await this.workspaceService.ready;
    const root = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!root) {
      throw new Error('No project is open.');
    }
    await this.untilIdle();
    if (clean) {
      await this.buildService.clean(false, this.buildService.getBuildMode());
    }

    const toDispose = new DisposableCollection();
    const outcome = new Promise<BuildResult | 'timeout'>(resolve => {
      toDispose.push(this.buildService.onDidSucceedBuild(() => resolve(BuildResult.done)));
      toDispose.push(this.buildService.onDidFailBuild(() => resolve(BuildResult.failed)));
      toDispose.push(this.buildService.onDidChangeBuildStatus(status => {
        if (!status.active && status.step === BuildResult.aborted) {
          resolve(BuildResult.aborted);
        }
      }));
      const timer = setTimeout(() => resolve('timeout'), VesBuildAgentTool.TIMEOUT);
      toDispose.push({ dispose: () => clearTimeout(timer) });
      const cancel = ToolInvocationContext.getCancellationToken(context);
      if (cancel) {
        toDispose.push(cancel.onCancellationRequested(() => this.buildService.abortBuild()));
      }
    });
    const started = Date.now();
    try {
      await this.buildService.doBuild();
      const result = await outcome;
      return await this.report(result, (Date.now() - started) / 1000, root);
    } finally {
      toDispose.dispose();
    }
  }

  protected async untilIdle(): Promise<void> {
    for (let waited = 0; this.buildService.buildStatus.active || this.buildService.isCleaning; waited += 250) {
      if (waited > VesBuildAgentTool.TIMEOUT) {
        throw new Error('The build that was already running has not ended.');
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }

  protected async report(result: BuildResult | 'timeout', seconds: number, root: URI): Promise<string> {
    const mode = this.buildService.buildStatus.buildMode;
    if (result === 'timeout') {
      return `still building after ${Math.round(seconds / 60)} minutes (${mode}); see the Build view`;
    }
    const log = this.buildService.buildStatus.log;
    const problems = log.filter(line => line.type === BuildLogLineType.Error || line.type === BuildLogLineType.Warning);
    const errors = problems.filter(line => line.type === BuildLogLineType.Error).length;
    const warnings = problems.length - errors;
    const out = [`build ${result}: ${mode} mode, ${seconds.toFixed(1)} s`];

    if (result === BuildResult.done) {
      out.push(...await this.romFacts(root));
    }
    out.push(`${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`);
    out.push(...problems.slice(0, VesBuildAgentTool.MAX_PROBLEMS).map(line => `  ${this.problemText(line, root)}`));
    if (problems.length > VesBuildAgentTool.MAX_PROBLEMS) {
      out.push(`  … and ${problems.length - VesBuildAgentTool.MAX_PROBLEMS} more, in the Build view`);
    }
    if (result === BuildResult.failed && errors === 0) {
      out.push('the end of the log:', ...log.slice(-15).map(line => `  ${line.text}`));
    }
    if (result === BuildResult.done) {
      out.push('an open emulator loads the new ROM by itself; the emulator tool\'s "restart" starts it from the beginning');
    }
    return out.join('\n');
  }

  protected async romFacts(root: URI): Promise<string[]> {
    const facts: string[] = [];
    const romUri = await this.buildService.getDefaultRomUri();
    try {
      const rom = await this.fileService.resolve(romUri, { resolveMetadata: true });
      facts.push(`rom: ${root.relative(romUri)?.toString() ?? romUri.path.fsPath()}, ${rom.size / 1024} KiB`);
      const mapUri = romUri.parent.resolve(`${romUri.path.name}.map`);
      if (await this.fileService.exists(mapUri)) {
        const usage = describeMemoryUsage(readMemoryUsage((await this.fileService.readFile(mapUri)).value.toString(), rom.size));
        if (usage) {
          facts.push(`memory: ${usage}`);
        }
      }
    } catch (error) {
      console.warn('[build tool] could not read the ROM or its map:', error);
    }
    return facts;
  }

  protected problemText(line: BuildLogLine, root: URI): string {
    const kind = line.type === BuildLogLineType.Error ? 'error  ' : 'warning';
    const rootPath = root.path.fsPath().replace(/\\/g, '/').replace(/\/?$/, '/');
    return `${kind}  ${line.text.replace(/\\/g, '/').split(rootPath).join('')}`;
  }
}
