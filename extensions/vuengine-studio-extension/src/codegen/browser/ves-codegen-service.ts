import { Emitter, MessageService, QuickInputService, QuickPickItem, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { OutputChannelManager, OutputChannelSeverity } from '@theia/output/lib/browser/output-channel';
import * as iconv from 'iconv-lite';
import * as jsonLogic from 'json-logic-js';
import * as nunjucks from 'nunjucks';
import { VesAudioConverterService } from '../../audio-converter/browser/ves-audio-converter-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
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
  WithContributor
} from '../../project/browser/ves-project-types';
import { CODEGEN_CHANNEL_NAME, IsGeneratingFilesStatus, SHOW_DONE_DURATION } from './ves-codegen-types';

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
      // ignore files changes by git, etc
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
    const types = this.vesProjectService.getProjectDataTypes() || {};
    await Promise.all(Object.keys(types).map(async typeId => {
      const type = types[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        // TODO: delete corresponding generated code for deleted files
      }
    }));
  }

  protected async handleFileUpdate(fileUri: URI): Promise<void> {
    const types = this.vesProjectService.getProjectDataTypes() || {};
    await Promise.all(Object.keys(types).map(async typeId => {
      const type = types[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        await this.deleteFilesForItem(typeId);
        await this.generate([typeId], fileUri);
        // TODO: delete corresponding generated code for moved files and regenerate at new location
      }
    }));
  }

  protected registerOutputChannel(): void {
    this.logLine('');
  }

  async promptGenerateAll(): Promise<void> {
    const selectecTypes = await this.showTypeSelection();
    if (selectecTypes !== undefined && selectecTypes.length) {
      /*
      const changedOnlySelection = await this.showChangedOnlySelection();
      if (changedOnlySelection !== undefined) {
        const changedOnly = changedOnlySelection?.id === 'changed';
        this.generate(types, changedOnly);
      }
      */
      await this.generate(selectecTypes);
    }
  }

  protected async showTypeSelection(): Promise<string[] | undefined> {
    await this.vesProjectService.projectItemsReady;
    const types = this.vesProjectService.getProjectDataTypes() || {};
    const items: QuickPickItem[] = [];
    Object.keys(types).map(typeId => {
      const numberOfItems = Object.keys(this.vesProjectService.getProjectDataItemsForType(typeId, ProjectContributor.Project) || []).length;
      const type = types[typeId];
      if (numberOfItems > 0) {
        items.push({
          id: typeId,
          label: nls.localize(`vuengine/projects/types/${typeId}`, type.schema.title || typeId),
          // iconClasses: type.icon?.split(' ') || [],
          description: (numberOfItems === 1)
            ? nls.localize('vuengine/codegen/oneFile', '1 file')
            : nls.localize('vuengine/codegen/xFiles', '{0} files', numberOfItems),
        });
      }
    });

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
    // pick.step = 1;
    // pick.totalSteps = 2;
    pick.show();

    return new Promise((resolve, reject) => {
      pick.onDidAccept(() => {
        // if (pick.selectedItems.length) {
        pick.hide();
        const t: string[] = [];
        pick.selectedItems.map(s => s.id !== undefined ? t.push(s.id) : undefined);
        resolve(t);
        // }
      });
    });
  }

  /*
  protected async showChangedOnlySelection(): Promise<QuickPickItem | undefined> {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/codegen/commands/generateFiles', 'Generate Files...'),
      description: nls.localize('vuengine/codegen/allOrChanged', 'Do you want to general all or only changed files?'),
      step: 2,
      totalSteps: 2,
      hideInput: true,
    };

    const items: QuickPickItem[] = [{
      id: 'all',
      label: nls.localize('vuengine/codegen/allFiles', 'All files'),
    }, {
      id: 'changed',
      label: nls.localize('vuengine/codegen/changedOnly', 'Only changed files'),
    }];

    return this.quickPickService.show(items, quickPickOptions);
  }
  */

  async generate(types: string[]/* , changedOnly: boolean */, fileUri?: URI): Promise<void> {
    this.isGeneratingFiles = IsGeneratingFilesStatus.active;
    let numberOfGeneratedFiles = 0;

    const convertItem = async (typeId: string, uri: URI) => {
      const fileContents = await this.fileService.readFile(uri);
      const fileContentsJson = JSON.parse(fileContents.value.toString());
      const n = await this.renderTemplatesForItem(typeId, fileContentsJson, uri);
      numberOfGeneratedFiles += n;
    };

    try {
      await Promise.all(types.map(async typeId => {
        const type = this.vesProjectService.getProjectDataType(typeId);
        if (!type) {
          return;
        }
        if (fileUri) {
          await convertItem(typeId, fileUri);
        } else {
          const items = this.vesProjectService.getProjectDataItemsForType(typeId, ProjectContributor.Project) || {};
          await Promise.all(Object.values(items).map(async item => {
            /*
            if (changedOnly && !this.hasChanges(type)) {
              return;
            }
            */
            await convertItem(typeId, item._fileUri);
          }));
        }
      }));
    } catch (error) {
      this.isGeneratingFiles = IsGeneratingFilesStatus.hide;
    }

    this.setNumberOfGeneratedFiles(numberOfGeneratedFiles);
    this.isGeneratingFiles = IsGeneratingFilesStatus.done;
  }

  /*
  protected hasChanges(type: ProjectDataType & WithContributor): boolean {
    // TODO: at this point, we'd need to know which files are affected by a conversion file, e.g. *.image, but this information is currently not available
    let hasChanges = false;
    type.templates?.map(templateId => {
      const template = this.vesProjectService.getProjectDataTemplate(templateId);
      if (!template) {
        return;
      }
      template.targets.map(target => {
        if (target.conditions && jsonLogic.apply(target.conditions, data.item) !== true) {
          return;
        }
      });
      // TODO: utilize this.fileHasChanged
      // ...
      hasChanges = false;
    });

    return hasChanges;
  }

  protected fileHasChanged(itemFileStat: FileStatWithMetadata, sourceFileStat: FileStatWithMetadata, convertedFileStat?: FileStatWithMetadata): boolean {
    // if a file (or the conv file) has been edited (mtime) or has been moved or copied to this folder (ctime)
    // after the converted file has been generated/last edited, consider it a change
    return (!convertedFileStat
      || sourceFileStat.ctime > convertedFileStat.mtime
      || sourceFileStat.mtime > convertedFileStat.mtime
      || itemFileStat.ctime > convertedFileStat.mtime
      || itemFileStat.mtime > convertedFileStat.mtime
    );
  }
  */

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
            `Failed to render template ${templateId}. Nunjucks output: ${err}`,
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
    const typeData = this.vesProjectService.getProjectDataType(typeId);
    if (typeData && Array.isArray(typeData.delete)) {
      await this.workspaceService.ready;
      const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
      await Promise.all(typeData.delete.map(async deletePath => {
        const deletePathUri = workspaceRootUri.resolve(deletePath);
        if (await this.fileService?.exists(deletePathUri)) {
          await this.fileService?.delete(deletePathUri);
        }
      }));
    };
  }

  async renderTemplatesForItem(typeId: string, itemData: any, itemUri: URI): Promise<number> {
    let numberOfGeneratedFiles = 0;
    const typeData = this.vesProjectService.getProjectDataType(typeId);
    if (typeData && Array.isArray(typeData.templates)) {
      await Promise.all(typeData.templates.map(async templateId => {
        const n = await this.renderTemplate(templateId, itemUri, itemData);
        numberOfGeneratedFiles += n;
      }));
    };

    return numberOfGeneratedFiles;
  }

  protected async renderTemplate(templateId: string, itemUri?: URI, itemData?: any): Promise<number> {
    await this.vesProjectService.projectDataReady;
    const template = this.vesProjectService.getProjectDataTemplate(templateId);
    if (!template) {
      console.warn(`Template ${templateId} not found.`);
      return 0;
    }

    const encoding = template.encoding ? template.encoding : ProjectDataTemplateEncoding.utf8;

    const uri = itemUri || new URI();
    const data = {
      item: {
        ...(itemData || {}),
        _filename: itemUri?.path.name,
        _folder: itemUri?.parent.path.name,
      },
      project: this.vesProjectService.getProjectData(),
      itemUri: itemUri
    };

    return this.renderFilesFromTemplate(templateId, template, uri, data, encoding);
  }

  protected async renderFilesFromTemplate(
    templateId: string,
    template: ProjectDataTemplate & WithContributor,
    itemUri: URI,
    data: any,
    encoding: ProjectDataTemplateEncoding
  ): Promise<number> {
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
      return 0;
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return 0;
    }

    let numberOfGeneratedFiles = 0;

    await Promise.all(template.targets.map(async t => {
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
          : itemUri.parent;
        targetPathParts.forEach(targetPathPart => {
          targetUri = targetUri.resolve(targetPathPart);
        });

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
            const paths = await Promise.all(window.electronVesCore.findFiles(await this.fileService.fsPath(itemUri.parent), forEachOfValue));
            items.push(...paths);
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
    }));

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
              return this.renderTemplate(templateId);
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
              await this.renderTemplate(templateId);
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
      const result = await this.vesCommonService.uncompressJson(str);
      // eslint-disable-next-line no-null/no-null
      callback(null, result);
    }, true);

    // add functions
    env.addGlobal('compressTiles', (tilesData: string[], compressor: ImageCompressionType, animationConfig: AnimationConfig): TilesCompressionResult =>
      compressTiles(tilesData, compressor, animationConfig)
    );
  }

  protected toUpperSnakeCase(key: string): string {
    const splitCaps = (input: string) => input
      ? input
        .replace(/([a-z])([A-Z]+)/g, (m, s1, s2) => s1 + ' ' + s2)
        .replace(/([A-Z])([A-Z]+)([^a-zA-Z0-9]*)$/, (m, s1, s2, s3) => s1 + s2.toLowerCase() + s3)
        .replace(/([A-Z]+)([A-Z][a-z])/g, (m, s1, s2) => s1.toLowerCase() + ' ' + s2)
      : '';

    return splitCaps(key)
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_')
      .toUpperCase()
      .replace('VU_ENGINE', 'VUENGINE'); // meh...
  }
}
