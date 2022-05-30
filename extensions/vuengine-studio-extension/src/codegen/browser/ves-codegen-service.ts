import { MessageService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import * as iconv from 'iconv-lite';
import * as nunjucks from 'nunjucks';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import {
  ProjectFileItemDeleteEvent,
  ProjectFileItemSaveEvent,
  ProjectFileTemplate,
  ProjectFileTemplateEncoding,
  ProjectFileTemplateEventType,
  ProjectFileTemplateMode
} from '../../project/browser/ves-project-types';

@injectable()
export class VesCodeGenService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesBuildPathsService)
  protected vesBuildPathsService: VesBuildPathsService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesPluginsService)
  protected vesPluginsService: VesPluginsService;
  @inject(VesProjectService)
  protected vesProjectService: VesProjectService;
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  @postConstruct()
  protected async init(): Promise<void> {
    await this.preferenceService.ready;
    await this.vesPluginsService.ready;
    await this.configureTemplateEngine();
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.vesPluginsService.onDidChangeInstalledPlugins(async () =>
      this.handlePluginChange());

    this.vesProjectService.onDidSaveItem(async projectFileItemSaveEvent =>
      this.handleAddItem(projectFileItemSaveEvent));

    this.vesProjectService.onDidDeleteItem(async projectFileItemDeleteEvent =>
      this.handleDeleteItem(projectFileItemDeleteEvent));
  }

  async generateAll(): Promise<void> {
    const types = this.vesProjectService.getProjectDataTypes();
    const items = this.vesProjectService.getProjectDataItems();
    if (items && types) {
      await Promise.all(Object.values(items).map(async itemsForType =>
        Promise.all(Object.keys(itemsForType).map(async itemId => {
          const item = {
            ...itemsForType[itemId],
            _id: itemId,
          };
          // @ts-ignore
          const type = Object.values(types).find(t => t?.schema.properties?.typeId.const === item.typeId);
          if (type?.templates) {
            await Promise.all(type?.templates.map(async templateId => {
              await this.renderTemplate(templateId, item);
            }));
          }
        }))
      ));
    }

    this.messageService.info(
      nls.localize('vuengine/codegen/generateAllDone', 'Done generating files.')
    );
  }

  async renderTemplateToFile(targetUri: URI, templateString: string, data: object, encoding: ProjectFileTemplateEncoding = ProjectFileTemplateEncoding.utf8): Promise<void> {
    const renaderedTemplateData = nunjucks.renderString(templateString, data);
    // await this.fileService.delete();
    await this.fileService.writeFile(
      targetUri,
      BinaryBuffer.wrap(iconv.encode(renaderedTemplateData, encoding))
    );
  }

  async renderTemplate(templateId: string, itemData?: unknown): Promise<void> {
    await this.vesProjectService.ready;
    const template = this.vesProjectService.getProjectDataTemplate(templateId);
    if (!template) {
      console.warn(`Template with ID ${templateId} not found.`);
      return;
    }

    const encoding = template.encoding ? template.encoding : ProjectFileTemplateEncoding.utf8;

    const data = {
      item: itemData,
      project: this.vesProjectService.getProjectData()
    };

    switch (template.mode) {
      default:
      case ProjectFileTemplateMode.single:
        await this.renderFileFromTemplate(template, data, encoding);
        break;
    }
  }

  protected async handlePluginChange(): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (template.events) {
          await Promise.all(template.events.map(async event => {
            if (event.type === ProjectFileTemplateEventType.installedPluginsChanged) {
              await this.renderTemplate(templateId);
            }
          }));
        }
      }));
    }
  }

  protected async handleAddItem(projectFileItemSaveEvent: ProjectFileItemSaveEvent): Promise<void> {
    const typeData = this.vesProjectService.getProjectDataType(projectFileItemSaveEvent.typeId);
    if (typeData && typeData.templates) {
      await Promise.all(typeData.templates.map(async templateId =>
        this.renderTemplate(templateId, {
          ...projectFileItemSaveEvent.item,
          _id: projectFileItemSaveEvent.itemId
        })));
    }
  }

  protected async handleDeleteItem(projectFileItemDeleteEvent: ProjectFileItemDeleteEvent): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (template.events) {
          await Promise.all(template.events.map(async templateEvent => {
            if (templateEvent.type === ProjectFileTemplateEventType.itemOfTypeGotDeleted
              && templateEvent.value === projectFileItemDeleteEvent.typeId) {
              await this.renderTemplate(templateId);
            }
          }));
        }
      }));
    }
  }

  protected async renderFileFromTemplate(
    template: ProjectFileTemplate,
    data: object,
    encoding: ProjectFileTemplateEncoding
  ): Promise<void> {
    const templateUri = template.template as URI;
    let templateString = '';
    try {
      templateString = (await this.fileService.readFile(templateUri)).value.toString();
    } catch (error) {
      console.error(`Could not read template file at ${templateUri.path.toString()}`);
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (workspaceRootUri) {
      const target = template.target
        .replace(/\$\{([\s\S]*?)\}/ig, match => {
          match = match.substring(2, match.length - 1);
          // @ts-ignore
          return this.getByKey(data.item, match);
        });

      const targetPathParts = target.split('/');
      let targetUri = workspaceRootUri;
      targetPathParts.forEach(targetPathPart => {
        targetUri = targetUri.resolve(targetPathPart);
      });

      await this.renderTemplateToFile(targetUri, templateString, data, encoding);
    }
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

  protected async configureTemplateEngine(): Promise<void> {
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const env = nunjucks.configure(await this.fileService.fsPath(engineCoreUri));

    // add filters
    env.addFilter('basename', (value: string, ending: boolean = true) => {
      let base = this.vesCommonService.basename(value);
      if (!ending) {
        base = base.replace(/\.[^/.]+$/, '');
      }
      return base;
    });
    env.addFilter('values', (value: object) => Object.values(value));
    // @ts-ignore
    env.addFilter('typeId', (arr: unknown[], typeId: string) => arr.filter(item => item.typeId === typeId));
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
    env.addFilter('formatValue', (value: string) => {
      // @ts-ignore
      if (!isNaN(value) || value === 'true' || value === 'false') {
        return value;
      }
      return `"${value}"`;
    });

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
}
