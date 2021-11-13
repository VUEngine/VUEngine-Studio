import * as glob from 'glob';
import * as iconv from 'iconv-lite';
import * as nunjucks from 'nunjucks';
import { deepmerge } from 'deepmerge-ts';
import { basename, dirname, join as joinPath, parse as parsePath } from 'path';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { VES_PREFERENCE_DIR } from '../../branding/browser/ves-branding-preference-configurations';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { TemplateEncoding, TemplateDataSource, TemplateRoot, TemplateEventType, TemplateDataType, Templates, Template, TemplateMode } from './ves-codegen-types';

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
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesPluginsService)
  protected vesPluginsService: VesPluginsService;
  @inject(VesPluginsPathsService)
  protected vesPluginsPathsService: VesPluginsPathsService;

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

        // TODO: disable file change listener while template files are being written
        this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => this.handleFileChange(fileChangesEvent));
        this.vesPluginsService.onInstalledPluginsChanged(async () => this.handlePluginChange());
      });
    });
  }

  async generateAll(): Promise<void> {
    await Promise.all(Object.keys(this.templates.templates).map(async templateId => {
      await this.renderTemplate(templateId);
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async writeTemplate(targetUri: URI, templateUri: URI, data: any, encoding: TemplateEncoding = TemplateEncoding.utf8): Promise<void> {
    const templateData = (await this.fileService.readFile(templateUri)).value.toString();
    const renaderedTemplateData = nunjucks.renderString(templateData, data);
    await this.fileService.writeFile(targetUri, BinaryBuffer.wrap(iconv.encode(renaderedTemplateData, encoding)));
  }

  protected async handleFileChange(fileChangesEvent: FileChangesEvent): Promise<void> {
    const workspaceRoot = this.vesCommonService.getWorkspaceRoot();

    fileChangesEvent.changes.map(async fileChange => {
      if ([FileChangeType.ADDED, FileChangeType.UPDATED].includes(fileChange.type)) {
        Object.keys(this.templates.events.fileChanged).map(async file => {
          const templateFileUri = new URI(joinPath(workspaceRoot, ...file.split('/')));
          if (fileChange.resource.isEqual(templateFileUri)) {
            await Promise.all(this.templates.events.fileChanged[file].map(async templateId => {
              await this.renderTemplate(templateId, fileChange.resource);
            }));
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

    switch (template.mode) {
      case TemplateMode.single:
        await this.renderFileFromTemplate(template, resource);
        break;
      case TemplateMode.withEnding:
        if (!template.ending) {
          return;
        }
        // TODO: refactor to use fileservice instead of glob
        const workspaceRoot = this.vesCommonService.getWorkspaceRoot();
        const fileMatcher = joinPath(workspaceRoot, '**', `*${template.ending}`);
        await Promise.all(glob.sync(fileMatcher).map(async file => {
          // TODO: cache all data except of type changedFile
          // TODO: cache template file content
          await this.renderFileFromTemplate(template, new URI(file));
        }));
        break;
    }
  }

  protected async renderFileFromTemplate(template: Template, resource?: URI): Promise<void> {
    const data = await this.getTemplateData(template.data ?? [], resource);

    const targetFile = template.target.replace(/\$\{([\s\S]*?)\}/ig, match => {
      match = match.substr(2, match.length - 3);
      if (match === 'sourceBasename') {
        return resource ? parsePath(resource.toString()).name : '';
      } else {
        return this.getByKey(data, match);
      }
    });

    const roots = await this.resolveRoot(template.root, resource?.toString());

    await Promise.all(roots.map(async root => {
      const targetUri = new URI(joinPath(root, ...targetFile.split('/')));
      const templateUri = new URI(template.template);
      const encoding = template.encoding ? template.encoding : TemplateEncoding.utf8;
      await this.writeTemplate(targetUri, templateUri, data, encoding);
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
      const templatesFileUri = new URI(joinPath(root, VES_PREFERENCE_DIR, 'templates.json'));
      if (await this.fileService.exists(templatesFileUri)) {
        const templatesFileContent = await this.fileService.readFile(templatesFileUri);
        const templatesFileJson = JSON.parse(templatesFileContent.value.toString()) as Templates;
        Object.values(templatesFileJson.templates).map(template => {
          template.template = joinPath(root, VES_PREFERENCE_DIR, VES_PREFERENCE_TEMPLATES_DIR, ...template.template.split('/'));
        });

        this.templates = deepmerge(this.templates, templatesFileJson);
      }
    }));

    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async getTemplateData(dataSources: Array<TemplateDataSource>, file?: URI): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [key: string]: any } = {};
    await Promise.all(dataSources.map(async dataSource => {
      const roots = await this.resolveRoot(dataSource.root, file?.toString());
      if (dataSource.type === TemplateDataType.changedFile) {
        if (file && await this.fileService.exists(file)) {
          const fileContent = await this.fileService.readFile(file);
          data[dataSource.key] = JSON.parse(fileContent.value.toString());
        }
      } else if (dataSource.type === TemplateDataType.file) {
        await Promise.all(roots.map(async root => {
          const uri = new URI(joinPath(root, ...dataSource.value.split('/')));
          if (await this.fileService.exists(uri)) {
            const fileContent = await this.fileService.readFile(uri);
            data[dataSource.key] = JSON.parse(fileContent.value.toString());
          }
        }));
      } else if (dataSource.type === TemplateDataType.filesWithEnding) {
        if (!data[dataSource.key]) {
          data[dataSource.key] = [];
        }
        await Promise.all(roots.map(async root => {
          // TODO: refactor to use fileservice instead of glob
          const fileMatcher = joinPath(root, '**', `*${dataSource.value}`);
          await Promise.all(glob.sync(fileMatcher).map(async dataSourceFile => {
            const fileContent = await this.fileService.readFile(new URI(dataSourceFile));
            data[dataSource.key].push(JSON.parse(fileContent.value.toString()));
          }));
        }));
      }
    }));

    return data;
  }

  protected async configureTemplateEngine(): Promise<void> {
    const engineCorePath = await this.vesBuildPathsService.getEngineCorePath();
    const env = nunjucks.configure(joinPath(engineCorePath, VES_PREFERENCE_DIR, VES_PREFERENCE_TEMPLATES_DIR));

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
      const exists = await this.fileService.exists(new URI(value));
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

  protected async resolveRoot(root: TemplateRoot, filepath?: string): Promise<Array<string>> {
    const roots: Array<string> = [];

    switch (root) {
      case TemplateRoot.installedPlugins:
        const enginePluginsPath = await this.vesPluginsPathsService.getEnginePluginsPath();
        const userPluginsPath = await this.vesPluginsPathsService.getUserPluginsPath();
        this.vesPluginsService.getInstalledPlugins().map(installedPlugin => {
          if (installedPlugin.startsWith(VUENGINE_PLUGINS_PREFIX)) {
            roots.push(joinPath(enginePluginsPath, installedPlugin.replace(VUENGINE_PLUGINS_PREFIX, '')));
          } else if (installedPlugin.startsWith(USER_PLUGINS_PREFIX)) {
            roots.push(joinPath(userPluginsPath, installedPlugin.replace(USER_PLUGINS_PREFIX, '')));
          }
        });
        break;
      case TemplateRoot.engine:
        roots.push(await this.vesBuildPathsService.getEngineCorePath());
        break;
      case TemplateRoot.plugins:
        roots.push(await this.vesPluginsPathsService.getEnginePluginsPath());
        roots.push(await this.vesPluginsPathsService.getUserPluginsPath());
        break;
      case TemplateRoot.relative:
        if (filepath) {
          roots.push(dirname(filepath));
        }
        break;
      default:
      case TemplateRoot.workspace:
        roots.push(this.vesCommonService.getWorkspaceRoot());
        break;
    }

    return roots;
  }
}
