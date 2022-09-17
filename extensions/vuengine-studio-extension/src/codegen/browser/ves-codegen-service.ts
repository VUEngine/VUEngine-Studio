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
  WithContributor
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
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (!template.itemSpecific) {
          await this.renderTemplate(templateId);
        } else {
          const itemsForType = this.vesProjectService.getProjectDataItemsForType(template.itemSpecific);
          if (itemsForType) {
            await Promise.all(Object.keys(itemsForType).map(async itemId => {
              const item = {
                ...itemsForType[itemId],
                _id: itemId,
              };
              await this.renderTemplate(templateId, item);
            }));
          }
        }
      }));
    }

    this.messageService.info(
      nls.localize('vuengine/codegen/generateAllDone', 'Done generating files.')
    );
  }

  async renderTemplateToFile(
    templateId: string,
    targetUri: URI,
    templateString: string,
    data: object,
    encoding: ProjectFileTemplateEncoding = ProjectFileTemplateEncoding.utf8
  ): Promise<void> {
    let renaderedTemplateData = '';
    try {
      renaderedTemplateData = nunjucks.renderString(templateString, data);
    } catch (error) {
      console.error(`Failed to render template ${templateId}. Nunjucks output:`, error);
      return;
    }
    if (renaderedTemplateData) {
      await this.fileService.writeFile(
        targetUri,
        BinaryBuffer.wrap(iconv.encode(renaderedTemplateData, encoding))
      );
    }

    // @ts-ignore
    console.info(data.item ? `Rendered template ${templateId} with item ${data.item._id}.`
      : `Rendered template ${templateId}.`
    );
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async renderTemplate(templateId: string, itemData?: any): Promise<void> {
    await this.vesProjectService.ready;
    const template = this.vesProjectService.getProjectDataTemplate(templateId);
    if (!template) {
      console.warn(`Template ${templateId} not found.`);
      return;
    }

    const encoding = template.encoding ? template.encoding : ProjectFileTemplateEncoding.utf8;

    const data = {
      item: itemData,
      project: this.vesProjectService.getProjectData()
    };

    await this.renderFileFromTemplate(templateId, template, data, encoding);
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
    templateId: string,
    template: ProjectFileTemplate & WithContributor,
    data: object,
    encoding: ProjectFileTemplateEncoding
  ): Promise<void> {
    let templateUri = template._contributorUri;
    const templatePathParts = template.template.split('/');
    templatePathParts.forEach(templatePathPart => {
      templateUri = templateUri.resolve(templatePathPart);
    });

    let templateString = '';
    try {
      templateString = (await this.fileService.readFile(templateUri)).value.toString();
    } catch (error) {
      console.error(`Could not read template file at ${templateUri.path}`);
      return;
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

      await this.renderTemplateToFile(templateId, targetUri, templateString, data, encoding);
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
    env.addFilter('intToBin', (value: number, length?: number) => value.toString(2).padStart(
      length ?? 8,
      '0'
    ));
    env.addFilter('binToHex', (value: string) => parseInt(value, 2).toString(16).toUpperCase());
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
