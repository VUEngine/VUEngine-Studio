import { ToolProvider, ToolRequest } from '@theia/ai-core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import Ajv from 'ajv';
import { VES_TOOL_PROVIDER } from '../../ai/browser/ves-agent-tools';
import { VesEngineAgentTool } from '../../ai/browser/ves-engine-agent-tool';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { GenerationMode, GenerationReport } from '../../codegen/browser/ves-codegen-types';
import { PROJECT_TYPES } from './ves-project-data';
import { VesProjectService } from './ves-project-service';
import { ProjectDataType, WithContributor, WithFileUri } from './ves-project-types';

type Action = 'types' | 'schema' | 'items' | 'create' | 'validate' | 'generate';

interface ProjectToolArguments {
  action?: Action;
  type?: string;
  name?: string;
  file?: string;
}

const ITEM_META_PROPERTIES = {
  _id: { type: 'string' },
  _version: { type: 'string' },
};

const MAX_PROBLEMS = 50;
const MAX_ITEMS = 300;

@injectable()
export class VesProjectAgentTool implements ToolProvider {

  static readonly NAME = 'project';

  static readonly DESCRIPTION = 'The VUEngine project\'s data items (actors, images, sounds, fonts, …): JSON files the \
engine\'s C code is generated from. Actions: \
"types" lists the item types, their file extensions and how many items each has; \
"schema" gives a type\'s JSON schema — read it before editing or creating items; \
"items" lists a type\'s items and their files, the engine\'s and plugins\' included; \
"create" makes a new item with the schema\'s defaults (type and name); \
"validate" checks an item file against its schema (file); \
"generate" takes an edited item file in and generates its C code now, reporting the files written and any errors \
(file; without one: every item changed since its code was generated). \
Edit item files with the file tools, then "validate" and "generate". Paths are relative to the project folder. \
Never edit generated files (they are rewritten from the items).';

  @inject(VesProjectService)
  protected readonly projectService!: VesProjectService;
  @inject(VesCodeGenService)
  protected readonly codegenService!: VesCodeGenService;
  @inject(WorkspaceService)
  protected readonly workspaceService!: WorkspaceService;
  @inject(FileService)
  protected readonly fileService!: FileService;
  @inject(VesEngineAgentTool)
  protected readonly engineTool!: VesEngineAgentTool;

