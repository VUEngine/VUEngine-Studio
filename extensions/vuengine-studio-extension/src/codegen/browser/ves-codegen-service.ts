import { Emitter, MessageService, PreferenceService, QuickInputService, QuickPickItem, QuickPickOptions, QuickPickService, nls } from '@theia/core';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatWithMetadata } from '@theia/filesystem/lib/common/files';
import { OutputChannelManager, OutputChannelSeverity } from '@theia/output/lib/browser/output-channel';
import crc32 from 'crc/crc32';
import * as iconv from 'iconv-lite';
import * as jsonLogic from 'json-logic-js';
import * as nunjucks from 'nunjucks';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { intToHex, toUpperSnakeCase } from '../../editors/browser/components/Common/Utils';
import { getTrackKeyframes } from '../../editors/browser/components/SoundEditor/Other/templating';
import { compressTiles } from '../../images/browser/ves-images-compressor';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { ImageConfigWithName } from '../../images/browser/ves-images-types';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { PROJECT_TEMPLATES, PROJECT_TYPES } from '../../project/browser/ves-project-data';
import { VesProjectService } from '../../project/browser/ves-project-service';
import {
  ProjectContributor,
  ProjectDataTemplate,
  ProjectDataTemplateEncoding,
  ProjectDataTemplateEventType,
  ProjectDataTemplateTargetForEachOfType,
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
    await Promise.all(Object.keys(PROJECT_TYPES).map(async typeId => {
      const type = PROJECT_TYPES[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        // TODO: delete corresponding generated code for deleted files
      }
    }));
  }

  protected async handleFileUpdate(fileUri: URI): Promise<void> {
    await Promise.all(Object.keys(PROJECT_TYPES).map(async typeId => {
      const type = PROJECT_TYPES[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file) && type.templates?.length) {
        await this.generate([typeId], GenerationMode.All, fileUri);
        // TODO: delete corresponding generated code for moved files and regenerate at new location
      }
    }));
  }

  protected registerOutputChannel(): void {
    this.logLine('');
  }

  async getGeneratedFileUris(itemUri: URI, typeId: string): Promise<URI[]> {
    let result: URI[] = [];
    const type = PROJECT_TYPES[typeId];
    if (!type || !type.templates) {
      return [];
    }
    const items = Object.values(this.vesProjectService.getProjectDataItemsForType(typeId) ?? {}).filter(i => i._fileUri.isEqual(itemUri));
    const item = Array.isArray(items) && items.length ? items[0] : undefined;
    if (!item) {
      return [];
    }

    await Promise.all(type.templates.map(async template => {
      const targetUris = await this.getTargetUris(template, {
        ...item,
        _filename: itemUri.path.name,
        _folder: itemUri.parent.path.name,
      }, itemUri);
      if (targetUris.length) {
        result = [
          ...result,
          ...targetUris,
        ];
      }
    }));

    return result;
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
    const items: QuickPickItem[] = [];
    Object.keys(PROJECT_TYPES).map(typeId => {
      const numberOfItems = Object.keys(this.vesProjectService.getProjectDataItemsForType(typeId, ProjectContributor.Project) || []).length;
      const type = PROJECT_TYPES[typeId];
      const iconClasses = type.icon?.split(' ') || ['codicon', 'codicon-file-code'];
      const templateTargets: string[] = [];
      type.templates?.filter(template => template?.enabled !== false)
        .map(t => {
          t?.targets?.map(target => {
            const root = target.root === 'file' ? '{file}/' : '';
            templateTargets.push(`${root}${target.path}`);
          });
        });
      if (templateTargets?.length) {
        items.push({
          id: typeId,
          label: type.schema.title,
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
        const type = PROJECT_TYPES[typeId];
        if (type && Array.isArray(type.templates)) {
          let inferredFileUri: URI;
          if (!fileUri && !type.file.startsWith('.')) {
            inferredFileUri = (this.vesProjectService.getProjectDataItemById(ProjectContributor.Project, typeId) as WithFileUri)?._fileUri;
          }

          await Promise.all(type.templates.map(async template => {
            const count = await this.renderTemplate(template, generationMode, fileUri ?? inferredFileUri);
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

  async renderTemplateToFile(
    template: ProjectDataTemplate,
    targetUri: URI,
    templateString: string,
    data: object,
    encoding: ProjectDataTemplateEncoding = ProjectDataTemplateEncoding.utf8,
    silent?: boolean
  ): Promise<void> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    return new Promise((resolve, reject) => {
      nunjucks.renderString(templateString, data, (err, res) => {
        if (err) {
          if (!silent === true) {
            this.logLine(
              `Failed to render template ${template.template}. Nunjucks output: ${err}`,
              OutputChannelSeverity.Error
            );
          }
          reject();
        } else if (res) {
          const writeFile = () => {
            this.fileService.writeFile(
              targetUri,
              BinaryBuffer.wrap(iconv.encode(res, encoding))
            ).then(() => {
              const p = workspaceRootUri.relative(targetUri) ?? targetUri.path.fsPath();
              if (!silent === true) {
                this.logLine(`Rendered template ${template.template} to ${p}.`);
              }
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

  async getTemplateString(template: ProjectDataTemplate): Promise<string> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    let templateUri = resourcesUri.resolve('templates');
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

  protected async getTargetUris(template: ProjectDataTemplate, item: any, itemUri?: URI): Promise<URI[]> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return [];
    }

    const result: URI[] = [];
    template.targets.map(async t => {
      if (t.conditions && jsonLogic.apply(t.conditions, item) !== true) {
        return;
      }

      const findTarget = async (additionalData?: object): Promise<void> => {
        const updatedItem = {
          ...item,
          ...(additionalData || {})
        };

        const target = t.path
          .replace(/\$\{([\s\S]*?)\}/ig, match => {
            match = match.substring(2, match.length - 1);
            return this.vesCommonService.getByKey(updatedItem, match);
          });

        const targetPathParts = target.split('/');
        let targetUri = t.root === 'project'
          ? workspaceRootUri
          : itemUri?.parent;
        targetPathParts.forEach(targetPathPart => {
          targetUri = targetUri?.resolve(targetPathPart);
        });

        if (targetUri !== undefined) {
          result.push(targetUri);
        }
      };

      if (t.forEachOf) {
        const forEachOfType = Object.keys(t.forEachOf)[0] as string;
        const forEachOfValue = Object.values(t.forEachOf)[0] as string;
        const items = [];
        switch (forEachOfType) {
          case ProjectDataTemplateTargetForEachOfType.var:
            items.push(...this.vesCommonService.getByKey(item, forEachOfValue));
            if (!Array.isArray(items)) {
              return console.error(`forEachOf "${forEachOfValue}" does not exist on item or is not an array`);
            }
            break;
          case ProjectDataTemplateTargetForEachOfType.fileInFolder:
            if (itemUri !== undefined) {
              const paths = await Promise.all(window.electronVesCore.findFiles(await this.fileService.fsPath(itemUri.parent), forEachOfValue));
              items.push(...paths);
            }
            break;
        }

        await Promise.all(items.map(async (x: unknown, index) => findTarget({
          _forEachOf: x,
          _forEachOfIndex: index + 1,
          _forEachOfBasename: workspaceRootUri.resolve(x as string).path.name,
        })));
      } else {
        return findTarget();
      }
    });

    return result;
  }

  protected async renderTemplate(template: ProjectDataTemplate, generationMode: GenerationMode, fileUri?: URI): Promise<number> {
    await this.vesProjectService.projectDataReady;

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
        const targetUris = await this.getTargetUris(template, data.item, data.itemUri);
        if (!targetUris) {
          return;
        }

        await Promise.all(targetUris.map(async targetUri => {
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
          await this.renderTemplateToFile(
            template,
            targetUri,
            templateString,
            data,
            encoding
          );
        }));
      })
    );

    return numberOfGeneratedFiles;
  }

  protected async handlePluginChange(): Promise<void> {
    await Promise.all(Object.keys(PROJECT_TEMPLATES).map(async templateId => {
      const template = PROJECT_TEMPLATES[templateId];
      if (template.events) {
        await Promise.all(template.events.map(async event => {
          if (event.type === ProjectDataTemplateEventType.installedPluginsChanged) {
            return this.renderTemplate(template, GenerationMode.All);
          }
        }));
      }
    }));
  }

  protected async handleDeleteItem(typeId: string): Promise<void> {
    await Promise.all(Object.keys(PROJECT_TEMPLATES).map(async templateId => {
      const template = PROJECT_TEMPLATES[templateId];
      if (template.events) {
        await Promise.all(template.events.map(async templateEvent => {
          if (templateEvent.type === ProjectDataTemplateEventType.itemOfTypeGotDeleted
            && templateEvent.value === typeId) {
            await this.renderTemplate(template, GenerationMode.All);
          }
        }));
      }
    }));
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

    env.addFilter('crc32', (value: object) => crc32(JSON.stringify(value)));

    env.addFilter('keys', (value: object) => Object.keys(value));
    env.addFilter('values', (value: object) => Object.values(value));

    env.addFilter('setProperty', (obj: { [key: string]: any }, key: string, value: unknown) => {
      obj[key] = value;
      return obj;
    });

    env.addFilter('setArrayIndex', (arr: any[], index: number, value: unknown) => {
      arr[index] = value;
      return arr;
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

    env.addFilter('intToHex', intToHex);

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

    env.addFilter('convertImage', async (imageConfigFileUri: URI, imageConfig: ImageConfigWithName, filePath: string, callback): Promise<void> => {
      const result = await this.vesImageService.convertImage(imageConfigFileUri, imageConfig, filePath);
      callback(null, result);
    }, true);

    env.addFilter('uncompressJson', async (str: unknown, callback): Promise<void> => {
      const result = await this.vesCommonService.unzipJson(str);
      callback(null, result);
    }, true);

    // add functions
    env.addGlobal('compressTiles', compressTiles);
    env.addGlobal('getTrackKeyframes', getTrackKeyframes);
  }
}
