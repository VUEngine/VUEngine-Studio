import { Emitter, MessageService, QuickInputService, QuickPickItem, QuickPickOptions, QuickPickService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatWithMetadata } from '@theia/filesystem/lib/common/files';
import { OutputChannelManager, OutputChannelSeverity } from '@theia/output/lib/browser/output-channel';
import * as iconv from 'iconv-lite';
import * as jsonLogic from 'json-logic-js';
import * as nunjucks from 'nunjucks';
import { VesAudioConverterService } from '../../audio-converter/browser/ves-audio-converter-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { toUpperSnakeCase } from '../../editors/browser/components/Common/Utils';
import { TYPE_LABELS } from '../../editors/browser/ves-editors-types';
import { compressTiles } from '../../images/browser/ves-images-compressor';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { AnimationConfig, ImageCompressionType, ImageConfigWithName, TilesCompressionResult } from '../../images/browser/ves-images-types';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import {
  ProjectContributor,
  ProjectDataTemplate,
  ProjectDataTemplateEncoding,
  ProjectDataTemplateEventType,
  ProjectDataTemplateTargetForEachOfType,
  WithContributor,
  WithFileUri
} from '../../project/browser/ves-project-types';
import { CODEGEN_CHANNEL_NAME, GenerationMode, IsGeneratingFilesStatus, SHOW_DONE_DURATION } from './ves-codegen-types';