  getTool(): ToolRequest {
    return {
      id: VesProjectAgentTool.NAME,
      name: VesProjectAgentTool.NAME,
      providerName: VES_TOOL_PROVIDER,
      description: VesProjectAgentTool.DESCRIPTION,
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['types', 'schema', 'items', 'create', 'validate', 'generate'],
            description: 'What to do.',
          },
          type: { type: 'string', description: 'An item type, as "types" lists it, e.g. "Actor". For schema, items and create.' },
          name: { type: 'string', description: 'The new item\'s name, for create: its folder and file are named after it.' },
          file: { type: 'string', description: 'An item file, relative to the project folder. For validate and generate.' },
        },
        required: ['action'],
      },
      handler: argString => this.answer(argString),
      getArgumentsShortLabel: argString => {
        try {
          const args = JSON.parse(argString) as ProjectToolArguments;
          return { label: [args.action, args.type, args.name, args.file].filter(Boolean).join(' '), hasMore: false };
        } catch {
          return undefined;
        }
      },
    };
  }

  protected async answer(argString: string): Promise<string> {
    try {
      const args = JSON.parse(argString || '{}') as ProjectToolArguments;
      await this.projectService.projectDataReady;
      const root = await this.root();
      switch (args.action) {
        case 'types': return this.types();
        case 'schema': return await this.schema(this.typeOf(args.type));
        case 'items': return await this.items(this.typeOf(args.type), root);
        case 'create': return await this.create(this.typeOf(args.type), args.name, root);
        case 'validate': return await this.validate(this.fileOf(args.file, root), root);
        case 'generate': return await this.generate(args.file === undefined ? undefined : this.fileOf(args.file, root), root);
        default: return 'error: give an action: types, schema, items, create, validate or generate';
      }
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  protected async root(): Promise<URI> {
    await this.workspaceService.ready;
    const root = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!root) {
      throw new Error('No project is open.');
    }
    return root;
  }

  protected typeOf(typeId: string | undefined): string {
    if (!typeId) {
      throw new Error('Name a type, as "types" lists them.');
    }
    const found = Object.keys(PROJECT_TYPES).find(id => id.toLowerCase() === typeId.toLowerCase() && PROJECT_TYPES[id].enabled !== false);
    if (!found) {
      throw new Error(`There is no item type ${typeId}; "types" lists them.`);
    }
    return found;
  }

  protected fileOf(path: string | undefined, root: URI): URI {
    if (!path) {
      throw new Error('Name an item file, relative to the project folder.');
    }
    const uri = /^([A-Za-z]:)?[\\/]/.test(path) ? URI.fromFilePath(path) : root.resolve(path.replace(/\\/g, '/'));
    return uri.normalizePath();
  }

  protected relative(uri: URI, root: URI): string {
    return root.relative(uri)?.toString() ?? uri.path.fsPath();
  }

  protected types(): string {
    const lines = Object.keys(PROJECT_TYPES)
      .filter(id => PROJECT_TYPES[id].enabled !== false)
      .sort()
      .map(id => {
        const type = PROJECT_TYPES[id];
        const items = Object.values(this.projectService.getProjectDataItemsForType(id) ?? {});
        const own = items.filter(item => (item as WithContributor)._contributor === 'project').length;
        const file = type.file.startsWith('.') ? `*${type.file}` : `${type.file} (one per project)`;
        const generates = type.templates?.length ? ', generates code' : '';
        const title = type.schema?.title && type.schema.title !== id ? ` — ${type.schema.title}` : '';
        return `${id.padEnd(17)} ${file.padEnd(34)} ${own} in the project, ${items.length - own} from engine and plugins${generates}${title}`;
      });
    return [`${'type'.padEnd(17)} ${'file'.padEnd(34)} items`, ...lines].join('\n');
  }

  /** A type's schema as an item file is checked against: dereferenced, with the properties every item has. */
  protected async fileSchema(type: ProjectDataType): Promise<object> {
    const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
    const properties = { ...(schema.properties ?? {}) };
    delete properties._id;
    delete properties._version;
    return {
      ...schema,
      type: 'object',
      properties: type.file.startsWith('.') ? { ...properties, ...ITEM_META_PROPERTIES } : { ...properties, _version: ITEM_META_PROPERTIES._version },
      additionalProperties: false,
    };
  }

  protected async schema(typeId: string): Promise<string> {
    const type = PROJECT_TYPES[typeId];
    const where = type.file.startsWith('.')
      ? `Items are files *${type.file}, made with "create" (in assets/${typeId}/<name>/<name>${type.file}). `
      + '_id is the item\'s unique id, set when it is made; never change it. _version is the VUEngine Studio version that wrote it.'
      : `The project has one file ${type.file}.`;
    return `${where}\n${JSON.stringify(await this.fileSchema(type), undefined, 1)}`;
  }

  protected async items(typeId: string, root: URI): Promise<string> {
    const items = Object.entries(this.projectService.getProjectDataItemsForType(typeId) ?? {});
    if (items.length === 0) {
      return `no ${typeId} items`;
    }
    const lines = (await Promise.all(items.map(async ([id, item]) => {
      const { _contributor, _fileUri } = item as WithContributor & WithFileUri;
      // The engine's and plugins' items by the path the engine tool reads them by.
      const where = _contributor === 'project'
        ? this.relative(_fileUri, root)
        : `${await this.engineTool.nameOf(_fileUri) ?? _fileUri.path.fsPath()}  [${_contributor}, read with the engine tool]`;
      return `${where}${id !== _contributor ? `  (_id ${id})` : ''}`;
    }))).sort();
    return [
      ...lines.slice(0, MAX_ITEMS),
      ...(lines.length > MAX_ITEMS ? [`… and ${lines.length - MAX_ITEMS} more`] : []),
    ].join('\n');
  }

  protected async create(typeId: string, name: string | undefined, root: URI): Promise<string> {
    if (!name || !/^[\w][\w .-]*$/.test(name)) {
      throw new Error('Give the new item a name: letters, digits, spaces, dots, dashes.');
    }
    const { fileUri } = await this.projectService.createItem(typeId, name);
    await this.projectService.updateItemFromFile(fileUri);
    const report = await this.codegenService.generateForFile(fileUri);
    return [`created ${this.relative(fileUri, root)} with the schema's defaults`, ...await this.describe(fileUri, typeId, report, root)].join('\n');
  }

  protected async validate(fileUri: URI, root: URI): Promise<string> {
    const typeId = Object.keys(PROJECT_TYPES).find(id => [fileUri.path.ext, fileUri.path.base].includes(PROJECT_TYPES[id].file));
    if (!typeId) {
      throw new Error(`${fileUri.path.base} is not a file of any item type.`);
    }
    const problems = await this.problemsOf(fileUri, typeId);
    return problems.length === 0
      ? `${this.relative(fileUri, root)}: a valid ${typeId}`
      : [`${this.relative(fileUri, root)}: ${problems.length} problem${problems.length === 1 ? '' : 's'} with this ${typeId}`,
      ...problems.slice(0, MAX_PROBLEMS).map(problem => `  ${problem}`)].join('\n');
  }

  protected async problemsOf(fileUri: URI, typeId: string): Promise<string[]> {
    let data: unknown;
    try {
      data = JSON.parse((await this.fileService.readFile(fileUri)).value.toString());
    } catch (error) {
      return [`not JSON: ${error instanceof Error ? error.message : String(error)}`];
    }
    const ajv = new Ajv({ allErrors: true, unknownFormats: 'ignore' });
    const validate = ajv.compile(await this.fileSchema(PROJECT_TYPES[typeId]));
    if (validate(data)) {
      return [];
    }
    return (validate.errors ?? []).map(error => {
      const where = error.dataPath || '(the item)';
      const extra = error.keyword === 'additionalProperties'
        ? ` (${(error.params as { additionalProperty: string }).additionalProperty})`
        : error.keyword === 'enum' ? ` (${(error.params as { allowedValues: unknown[] }).allowedValues.join(', ')})` : '';
      return `${where}: ${error.message}${extra}`;
    });
  }

  protected async generate(fileUri: URI | undefined, root: URI): Promise<string> {
    if (!fileUri) {
      const types = Object.keys(PROJECT_TYPES).filter(id => PROJECT_TYPES[id].templates?.length);
      const all = await this.codegenService.generate(types, GenerationMode.ChangedOnly);
      return [`generated ${all.generated} file${all.generated === 1 ? '' : 's'} for items changed since their code was made`,
        ...this.errorsOf(all)].join('\n');
    }
    const typeId = await this.projectService.updateItemFromFile(fileUri);
    const problems = await this.problemsOf(fileUri, typeId);
    const report = await this.codegenService.generateForFile(fileUri);
    return [
      ...(problems.length > 0 ? [`warning: ${problems.length} schema problem${problems.length === 1 ? '' : 's'}; "validate" lists them`] : []),
      ...await this.describe(fileUri, typeId, report, root),
    ].join('\n');
  }

  protected async describe(fileUri: URI, typeId: string, report: GenerationReport, root: URI): Promise<string[]> {
    if (!PROJECT_TYPES[typeId].templates?.length) {
      return [`${typeId} items generate no code`];
    }
    const generated: URI[] = await this.codegenService.getGeneratedFileUris(fileUri, typeId).catch(() => []);
    return [
      `generated ${report.generated} file${report.generated === 1 ? '' : 's'}${report.failed ? `, ${report.failed} failed` : ''}`,
      ...generated.map(uri => `  ${this.relative(uri, root)}`),
      ...this.errorsOf(report),
    ];
  }

  protected errorsOf(report: GenerationReport): string[] {
    return report.errors.length === 0 ? [] : ['errors:', ...report.errors.slice(0, MAX_PROBLEMS).map(error => `  ${error}`)];
  }
}
