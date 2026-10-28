import { ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { VesSourceRoot, VesSourceSearch } from '../common/ves-source-search-protocol';
import { VES_TOOL_PROVIDER } from './ves-agent-tools';

type Action = 'paths' | 'list' | 'read' | 'search';

interface EngineToolArguments {
  action?: Action;
  path?: string;
  pattern?: string;
  ignoreCase?: boolean;
  from?: number;
  to?: number;
}

type Roots = Record<'core' | 'platforms' | 'plugins' | 'user', URI>;

const READ_LINES = 400;
const MAX_READ_LINES = 1500;
const MAX_MATCHES = 100;

@injectable()
export class VesEngineAgentTool implements ToolProvider {

  static readonly NAME = 'engine';

  static readonly DESCRIPTION = 'Read and search the VUEngine source the project is built with: the engine core, \
platforms, engine plugins and user plugins — read only, outside the workspace. \
Paths start with core/, platforms/, plugins/ or user/. Actions: \
"paths" shows the folders and the plugins this project uses, with their paths; \
"list" lists a folder (path); \
"read" gives a file\'s lines, numbered (path, optional from and to); \
"search" finds a regular expression (pattern) in the core, platforms and the project\'s plugins, or under path. \
Look up a class\'s header before using it: VUEngine is C with classes (Virtual C), and its API is in the .h files.';

  @inject(VesBuildPathsService)
  protected readonly buildPathsService!: VesBuildPathsService;
  @inject(VesPluginsPathsService)
  protected readonly pluginsPathsService!: VesPluginsPathsService;
  @inject(VesPluginsService)
  protected readonly pluginsService!: VesPluginsService;
  @inject(FileService)
  protected readonly fileService!: FileService;
  @inject(VesSourceSearch)
  protected readonly sourceSearch!: VesSourceSearch;

  getTool(): ToolRequest {
    return {
      id: VesEngineAgentTool.NAME,
      name: VesEngineAgentTool.NAME,
      providerName: VES_TOOL_PROVIDER,
      description: VesEngineAgentTool.DESCRIPTION,
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['paths', 'list', 'read', 'search'], description: 'What to do.' },
          path: { type: 'string', description: 'A file or folder, starting with core/, platforms/, plugins/ or user/.' },
          pattern: { type: 'string', description: 'For search: a regular expression, JavaScript flavoured.' },
          ignoreCase: { type: 'boolean', description: 'For search: match regardless of case.' },
          from: { type: 'number', description: 'For read: the first line, from 1.' },
          to: { type: 'number', description: 'For read: the last line.' },
        },
        required: ['action'],
      },
      handler: argString => this.answer(argString),
      getArgumentsShortLabel: argString => {
        try {
          const args = JSON.parse(argString) as EngineToolArguments;
          return { label: [args.action, args.pattern, args.path].filter(Boolean).join(' '), hasMore: false };
        } catch {
          return undefined;
        }
      },
    };
  }

  protected async answer(argString: string): Promise<string> {
    try {
      const args = JSON.parse(argString || '{}') as EngineToolArguments;
      const roots = await this.roots();
      switch (args.action) {
        case 'paths': return await this.paths(roots);
        case 'list': return await this.list(this.resolve(args.path, roots));
        case 'read': return await this.read(this.resolve(args.path, roots), args.from, args.to);
        case 'search': return await this.search(args, roots);
        default: return 'error: give an action: paths, list, read or search';
      }
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  protected async roots(): Promise<Roots> {
    return {
      core: await this.buildPathsService.getEngineCoreUri(),
      platforms: await this.buildPathsService.getEnginePlatformsUri(),
      plugins: await this.buildPathsService.getEnginePluginsUri(),
      user: await this.pluginsPathsService.getUserPluginsUri(),
    };
  }

  protected resolve(path: string | undefined, roots: Roots): URI {
    if (!path) {
      throw new Error('Give a path, starting with core/, platforms/, plugins/ or user/.');
    }
    const [first, ...rest] = path.replace(/\\/g, '/').split('/').filter(part => part !== '' && part !== '.');
    const root = roots[first as keyof Roots];
    if (!root) {
      throw new Error(`${path} does not start with core/, platforms/, plugins/ or user/.`);
    }
    const uri = (rest.length > 0 ? root.resolve(rest.join('/')) : root).normalizePath();
    if (!root.isEqualOrParent(uri)) {
      throw new Error(`${path} leads out of ${first}/.`);
    }
    return uri;
  }

  async nameOf(uri: URI): Promise<string | undefined> {
    const named = this.named(uri, await this.roots());
    return named === uri.path.fsPath() ? undefined : named;
  }

  protected named(uri: URI, roots: Roots): string {
    for (const name of ['core', 'platforms', 'plugins', 'user'] as const) {
      const relative = roots[name].relative(uri);
      if (relative !== undefined) {
        return relative.toString() ? `${name}/${relative}` : name;
      }
    }
    return uri.path.fsPath();
  }

  protected pluginPath(id: string): string | undefined {
    if (id.startsWith(VUENGINE_PLUGINS_PREFIX)) {
      return `plugins/${id.slice(VUENGINE_PLUGINS_PREFIX.length)}`;
    }
    if (id.startsWith(USER_PLUGINS_PREFIX)) {
      return `user/${id.slice(USER_PLUGINS_PREFIX.length)}`;
    }
    return undefined;
  }

  protected async paths(roots: Roots): Promise<string> {
    await this.pluginsService.ready;
    const plugins = this.pluginsService.getActualUsedPluginNames();
    return [
      `core/       ${roots.core.path.fsPath()}`,
      `platforms/  ${roots.platforms.path.fsPath()}`,
      `plugins/    ${roots.plugins.path.fsPath()}`,
      `user/       ${roots.user.path.fsPath()}`,
      '',
      plugins.length === 0 ? 'the project uses no plugins' : 'plugins the project uses, with those they need:',
      ...plugins.map(id => `  ${id}  ${this.pluginPath(id) ?? ''}`),
    ].join('\n');
  }

  protected async list(uri: URI): Promise<string> {
    const stat = await this.fileService.resolve(uri);
    if (!stat.isDirectory) {
      throw new Error(`${uri.path.base} is a file; "read" gives its lines.`);
    }
    const children = (stat.children ?? [])
      .map(child => child.isDirectory ? `${child.name}/` : child.name)
      .sort((a, b) => Number(b.endsWith('/')) - Number(a.endsWith('/')) || a.localeCompare(b));
    return children.length === 0 ? '(empty)' : children.join('\n');
  }

  protected async read(uri: URI, from = 1, to?: number): Promise<string> {
    const lines = (await this.fileService.readFile(uri)).value.toString().split(/\r?\n/);
    const first = Math.max(1, Math.floor(from));
    const last = Math.min(lines.length, Math.floor(to ?? first + READ_LINES - 1), first + MAX_READ_LINES - 1);
    const width = String(last).length;
    const body = lines.slice(first - 1, last).map((line, index) => `${String(first + index).padStart(width)}  ${line}`);
    const more = last < lines.length ? `\n(lines ${first}–${last} of ${lines.length}; "from": ${last + 1} goes on)` : '';
    return `${body.join('\n')}${more}`;
  }

  protected async search(args: EngineToolArguments, roots: Roots): Promise<string> {
    if (!args.pattern) {
      throw new Error('Give a pattern to search for.');
    }
    try {
      new RegExp(args.pattern);
    } catch (error) {
      throw new Error(`The pattern is not a regular expression: ${error instanceof Error ? error.message : String(error)}`);
    }
    let where: VesSourceRoot[];
    if (args.path) {
      const uri = this.resolve(args.path, roots);
      where = [{ label: this.named(uri, roots), path: uri.path.fsPath() }];
    } else {
      await this.pluginsService.ready;
      const plugins = this.pluginsService.getActualUsedPluginNames()
        .map(id => this.pluginPath(id))
        .filter((path): path is string => path !== undefined)
        .map(path => ({ label: path, path: this.resolve(path, roots).path.fsPath() }));
      where = [
        { label: 'core', path: roots.core.path.fsPath() },
        { label: 'platforms', path: roots.platforms.path.fsPath() },
        ...plugins,
      ];
    }
    const result = await this.sourceSearch.search(where, args.pattern, args.ignoreCase === true, MAX_MATCHES);
    if (result.total === 0) {
      return `no matches in ${result.files} files`;
    }
    return [
      ...result.matches.map(match => `${match.file}:${match.line}: ${match.text}`),
      result.total > result.matches.length
        ? `… ${result.total} matches in all (${result.files} files searched); narrow the pattern or the path`
        : `${result.total} match${result.total === 1 ? '' : 'es'} in ${result.files} files`,
    ].join('\n');
  }
}
