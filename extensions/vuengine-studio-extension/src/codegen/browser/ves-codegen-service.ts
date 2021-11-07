import * as glob from 'glob';
import * as iconv from 'iconv-lite';
import * as nunjucks from 'nunjucks';
import { basename, dirname, join as joinPath, parse as parsePath } from 'path';
import { isWindows } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileChangeType } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { VES_PREFERENCE_DIR } from '../../branding/browser/ves-branding-preference-configurations';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { Template, TemplateEncoding, TemplateDataSource, TemplateRoot, TemplateEventType, TemplateDataType } from './ves-codegen-types';

export const VES_PREFERENCE_TEMPLATES_DIR = 'templates';

@injectable()
export class VesCodegenService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected vesBuildService: VesBuildService;
  @inject(VesPluginsService)
  protected vesPluginsService: VesPluginsService;

  protected templates: Template[] = [];

  @postConstruct()
  protected async init(): Promise<void> {
    this.preferenceService.ready.then(async () => {
      this.vesPluginsService.ready.then(async () => {
        await this.configureTemplateEngine();
        this.templates = await this.getTemplateDefinitions();

        // TODO: disable file change listener while a template file is being written
        this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => this.handleFileChange(fileChangesEvent));

        this.vesPluginsService.onPluginInstalled(async pluginId => this.handlePluginChange(pluginId));
        this.vesPluginsService.onPluginUninstalled(async pluginId => this.handlePluginChange(pluginId));
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async writeTemplate(targetUri: URI, templateUri: URI, data: any, encoding: TemplateEncoding = TemplateEncoding.utf8): Promise<void> {
    const templateData = (await this.fileService.readFile(templateUri)).value.toString();
    const renaderedTemplateData = nunjucks.renderString(templateData, data);
    await this.fileService.writeFile(targetUri, BinaryBuffer.wrap(iconv.encode(renaderedTemplateData, encoding)));
  }

  protected async handleFileChange(fileChangesEvent: FileChangesEvent): Promise<void> {
    const workspaceRoot = this.getWorkspaceRoot();

    fileChangesEvent.changes.map(fileChange => {
      this.templates.map(template => {
        if ([FileChangeType.ADDED, FileChangeType.UPDATED].includes(fileChange.type) &&
          (template.event.type === TemplateEventType.fileChanged &&
            fileChange.resource.isEqual(new URI(joinPath(workspaceRoot, ...template.event.value.split('/'))))) ||
          (template.event.type === TemplateEventType.fileWithEndingChanged &&
            fileChange.resource.toString().endsWith(template.event.value))
        ) {
          try {
            this.fileService.readFile(fileChange.resource).then(async content => {
              const dataKey = 'v';
              let contentJson = {
                [dataKey]: JSON.parse(content.value.toString())
              };
              if (template.data) {
                contentJson = {
                  ...contentJson,
                  ...await this.getAdditionalTemplateData(fileChange.resource, template.data)
                };
              }
              await Promise.all(template.targets.map(async target => {
                const targetFile = target.value.replace(/\$\{\w+\}/ig, match => {
                  match = match.substr(2, match.length - 3);
                  if (match === 'sourceBasename') {
                    return parsePath(fileChange.resource.toString()).name;
                  } else {
                    return contentJson[dataKey][match];
                  }
                });
                const roots = await this.resolveRoot(target.root, fileChange.resource.toString());
                await Promise.all(roots.map(async root => {
                  const targetValue = new URI(joinPath(root, ...targetFile.split('/')));
                  const targetTemplate = new URI(joinPath(template.root, VES_PREFERENCE_DIR, VES_PREFERENCE_TEMPLATES_DIR, ...target.template.split('/')));
                  const encoding = target.encoding ? target.encoding : TemplateEncoding.utf8;
                  await this.writeTemplate(targetValue, targetTemplate, contentJson, encoding);
                }));
              }));
            });
          } catch (e) {
            console.warn(e);
          }
        }
      });
    });
  }

  protected async handlePluginChange(pluginId: string): Promise<void> {
    this.templates.map(template => {
      if (template.event.type === TemplateEventType.installedPluginsChanged) {
        // TODO
      }
    });
  }

  protected async getTemplateDefinitions(): Promise<Template[]> {
    const templates: Template[] = [];
    const roots = [
      ...await this.resolveRoot(TemplateRoot.engine),
      ...await this.resolveRoot(TemplateRoot.installedPlugins),
      ...await this.resolveRoot(TemplateRoot.workspace),
    ];

    await Promise.all(roots.map(async root => {
      const templatesFileUri = new URI(joinPath(root, VES_PREFERENCE_DIR, 'templates.json'));
      if (await this.fileService.exists(templatesFileUri)) {
        const templatesFileContent = await this.fileService.readFile(templatesFileUri);
        const templatesFileJson = JSON.parse(templatesFileContent.value.toString());
        for (const template of templatesFileJson) {
          template.root = root;
          templates.push(template);
        }
      }
    }));

    return templates;
  }

  /* eslint-disable-next-line */
  protected async getAdditionalTemplateData(file: URI, dataSources: Array<TemplateDataSource>): Promise<any> {
    /* eslint-disable-next-line */
    const dataSourceJson: { [key: string]: any } = {};
    await Promise.all(dataSources.map(async dataSource => {
      const roots = await this.resolveRoot(dataSource.root, file.toString());
      if (dataSource.type === TemplateDataType.file) {
        await Promise.all(roots.map(async root => {
          const uri = new URI(joinPath(root, ...dataSource.value.split('/')));
          if (await this.fileService.exists(uri)) {
            const fileContent = await this.fileService.readFile(uri);
            dataSourceJson[dataSource.key] = JSON.parse(fileContent.value.toString());
          }
        }));
      } else if (dataSource.type === TemplateDataType.filesWithEnding) {
        if (!dataSourceJson[dataSource.key]) {
          dataSourceJson[dataSource.key] = [];
        }
        await Promise.all(roots.map(async root => {
          // TODO: refactor to use fileservice instead of glob
          const fileMatcher = joinPath(root, '**', `*${dataSource.value}`);
          await Promise.all(glob.sync(fileMatcher).map(async dataSourceFile => {
            const fileContent = await this.fileService.readFile(new URI(dataSourceFile));
            dataSourceJson[dataSource.key].push(JSON.parse(fileContent.value.toString()));
          }));
        }));
      }
    }));

    return dataSourceJson;
  }

  protected async configureTemplateEngine(): Promise<void> {
    const engineCorePath = await this.vesBuildService.getEngineCorePath();
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
    env.addFilter('unique', (values: string[]) => values.filter((value, index, self) => self.indexOf(value) === index));
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
        const enginePluginsPath = await this.vesPluginsService.getEnginePluginsPath();
        const userPluginsPath = await this.vesPluginsService.getUserPluginsPath();
        this.vesPluginsService.getInstalledPlugins().map(installedPlugin => {
          if (installedPlugin.startsWith(VUENGINE_PLUGINS_PREFIX)) {
            roots.push(joinPath(enginePluginsPath, installedPlugin.replace(VUENGINE_PLUGINS_PREFIX, '')));
          } else if (installedPlugin.startsWith(USER_PLUGINS_PREFIX)) {
            roots.push(joinPath(userPluginsPath, installedPlugin.replace(USER_PLUGINS_PREFIX, '')));
          }
        });
        break;
      case TemplateRoot.engine:
        roots.push(await this.vesBuildService.getEngineCorePath());
        break;
      case TemplateRoot.plugins:
        roots.push(await this.vesPluginsService.getEnginePluginsPath());
        roots.push(await this.vesPluginsService.getUserPluginsPath());
        break;
      case TemplateRoot.relative:
        if (filepath) {
          roots.push(dirname(filepath));
        }
        break;
      default:
      case TemplateRoot.workspace:
        roots.push(this.getWorkspaceRoot());
        break;
    }

    return roots;
  }

  protected getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }
}
