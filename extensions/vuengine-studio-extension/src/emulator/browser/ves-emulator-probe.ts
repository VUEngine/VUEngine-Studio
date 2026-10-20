import { ApplicationShell, Endpoint, WidgetManager } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { MAX_PROBE_INPUT, namedPath, splitCommandLine } from 'vueport-core/lib/probe/probe-command-line';
import { ProbeForkWorker, ProbeSession, ProbeTarget } from 'vueport-core/lib/probe/probe-session';
import { fromBase64, toBase64 } from 'vueport-core/lib/probe/vb-bytes';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorWidget } from './ves-emulator-widget';

export interface VesEmulatorProbeAnswer {
  text: string;
  code: number;
}

@injectable()
export class VesEmulatorProbe {

  @inject(ApplicationShell)
  protected readonly shell!: ApplicationShell;
  @inject(WidgetManager)
  protected readonly widgetManager!: WidgetManager;
  @inject(FileService)
  protected readonly fileService!: FileService;
  @inject(WorkspaceService)
  protected readonly workspaceService!: WorkspaceService;
  @inject(ApplicationServer)
  protected readonly applicationServer!: ApplicationServer;
  @inject(VesBuildService)
  protected readonly buildService!: VesBuildService;
  @inject(VesEmulatorService)
  protected readonly emulatorService!: VesEmulatorService;

  protected session?: ProbeSession;
  protected worker?: ProbeForkWorker;

  async run(commandLine: string | string[]): Promise<VesEmulatorProbeAnswer> {
    const args = typeof commandLine === 'string' ? splitCommandLine(commandLine) : commandLine;
    const roots = await this.roots();
    const answer = await (await this.getSession()).commandLine(args, await this.inputsOf(args, roots));
    const written = await this.writeOutputs(args, roots, answer.outputs);
    return { text: written.length > 0 && !answer.text ? written.join('\n') : answer.text, code: answer.code };
  }

  protected async getSession(): Promise<ProbeSession> {
    if (!this.session) {
      const info = await this.applicationServer.getApplicationInfo().catch(() => undefined);
      this.session = new ProbeSession(() => this.target(), {
        app: 'VUEngine Studio',
        version: info?.version ?? '',
        usage: 'emulator',
        wasmUrl: () => new Endpoint({ path: '/emulator/core.wasm' }).getRestUrl().toString(),
        forks: () => {
          this.worker ??= new ProbeForkWorker(new Worker('./probe-worker.js'));
          return this.worker;
        },
        commands: [{
          usage: 'restart',
          summary: 'start the game from the beginning, the newest build if it is the project\'s; opens the emulator when it is closed',
          run: () => this.restart(),
        }],
      });
    }
    return this.session;
  }

  protected target(): ProbeTarget | undefined {
    for (const widget of this.emulators()) {
      const target = widget.probeTarget();
      if (target) {
        return target;
      }
    }
    return undefined;
  }

  protected emulators(): VesEmulatorWidget[] {
    const current = [this.shell.activeWidget, this.shell.currentWidget].find(widget => widget instanceof VesEmulatorWidget);
    const all = this.widgetManager.getWidgets(VesEmulatorWidget.ID)
      .filter((widget): widget is VesEmulatorWidget => widget instanceof VesEmulatorWidget)
      .sort((a, b) => a.player - b.player);
    return current instanceof VesEmulatorWidget ? [current, ...all.filter(widget => widget !== current)] : all;
  }

  protected async restart(): Promise<string> {
    const open = this.emulators().find(widget => widget.isLoaded());
    if (open) {
      if (open.isLinked() || open.isLinkGuest()) {
        throw new Error('Two players are linked; unlink them first.');
      }
      await open.reload();
    } else {
      if (!await this.buildService.outputRomExists()) {
        throw new Error('There is no build yet; the build tool makes one.');
      }
      await this.emulatorService.runInBuiltInEmulator(await this.buildService.getDefaultRomUri());
    }
    for (let waited = 0; waited < 15000; waited += 100) {
      const target = this.target();
      if (target) {
        return `restarted ${target.name}`;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('The emulator did not start within 15 seconds.');
  }

  protected async roots(): Promise<URI[]> {
    await this.workspaceService.ready;
    const roots = this.workspaceService.tryGetRoots().map(root => root.resource);
    if (roots.length === 0) {
      throw new Error('Open a workspace first: files on a command line are found in it.');
    }
    return roots;
  }

  protected resolve(path: string, roots: URI[]): URI {
    const uri = /^([A-Za-z]:)?[\\/]/.test(path)
      ? URI.fromFilePath(path)
      : roots[0].resolve(path.replace(/\\/g, '/'));
    return uri.normalizePath();
  }

  protected inWorkspace(uri: URI, roots: URI[]): boolean {
    return roots.some(root => root.isEqualOrParent(uri));
  }

  protected async inputsOf(args: string[], roots: URI[]): Promise<Record<string, string>> {
    const inputs: Record<string, string> = {};
    for (const arg of args) {
      const path = namedPath(arg);
      if (!path || inputs[path] !== undefined) {
        continue;
      }
      const uri = this.resolve(path, roots);
      if (!this.inWorkspace(uri, roots)) {
        continue;
      }
      try {
        const stat = await this.fileService.resolve(uri, { resolveMetadata: true });
        if (stat.isFile && stat.size <= MAX_PROBE_INPUT) {
          inputs[path] = toBase64((await this.fileService.readFile(uri)).value.buffer);
        }
      } catch {
        // not a file but an address
      }
    }
    return inputs;
  }

  protected async writeOutputs(args: string[], roots: URI[], outputs: Record<string, string>): Promise<string[]> {
    const named = args.map(arg => this.resolve(namedPath(arg), roots));
    const written: string[] = [];
    for (const [path, content] of Object.entries(outputs)) {
      const target = this.resolve(path, roots);
      if (!named.some(uri => uri.isEqualOrParent(target))) {
        throw new Error(`The emulator sent back ${path}, which the command line did not ask for.`);
      }
      if (!this.inWorkspace(target, roots)) {
        throw new Error(`${path} is outside the workspace; name a path inside it.`);
      }
      await this.fileService.writeFile(target, BinaryBuffer.wrap(fromBase64(content)));
      written.push(`wrote ${path}`);
    }
    return written;
  }
}