@injectable()
export class VesCodeGenService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(OutputChannelManager)
  protected readonly outputChannelManager: OutputChannelManager;
  @inject(QuickInputService)
  protected quickInputService: QuickInputService;
  @inject(QuickPickService)
  protected quickPickService: QuickPickService;
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
  @inject(VesWorkspaceService)
  protected workspaceService: VesWorkspaceService;

  protected timeout: number = 0;

  protected numberOfGeneratedFiles = 0;

  protected _isGeneratingFiles: IsGeneratingFilesStatus = IsGeneratingFilesStatus.hide;
  protected readonly onDidChangeIsGeneratingFilesEmitter = new Emitter<IsGeneratingFilesStatus>();
  readonly onDidChangeIsGeneratingFiles = this.onDidChangeIsGeneratingFilesEmitter.event;
  set isGeneratingFiles(status: IsGeneratingFilesStatus) {
    this._isGeneratingFiles = status;
    this.onDidChangeIsGeneratingFilesEmitter.fire(this._isGeneratingFiles);

    window.clearTimeout(this.timeout);
    if (status === IsGeneratingFilesStatus.done) {
      this.timeout = window.setTimeout(() => {
        this.isGeneratingFiles = IsGeneratingFilesStatus.hide;
      }, SHOW_DONE_DURATION);
    }
  }
  get isGeneratingFiles(): IsGeneratingFilesStatus {
    return this._isGeneratingFiles;
  }

  setNumberOfGeneratedFiles(numberOfGeneratedFiles: number): void {
    this.numberOfGeneratedFiles = numberOfGeneratedFiles;
  }

  getNumberOfGeneratedFiles(): number {
    return this.numberOfGeneratedFiles;
  }

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();
    this.registerOutputChannel();
  }

  protected async doInit(): Promise<void> {
    await this.preferenceService.ready;
    await this.vesPluginsService.ready;
    await this.configureTemplateEngine();
  }

  protected bindEvents(): void {
    this.vesProjectService.onDidUpdateGameConfig(async () =>
      // delay to allow project data to get updated first
      setTimeout(() => this.handlePluginChange(), 500));

    this.vesProjectService.onDidAddProjectItem(fileUri => {
      this.handleFileUpdate(fileUri);
    });
    this.vesProjectService.onDidUpdateProjectItem(fileUri => {
      // ignore file changes by git, etc
      if (fileUri.scheme === 'file') {
        this.handleFileUpdate(fileUri);
      }
    });
    /*
    this.vesProjectService.onDidDeleteProjectItem(fileUri => {
      this.handleFileDelete(fileUri);
    });
    */

    // TODO: detect changes of forFiles and automatically convert?
  }

  protected async handleFileDelete(fileUri: URI): Promise<void> {
    const types = this.vesProjectService.getProjectDataTypes() ?? {};
    await Promise.all(Object.keys(types).map(async typeId => {
      const type = types[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        // TODO: delete corresponding generated code for deleted files
      }
    }));
  }

  protected async handleFileUpdate(fileUri: URI): Promise<void> {
    const types = this.vesProjectService.getProjectDataTypes() ?? {};
    await Promise.all(Object.keys(types).map(async typeId => {
      const type = types[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        await this.deleteFilesForItem(typeId);
        await this.generate([typeId], GenerationMode.All, fileUri);
        // TODO: delete corresponding generated code for moved files and regenerate at new location
      }
    }));
  }

  protected registerOutputChannel(): void {
    this.logLine('');
  }

  async promptGenerateAll(): Promise<void> {
    const selectedTypes = await this.showTypeSelection();
    if (selectedTypes?.length) {
      const changedOnlySelection = await this.showChangedOnlySelection();
      if (changedOnlySelection !== undefined) {
        const generationMode: GenerationMode = changedOnlySelection?.id as GenerationMode ?? GenerationMode.All;
        return this.generate(selectedTypes, generationMode);
      }
    }
  }

  async generateAllChanged(): Promise<void> {
    const items = await this.getTemplatableTypes();
    return this.generate(items.map(i => i.id as string), GenerationMode.ChangedOnly);
  }

  protected async getTemplatableTypes(): Promise<QuickPickItem[]> {
    await this.vesProjectService.projectDataReady;
    const types = this.vesProjectService.getProjectDataTypes() ?? {};
    const items: QuickPickItem[] = [];
    Object.keys(types).map(typeId => {
      const numberOfItems = Object.keys(this.vesProjectService.getProjectDataItemsForType(typeId, ProjectContributor.Project) || []).length;
      const type = types[typeId];
      const templates = type.templates?.map(templateId => this.vesProjectService.getProjectDataTemplate(templateId))
        .filter(template => template?.enabled !== false);
      const iconClasses = type.icon?.split(' ') || ['codicon', 'codicon-file-code'];
      const templateTargets: string[] = [];
      templates?.map(t => {
        t?.targets?.map(target => {
          const root = target.root === 'file' ? '{file}/' : '';
          templateTargets.push(`${root}${target.path}`);
        });
      });
      if (templateTargets?.length) {
        items.push({
          id: typeId,
          label: TYPE_LABELS[typeId] ?? type.schema.title,
          iconClasses,
          description: (numberOfItems === 1)
            ? `(${nls.localize('vuengine/codegen/oneTypeFile', '1 file')})`
            : `(${nls.localize('vuengine/codegen/xTypeFiles', '{0} files', numberOfItems)})`,
          detail: `→ ${templateTargets.join(', ')}`
        });
      }
    });

    return items;
  }

  protected async showTypeSelection(): Promise<string[] | undefined> {
    const items = await this.getTemplatableTypes();

    if (!items.length) {
      await this.messageService.info(nls.localize('vuengine/codegen/noFilesInThisProject', 'No templateable files could be found in this project.'));
      return;
    }

    items.sort((a, b) => a.label.localeCompare(b.label));

    const pick = this.quickInputService.createQuickPick();
    pick.items = items;
    pick.selectedItems = items;
    pick.title = nls.localize('vuengine/codegen/commands/generateFiles', 'Generate Files...');
    pick.description = nls.localize('vuengine/codegen/chooseTypesToGenerate', 'Choose all type(s) you want to generate files for.');
    pick.placeholder = nls.localize('vuengine/codegen/typeToFilter', 'Type to filter list');
    pick.canSelectMany = true;
    pick.step = 1;
    pick.totalSteps = 2;
    pick.show();

    return new Promise((resolve, reject) => {
      pick.onDidAccept(() => {
        pick.hide();
        const t: string[] = [];
        pick.selectedItems.map(s => s.id !== undefined ? t.push(s.id) : undefined);
        resolve(t);
      });
    });
  }

  protected async showChangedOnlySelection(): Promise<QuickPickItem | undefined> {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/codegen/commands/generateFiles', 'Generate Files...'),
      description: nls.localize('vuengine/codegen/allOrChanged', 'Do you want to generate all or only changed files?'),
      placeholder: nls.localize('vuengine/codegen/typeToFilter', 'Type to filter list'),
      step: 2,
      totalSteps: 2,
      hideInput: true,
    };

    const items: QuickPickItem[] = [{
      id: GenerationMode.All,
      label: nls.localize('vuengine/codegen/allFiles', 'All files'),
    }, {
      id: GenerationMode.ChangedOnly,
      label: nls.localize('vuengine/codegen/changedOnly', 'Only changed files'),
    }];

    return this.quickPickService.show(items, quickPickOptions);
  }

  async generate(types: string[], generationMode: GenerationMode, fileUri?: URI): Promise<void> {
    this.isGeneratingFiles = IsGeneratingFilesStatus.active;
    let numberOfGeneratedFiles = 0;

    try {
      await Promise.all(types.map(async typeId => {
        const type = this.vesProjectService.getProjectDataType(typeId);
        if (type && Array.isArray(type.templates)) {
          let inferredFileUri: URI;
          if (!fileUri && !type.file.startsWith('.')) {
            inferredFileUri = (this.vesProjectService.getProjectDataItemById(ProjectContributor.Project, typeId) as WithFileUri)?._fileUri;
          }

          await Promise.all(type.templates.map(async templateId => {
            const count = await this.renderTemplate(templateId, generationMode, fileUri ?? inferredFileUri);
            numberOfGeneratedFiles += count;
          }));
        };
      }));
    } catch (error) {
      this.isGeneratingFiles = IsGeneratingFilesStatus.hide;
    }

    this.setNumberOfGeneratedFiles(numberOfGeneratedFiles);
    this.isGeneratingFiles = IsGeneratingFilesStatus.done;
  }

  protected fileHasChanged(itemFileStat: FileStatWithMetadata, targetFileStat?: FileStatWithMetadata): boolean {
    // if a file has been edited (mtime) or has been moved or copied to this folder (ctime)
    // after the converted file has been generated/last edited, consider it a change
    // TODO: take into account files affected by a conversion file, e.g. *.image
    return (!targetFileStat
      || itemFileStat.ctime > targetFileStat.mtime
      || itemFileStat.mtime > targetFileStat.mtime
    );
  }

  protected async renderTemplateToFile(
    templateId: string,
    targetUri: URI,
    templateString: string,
    data: object,
    encoding: ProjectDataTemplateEncoding = ProjectDataTemplateEncoding.utf8
  ): Promise<void> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    return new Promise((resolve, reject) => {
      nunjucks.renderString(templateString, data, (err, res) => {
        if (err) {
          this.logLine(
            `Failed to render template ${templateId}.Nunjucks output: ${err}`,
            OutputChannelSeverity.Error
          );
          reject();
        } else if (res) {
          const writeFile = () => {
            this.fileService.writeFile(
              targetUri,
              BinaryBuffer.wrap(iconv.encode(res, encoding))
            ).then(() => {
              const p = workspaceRootUri.relative(targetUri) ?? targetUri.path.fsPath();
              this.logLine(`Rendered template ${templateId} to ${p}.`);
              resolve();
            });
          };
          if (this.workspaceService.isCollaboration()) {
            // delete first when in collab session, otherwise it won't let us overwrite
            this.fileService.exists(targetUri).then(exists => {
              if (exists) {
                this.fileService.delete(targetUri).then(() => {
                  writeFile();
                });
              } else {
                writeFile();
              }
            });
          } else {
            writeFile();
          }
        }
      });
    });
  }

  protected logLine(message: string, severity: OutputChannelSeverity = OutputChannelSeverity.Info): void {
    const channel = this.outputChannelManager.getChannel(CODEGEN_CHANNEL_NAME);
    if (message) {
      const date = new Date();
      channel.append(`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} `);
      channel.appendLine(message, severity);
    }
  }

  async deleteFilesForItem(typeId: string): Promise<void> {
    const type = this.vesProjectService.getProjectDataType(typeId);
    if (type && Array.isArray(type.delete)) {
      await this.workspaceService.ready;
      const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
      await Promise.all(type.delete.map(async deletePath => {
        const deletePathUri = workspaceRootUri.resolve(deletePath);
        if (await this.fileService?.exists(deletePathUri)) {
          await this.fileService?.delete(deletePathUri);
        }
      }));
    };
  }

  protected async getTemplateString(template: ProjectDataTemplate & WithContributor): Promise<string> {
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
    }

    return templateString;
  }

  protected async renderTemplate(templateId: string, generationMode: GenerationMode, fileUri?: URI): Promise<number> {
    await this.vesProjectService.projectDataReady;
    const template = this.vesProjectService.getProjectDataTemplate(templateId);
    if (!template) {
      console.warn(`Template ${templateId} not found.`);
      return 0;
    }

    if (template.enabled === false) {
      return 0;
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return 0;
    }

    const templateString = await this.getTemplateString(template);
    if (!templateString) {
      return 0;
    }

    const encoding = template.encoding ? template.encoding : ProjectDataTemplateEncoding.utf8;
    const projectData = this.vesProjectService.getProjectData();

    let numberOfGeneratedFiles = 0;

    const toRender = [];
    if (template.itemSpecific) {
      const items = this.vesProjectService.getProjectDataItemsForType(template.itemSpecific, ProjectContributor.Project) || {};
      await Promise.all(
        Object.values(items).map(async i => {
          if (fileUri && !fileUri.isEqual(i._fileUri)) {
            return;
          }

          const fileContents = await this.fileService.readFile(i._fileUri);
          const fileContentsJson = JSON.parse(fileContents.value.toString());
          toRender.push({
            item: {
              ...fileContentsJson,
              _filename: i._fileUri.path.name,
              _folder: i._fileUri.parent.path.name,
            },
            project: projectData,
            itemUri: i._fileUri,
          });
        })
      );
    } else {
      toRender.push({
        item: {},
        project: projectData,
        itemUri: fileUri,
      });
    }

    await Promise.all(
      toRender.map(async data => {
        await Promise.all(
          template.targets.map(async t => {
            if (t.conditions && jsonLogic.apply(t.conditions, data.item) !== true) {
              return;
            }

            const findTargetAndRender = async (additionalData?: object): Promise<void> => {
              const updatedData = {
                ...data,
                item: {
                  ...data.item,
                  ...(additionalData || {})
                }
              };

              const target = t.path
                .replace(/\$\{([\s\S]*?)\}/ig, match => {
                  match = match.substring(2, match.length - 1);
                  return this.vesCommonService.getByKey(updatedData.item, match);
                });

              const targetPathParts = target.split('/');
              let targetUri = t.root === 'project'
                ? workspaceRootUri
                : data.itemUri?.parent;
              targetPathParts.forEach(targetPathPart => {
                targetUri = targetUri?.resolve(targetPathPart);
              });

              if (targetUri === undefined) {
                return;
              }

              if (generationMode === GenerationMode.ChangedOnly) {
                if (!data.itemUri) {
                  return;
                }

                const itemFileStat = await this.fileService.resolve(data.itemUri, { resolveMetadata: true });
                const targetFileExists = targetUri !== undefined && await this.fileService.exists(targetUri);
                const targetFileStat = targetFileExists
                  ? await this.fileService.resolve(targetUri as URI, { resolveMetadata: true })
                  : undefined;
                if (!this.fileHasChanged(itemFileStat, targetFileStat)) {
                  return;
                }
              }

              numberOfGeneratedFiles++;
              return this.renderTemplateToFile(
                templateId,
                targetUri,
                templateString,
                updatedData,
                encoding
              );
            };

            if (t.forEachOf) {
              const forEachOfType = Object.keys(t.forEachOf)[0] as string;
              const forEachOfValue = Object.values(t.forEachOf)[0] as string;
              const items = [];
              switch (forEachOfType) {
                case ProjectDataTemplateTargetForEachOfType.var:
                  items.push(...this.vesCommonService.getByKey(data.item, forEachOfValue));
                  if (!Array.isArray(items)) {
                    return console.error(`forEachOf "${forEachOfValue}" does not exist on item or is not an array`);
                  }
                  break;
                case ProjectDataTemplateTargetForEachOfType.fileInFolder:
                  if (data.itemUri !== undefined) {
                    const paths = await Promise.all(window.electronVesCore.findFiles(await this.fileService.fsPath(data.itemUri.parent), forEachOfValue));
                    items.push(...paths);
                  }
                  break;
              }

              await Promise.all(items.map(async (x: unknown, index) => findTargetAndRender({
                _forEachOf: x,
                _forEachOfIndex: index + 1,
                _forEachOfBasename: workspaceRootUri.resolve(x as string).path.name,
              })));
            } else {
              return findTargetAndRender();
            }
          })
        );
      })
    );

    return numberOfGeneratedFiles;
  }

  protected async handlePluginChange(): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (template.events) {
          await Promise.all(template.events.map(async event => {
            if (event.type === ProjectDataTemplateEventType.installedPluginsChanged) {
              return this.renderTemplate(templateId, GenerationMode.All);
            }
          }));
        }
      }));
    }
  }

  protected async handleDeleteItem(typeId: string): Promise<void> {
    const templates = this.vesProjectService.getProjectDataTemplates();
    if (templates) {
      await Promise.all(Object.keys(templates).map(async templateId => {
        const template = templates[templateId];
        if (template.events) {
          await Promise.all(template.events.map(async templateEvent => {
            if (templateEvent.type === ProjectDataTemplateEventType.itemOfTypeGotDeleted
              && templateEvent.value === typeId) {
              await this.renderTemplate(templateId, GenerationMode.All);
            }
          }));
        }
      }));
    }
  }

  protected async configureTemplateEngine(): Promise<void> {
    // configure base path for includes of template partials
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const env = nunjucks.configure(await this.fileService.fsPath(resourcesUri));

    // add filters
    env.addFilter('basename', (value: URI | string, ending: boolean = true) => {
      let base = this.vesCommonService.basename(value);
      if (!ending) {
        base = base.replace(/\.[^/.]+$/, '');
      }
      return base;
    });

    env.addFilter('crc32', (value: object) => require('crc-32').str(JSON.stringify(value)));

    env.addFilter('keys', (value: object) => Object.keys(value));
    env.addFilter('values', (value: object) => Object.values(value));

    env.addFilter('setProperty', (obj: { [key: string]: any }, key: string, value: unknown) => {
      obj[key] = value;
      return obj;
    });

    // @ts-ignore
    env.addFilter('typeId', (arr: unknown[], typeId: string) => arr.filter(item => item.typeId === typeId));

    env.addFilter('sanitizeSpecName', (value: string) => this.vesCommonService.cleanSpecName(value));

    env.addFilter('toUpperSnakeCase', (value: string) => toUpperSnakeCase(value));

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

    env.addFilter('removeEmpty', arr => arr.filter((e: unknown) => typeof e === 'string' && e.trim() !== ''));

    // nunjucks does not support _async_ functions, but only filters
    env.addFilter('convertPcm', async (configFileUri: URI, filePath: string, range: number, callback): Promise<void> => {
      const result = await this.vesAudioConverterService.convertPcm(configFileUri, filePath, range);
      // eslint-disable-next-line no-null/no-null
      callback(null, result);
    }, true);

    env.addFilter('convertImage', async (imageConfigFileUri: URI, imageConfig: ImageConfigWithName, filePath: string, callback): Promise<void> => {
      const result = await this.vesImageService.convertImage(imageConfigFileUri, imageConfig, filePath);
      // eslint-disable-next-line no-null/no-null
      callback(null, result);
    }, true);

    env.addFilter('uncompressJson', async (str: unknown, callback): Promise<void> => {
      const result = await this.vesCommonService.unzipJson(str);
      // eslint-disable-next-line no-null/no-null
      callback(null, result);
    }, true);

    // add functions
    env.addGlobal('compressTiles', (tilesData: string[], compressor: ImageCompressionType, animationConfig: AnimationConfig): TilesCompressionResult =>
      compressTiles(tilesData, compressor, animationConfig)
    );
  }
}
