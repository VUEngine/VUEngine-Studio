import { MessageService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import * as iconv from 'iconv-lite';
import * as nunjucks from 'nunjucks';
import { VesAudioConverterService } from '../../audio-converter/browser/ves-audio-converter-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { compressTiles } from '../../images/browser/ves-images-compressor';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { AnimationConfig, ImageCompressionType, ImageConfig, TilesCompressionResult } from '../../images/browser/ves-images-types';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import {
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
  @inject(VesAudioConverterService)
  protected vesAudioConverterService: VesAudioConverterService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesImagesService)
  protected vesImageService: VesImagesService;
  @inject(VesPluginsService)
  protected vesPluginsService: VesPluginsService;
  @inject(VesProcessService)
  protected vesProcessService: VesProcessService;
  @inject(VesProjectService)
  protected vesProjectService: VesProjectService;
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();
  }

  protected async doInit(): Promise<void> {
    await this.preferenceService.ready;
    await this.vesPluginsService.ready;
    await this.configureTemplateEngine();
  }

  protected bindEvents(): void {
    this.vesPluginsService.onDidChangeInstalledPlugins(async () =>
      this.handlePluginChange());
  }

  async generateAll(): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (!template.itemSpecific) {
          return this.renderTemplate(templateId);
        } else {
          const type = this.vesProjectService.getProjectDataType(template.itemSpecific);
          if (type) {
            const typeFiles = window.electronVesCore.findFiles(await this.fileService.fsPath(workspaceRootUri), `**/*${type.file}`, {
              dot: false,
              ignore: ['build/**'],
              nodir: true
            });
            for (const typeFile of typeFiles) {
              const typeFileUri = workspaceRootUri.resolve(typeFile);
              const fileContents = await this.fileService.readFile(typeFileUri);
              return this.renderTemplate(templateId, typeFileUri, JSON.parse(fileContents.value.toString()));
            }
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
    return new Promise((resolve, reject) => {
      nunjucks.renderString(templateString, data, (err, res) => {
        if (err) {
          console.error(`Failed to render template ${templateId}. Nunjucks output:`, err);
          reject();
        } else if (res) {
          this.fileService.writeFile(
            targetUri,
            BinaryBuffer.wrap(iconv.encode(res, encoding))
          ).then(() => {
            // @ts-ignore
            console.info(data.item?._id ? `Rendered template ${templateId} with item ${data.item._id}.`
              : `Rendered template ${templateId}.`
            );

            resolve();
          });
        }
      });
    });
  }

  async renderTemplate(templateId: string, itemUri?: URI, itemData?: any): Promise<void> {
    await this.vesProjectService.projectDataReady;
    const template = this.vesProjectService.getProjectDataTemplate(templateId);
    if (!template) {
      console.warn(`Template ${templateId} not found.`);
      return;
    }

    const encoding = template.encoding ? template.encoding : ProjectFileTemplateEncoding.utf8;

    const uri = itemUri || new URI();
    const data = {
      item: {
        ...(itemData || {}),
        _filename: itemUri?.path.name,
      },
      project: this.vesProjectService.getProjectData(),
      itemUri: itemUri
    };

    return this.renderFileFromTemplate(templateId, template, uri, data, encoding);
  }

  protected async handlePluginChange(): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (template.events) {
          await Promise.all(template.events.map(async event => {
            if (event.type === ProjectFileTemplateEventType.installedPluginsChanged) {
              return this.renderTemplate(templateId);
            }
          }));
        }
      }));
    }
  }

  async renderTemplatesForItem(typeId: string, itemData: any, itemUri: URI): Promise<number> {
    let numberOfGeneratedFiles = 0;
    const typeData = this.vesProjectService.getProjectDataType(typeId);
    if (typeData && Array.isArray(typeData.templates)) {
      await Promise.all(typeData.templates.map(async templateId => {
        numberOfGeneratedFiles++;
        return this.renderTemplate(templateId, itemUri, itemData);
      }));
    };

    return numberOfGeneratedFiles;
  }

  protected async handleDeleteItem(typeId: string): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (template.events) {
          await Promise.all(template.events.map(async templateEvent => {
            if (templateEvent.type === ProjectFileTemplateEventType.itemOfTypeGotDeleted
              && templateEvent.value === typeId) {
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
    itemUri: URI,
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
      let targetUri = template.targetRoot === 'project'
        ? workspaceRootUri
        : itemUri.parent;
      targetPathParts.forEach(targetPathPart => {
        targetUri = targetUri.resolve(targetPathPart);
      });

      return this.renderTemplateToFile(templateId, targetUri, templateString, data, encoding);
    }
  }

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
    // configure base path for includes of template partials
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const env = nunjucks.configure(await this.fileService.fsPath(resourcesUri));

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

    env.addFilter('sanitizeSpecName', (value: string) => this.vesCommonService.cleanSpecName(value));

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

    env.addFilter('intToHex', (value: number, length?: number) => {
      // catch null
      if (!value) {
        value = 0;
      }
      return value.toString(16).toUpperCase().padStart(
        length === 8 ? 10 : length === 2 ? 4 : 6,
        length === 8 ? '0x00000000' : length === 2 ? '0x00' : '0x0000'
      );
    });

    env.addFilter('intToBin', (value: number, length?: number) => {
      // catch null
      if (!value) {
        value = 0;
      }
      return value.toString(2).padStart(length ?? 8, '0');
    });

    env.addFilter('binToHex', (value: string) => parseInt(value, 2).toString(16).toUpperCase());

    env.addFilter('padStart', (value: string, length: number, char: string) => value.padStart(length, char));
    env.addFilter('padEnd', (value: string, length: number, char: string) => value.padEnd(length, char));

    env.addFilter('formatValue', (value: string) => {
      // @ts-ignore
      if (!isNaN(value) || value === 'true' || value === 'false') {
        return value;
      }
      return `"${value}"`;
    });

    env.addFilter('setAttribute', (obj, key, value) => {
      obj[key] = value;
      return obj;
    });

    // nunjucks does not support _async_ functions, but only filters (in the ugly as hell way as below)
    env.addFilter('convertPcm', async (...args): Promise<void> => {
      const callback = args.pop();
      const filePath: string = args[0];
      const range: number = args[1];
      const result = await this.vesAudioConverterService.convertPcm(filePath, range);
      // eslint-disable-next-line no-null/no-null
      callback(null, result);
    }, true);
    env.addFilter('convertImage', async (...args): Promise<void> => {
      const callback = args.pop();
      const imageConfigFileUri: URI = args[0];
      const imageConfig: ImageConfig = args[1];
      const result = await this.vesImageService.convertImage(imageConfigFileUri, imageConfig);
      // eslint-disable-next-line no-null/no-null
      callback(null, result);
    }, true);

    // add functions
    env.addGlobal('compressTiles', (tilesData: string[], compressor: ImageCompressionType, animationConfig: AnimationConfig): TilesCompressionResult =>
      compressTiles(tilesData, compressor, animationConfig)
    );
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
