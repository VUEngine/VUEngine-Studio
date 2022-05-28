import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileChangeType } from '@theia/filesystem/lib/common/files';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { deepmerge } from 'deepmerge-ts';
import * as iconv from 'iconv-lite';
import * as nunjucks from 'nunjucks';
import { basename, join, parse as parsePath } from 'path';
import { VES_PREFERENCE_DIR } from '../../core/browser/ves-preference-configurations';
import { VesGlobService } from '../../glob/common/ves-glob-service-protocol';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { Template, TemplateDataSource, TemplateDataType, TemplateEncoding, TemplateEventType, TemplateMode, TemplateRoot, Templates } from './ves-codegen-types';

export const VES_PREFERENCE_TEMPLATES_DIR = 'templates';

@injectable()
export class VesCodeGenService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected vesBuildService: VesBuildService;
  @inject(VesBuildPathsService)
  protected vesBuildPathsService: VesBuildPathsService;
  @inject(VesGlobService)
  protected vesGlobService: VesGlobService;
  @inject(VesPluginsService)
  protected vesPluginsService: VesPluginsService;
  @inject(VesPluginsPathsService)
  protected vesPluginsPathsService: VesPluginsPathsService;
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  protected templates: Templates = {
    events: {
      [TemplateEventType.fileChanged]: {},
      [TemplateEventType.fileWithEndingChanged]: {},
      [TemplateEventType.installedPluginsChanged]: []
    },
    templates: {},
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.preferenceService.ready.then(async () => {
      this.vesPluginsService.ready.then(async () => {
        await this.configureTemplateEngine();
        await this.getTemplateDefinitions();

        this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => this.handleFileChange(fileChangesEvent));
        this.vesPluginsService.onDidChangeInstalledPlugins(async () => this.handlePluginChange());
      });
    });
  }

  async generateAll(): Promise<void> {
    await Promise.all(Object.keys(this.templates.templates).map(async templateId => {
      // TODO: make it possible to render all dynamic templates triggered by fileWithEndingChanged,
      // like BrightnessRepeatSpec.c
      await this.renderTemplate(templateId);
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async renderTemplateToFile(targetUri: URI, template: string, data: any, encoding: TemplateEncoding = TemplateEncoding.utf8): Promise<void> {
    const renaderedTemplateData = nunjucks.renderString(template, data);
    await this.fileService.writeFile(targetUri, BinaryBuffer.wrap(iconv.encode(renaderedTemplateData, encoding)));
  }

  protected async handleFileChange(fileChangesEvent: FileChangesEvent): Promise<void> {
    fileChangesEvent.changes.map(async fileChange => {
      if ([FileChangeType.ADDED, FileChangeType.UPDATED].includes(fileChange.type)) {
        Object.keys(this.templates.events.fileChanged).map(async file => {
          await this.workspaceService.ready;
          const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
          if (workspaceRootUri) {
            const templateFileUri = workspaceRootUri.resolve(join(...file.split('/')));
            if (fileChange.resource.isEqual(templateFileUri)) {
              await Promise.all(this.templates.events.fileChanged[file].map(async templateId => {
                await this.renderTemplate(templateId, fileChange.resource);
              }));
            }
          }
        });
        Object.keys(this.templates.events.fileWithEndingChanged).map(async fileEnding => {
          if (fileChange.resource.toString().endsWith(fileEnding)) {
            await Promise.all(this.templates.events.fileWithEndingChanged[fileEnding].map(async templateId => {
              await this.renderTemplate(templateId, fileChange.resource);
            }));
          }
        });
      }
    });
  }

  protected async handlePluginChange(): Promise<void> {
    await this.getTemplateDefinitions();

    this.templates.events.installedPluginsChanged.map(async templateId => {
      await this.renderTemplate(templateId);
    });
  }

  protected async renderTemplate(templateId: string, resource?: URI): Promise<void> {
    const template = this.templates.templates[templateId];
    if (!template) {
      console.warn(`Template with ID ${templateId} not found.`);
      return;
    }

    const encoding = template.encoding ? template.encoding : TemplateEncoding.utf8;
    const templateUri = template.template as URI;
    const templateString = (await this.fileService.readFile(templateUri)).value.toString();
    const additionalTemplateData = await this.getAdditionalTemplateData(template.data ?? [], resource);

    switch (template.mode) {
      case TemplateMode.single:
        await this.renderFileFromTemplate(template, templateString, additionalTemplateData, encoding, resource);
        break;
      case TemplateMode.withEnding:
        if (!template.ending) {
          return;
        }
        await this.workspaceService.ready;
        const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
        if (workspaceRootUri) {
          const files = await this.vesGlobService.find(await this.fileService.fsPath(workspaceRootUri), `**/*${template.ending}`);
          for (const file of files) {
            await this.renderFileFromTemplate(template, templateString, additionalTemplateData, encoding, new URI(file).withScheme('file'));
          }
        }
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async renderFileFromTemplate(template: Template, templateString: string, data: any, encoding: TemplateEncoding, resource?: URI): Promise<void> {
    if (resource && template.data) {
      const changedFileData = await this.getChangedFileTemplateData(template.data, resource);
      data = deepmerge(data, changedFileData);
    }

    const targetFile = template.target.replace(/\$\{([\s\S]*?)\}/ig, match => {
      match = match.substring(2, match.length - 1);
      if (match === 'sourceBasename') {
        return resource ? parsePath(resource.toString()).name : '';
      } else {
        return this.getByKey(data, match);
      }
    });

    const roots = await this.resolveRoot(template.root, resource);
    await Promise.all(roots.map(async root => {
      const targetUri = root.resolve(join(...targetFile.split('/')));
      await this.renderTemplateToFile(targetUri, templateString, data, encoding);
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getByKey(o: any, s: string): any {
    // convert indexes to properties
    s = s.replace(/\[(\w+)\]/g, '.$1');
    // strip leading dot
    s = s.replace(/^\./, '');
    const a = s.split('.');
    for (let i = 0, n = a.length; i < n; ++i) {
      const k = a[i];
      if (k in o) {
        o = o[k];
      } else {
        return '';
      }
    }
    return o;
  }

  protected async getTemplateDefinitions(): Promise<void> {
    this.templates = {
      events: {
        [TemplateEventType.fileChanged]: {},
        [TemplateEventType.fileWithEndingChanged]: {},
        [TemplateEventType.installedPluginsChanged]: []
      },
      templates: {},
    };

    const roots = [
      ...await this.resolveRoot(TemplateRoot.engine),
      ...await this.resolveRoot(TemplateRoot.installedPlugins),
      ...await this.resolveRoot(TemplateRoot.workspace),
    ];

    await Promise.all(roots.map(async root => {
      const templatesFileUri = root.resolve(VES_PREFERENCE_DIR).resolve('templates.json');
      if (await this.fileService.exists(templatesFileUri)) {
        const templatesFileContent = await this.fileService.readFile(templatesFileUri);
        const templatesFileJson = JSON.parse(templatesFileContent.value.toString()) as Templates;
        const templateDirUri = root
          .resolve(VES_PREFERENCE_DIR)
          .resolve(VES_PREFERENCE_TEMPLATES_DIR);
        await Promise.all(Object.values(templatesFileJson.templates).map(async template => {
          let templateUri = templateDirUri;
          for (const part of (template.template as string).split('/')) {
            templateUri = templateUri.resolve(part);
          };
          template.template = templateUri;
        }));

        this.templates = deepmerge(this.templates, templatesFileJson);
      }
    }));

    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async getChangedFileTemplateData(dataSources: Array<TemplateDataSource>, file: URI): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [key: string]: any } = {};
    await Promise.all(dataSources.map(async dataSource => {
      if (dataSource.type === TemplateDataType.changedFile) {
        if (file && await this.fileService.exists(file)) {
          const fileContent = await this.fileService.readFile(file);
          data[dataSource.key] = JSON.parse(fileContent.value.toString());
        }
      }
    }));

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async getAdditionalTemplateData(dataSources: Array<TemplateDataSource>, file?: URI): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [key: string]: any } = {};
    for (const dataSource of dataSources) {
      const roots = await this.resolveRoot(dataSource.root, file);
      if (dataSource.type === TemplateDataType.file) {
        for (const root of roots) {
          const uri = root.resolve(join(...dataSource.value.split('/')));
          if (await this.fileService.exists(uri)) {
            const fileContent = await this.fileService.readFile(uri);
            data[dataSource.key] = JSON.parse(fileContent.value.toString());
          }
        }
      } else if (dataSource.type === TemplateDataType.filesWithEnding) {
        if (!data[dataSource.key]) {
          data[dataSource.key] = [];
        }

        for (const root of roots) {
          const dataSourceFiles = await this.vesGlobService.find(await this.fileService.fsPath(root), `**/*${dataSource.value}`);
          for (const dataSourceFile of dataSourceFiles) {
            const fileContent = await this.fileService.readFile(new URI(dataSourceFile).withScheme('file'));
            data[dataSource.key].push(JSON.parse(fileContent.value.toString()));
          }
        }
      }
    }

    return data;
  }

  protected async configureTemplateEngine(): Promise<void> {
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const env = nunjucks.configure(await this.fileService.fsPath(engineCoreUri.resolve(VES_PREFERENCE_DIR).resolve(VES_PREFERENCE_TEMPLATES_DIR)));

    // add filters
    env.addFilter('basename', (value: string, ending: boolean = true) => {
      let base = basename(value);
      if (!ending) {
        base = base.replace(/\.[^/.]+$/, '');
      }
      return base;
    });
    env.addFilter('toUpperSnakeCase', (value: string) => this.toUpperSnakeCase(value));
    env.addFilter('unique', (values: Array<string>, attribute?: string) => {
      if (attribute) {
        // array of objects with unique given attribute
        // @ts-ignore
        return [...new Map(values.map(item => [item[attribute], item])).values()];
      } else {
        // array of unique values
        return values.filter((value, index, self) => self.indexOf(value) === index);
      }
    });
    env.addFilter('hexToInt', (value: string) => parseInt(value, 16));
    env.addFilter('intToHex', (value: number, length?: number) => value.toString(16).toUpperCase().padStart(
      length === 8 ? 10 : length === 2 ? 4 : 6,
      length === 8 ? '0x00000000' : length === 2 ? '0x00' : '0x0000'
    ));

    // add functions
    /* env.addGlobal('fileExists', async (value: string) => {
      const exists = await this.fileService.exists(new URI(value).withScheme('file'));
      return exists;
    }); */
  }

  protected toUpperSnakeCase(key: string): string {
    // force lowercase first char
    let convertedKey = key.charAt(0).toLowerCase() + key.slice(1);
    // replace all whitespaces
    convertedKey = convertedKey.replace(/\s/g, '');
    // convert to upper snake case
    convertedKey = convertedKey.replace(/([A-Z])/g, $1 => '_' + $1.toLowerCase()).toUpperCase();

    return convertedKey;
  }

  protected async resolveRoot(root: TemplateRoot, uri?: URI): Promise<Array<URI>> {
    const roots: Array<URI> = [];

    switch (root) {
      case TemplateRoot.installedPlugins:
        const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
        const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
        const plugins = this.vesPluginsService.getInstalledPlugins();
        if (plugins) {
          plugins.map(installedPlugin => {
            if (installedPlugin.startsWith(VUENGINE_PLUGINS_PREFIX)) {
              roots.push(enginePluginsUri.resolve(installedPlugin.replace(VUENGINE_PLUGINS_PREFIX, '')));
            } else if (installedPlugin.startsWith(USER_PLUGINS_PREFIX)) {
              roots.push(userPluginsUri.resolve(installedPlugin.replace(USER_PLUGINS_PREFIX, '')));
            }
          });
        }
        break;
      case TemplateRoot.engine:
        roots.push(await this.vesBuildPathsService.getEngineCoreUri());
        break;
      case TemplateRoot.plugins:
        roots.push(await this.vesPluginsPathsService.getEnginePluginsUri());
        roots.push(await this.vesPluginsPathsService.getUserPluginsUri());
        break;
      case TemplateRoot.relative:
        if (uri) {
          roots.push(uri.parent);
        }
        break;
      default:
      case TemplateRoot.workspace:
        await this.workspaceService.ready;
        const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
        if (workspaceRootUri) {
          roots.push(workspaceRootUri);
        }
        break;
    }

    return roots;
  }
}
