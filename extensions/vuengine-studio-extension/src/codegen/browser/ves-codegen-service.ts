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
import { convertPcm } from '../../editors/browser/components/PCMEditor/converter';
import { getTrackKeyframes } from '../../editors/browser/components/SoundEditor/Other/templating';
import { compressTiles } from 'vb-image-converter';
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
import {
  CODEGEN_CHANNEL_NAME,
  FILE_UPDATE_DEBOUNCE,
  GenerationMode,
  GenerationResult,
  IsGeneratingFilesStatus,
  RENDER_TIMEOUT,
  SHOW_DONE_DURATION
} from './ves-codegen-types';

interface RenderTarget {
  uri: URI
  // The forEachOf bindings this target was expanded from, empty for plain targets.
  bindings: object
}

@injectable()
export class VesCodeGenService {
  @inject(FileService)
  protected readonly fileService!: FileService;
  @inject(MessageService)
  protected readonly messageService!: MessageService;
  @inject(OutputChannelManager)
  protected readonly outputChannelManager!: OutputChannelManager;
  @inject(QuickInputService)
  protected readonly quickInputService!: QuickInputService;
  @inject(QuickPickService)
  protected readonly quickPickService!: QuickPickService;
  @inject(PreferenceService)
  protected readonly preferenceService!: PreferenceService;
  @inject(VesCommonService)
  protected readonly vesCommonService!: VesCommonService;
  @inject(VesImagesService)
  protected readonly vesImageService!: VesImagesService;
  @inject(VesPluginsService)
  protected readonly vesPluginsService!: VesPluginsService;
  @inject(VesProcessService)
  protected readonly vesProcessService!: VesProcessService;
  @inject(VesProjectService)
  protected readonly vesProjectService!: VesProjectService;
  @inject(VesWorkspaceService)
  protected readonly workspaceService!: VesWorkspaceService;

  protected timeout: number = 0;

  protected numberOfGeneratedFiles = 0;

  protected env: Promise<nunjucks.Environment> | undefined;

  protected readonly pendingFileUpdates = new Map<string, number>();

  protected _isGeneratingFiles: IsGeneratingFilesStatus = IsGeneratingFilesStatus.hide;
  protected readonly onDidChangeIsGeneratingFilesEmitter = new Emitter<IsGeneratingFilesStatus>();
  readonly onDidChangeIsGeneratingFiles = this.onDidChangeIsGeneratingFilesEmitter.event;
  set isGeneratingFiles(status: IsGeneratingFilesStatus) {
    this._isGeneratingFiles = status;
    this.onDidChangeIsGeneratingFilesEmitter.fire(this._isGeneratingFiles);

    window.clearTimeout(this.timeout);
    if (status === IsGeneratingFilesStatus.done || status === IsGeneratingFilesStatus.error) {
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
    // only pre-warm here, rendering does not wait on this having completed
    this.getTemplateEngine().catch(() => { });
  }

  /**
   * Configures the template engine on first use and caches it. Deliberately lazy:
   * configuring during init would run before the backend connection is up, and a
   * failure there used to leave every render waiting forever.
   */
  protected getTemplateEngine(): Promise<nunjucks.Environment> {
    if (!this.env) {
      this.env = this.configureTemplateEngine().catch(error => {
        // drop the cached failure so the next run can retry instead of hanging
        this.env = undefined;
        this.logLine(`Could not configure the template engine. ${error}`, OutputChannelSeverity.Error);
        throw error;
      });
    }

    return this.env;
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

  /**
   * Several independent events can describe a single logical change to one file, e.g. an
   * add followed by an update, or duplicate watcher events for one write. Generating is
   * expensive, so a burst is collapsed into a single run on the trailing edge, which also
   * guarantees the run sees the final state of the file.
   */
  protected handleFileUpdate(fileUri: URI): void {
    const key = fileUri.toString();
    window.clearTimeout(this.pendingFileUpdates.get(key));
    this.pendingFileUpdates.set(key, window.setTimeout(() => {
      this.pendingFileUpdates.delete(key);
      this.doHandleFileUpdate(fileUri);
    }, FILE_UPDATE_DEBOUNCE));
  }

  protected async doHandleFileUpdate(fileUri: URI): Promise<void> {
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
      let accepted = false;
      pick.onDidAccept(() => {
        accepted = true;
        pick.hide();
        const t: string[] = [];
        pick.selectedItems.map(s => s.id !== undefined ? t.push(s.id) : undefined);
        resolve(t);
      });
      // dismissing the picker must settle the promise too, otherwise it leaks forever
      pick.onDidHide(() => {
        if (!accepted) {
          resolve(undefined);
        }
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
    let numberOfFailedFiles = 0;

    this.logLine(`Generating ${generationMode} for ${types.length} type(s): ${types.join(', ') || '<none>'}.`);

    try {
      await Promise.all(types.map(async typeId => {
        const type = PROJECT_TYPES[typeId];
        if (type && Array.isArray(type.templates)) {
          let inferredFileUri: URI;
          if (!fileUri && !type.file.startsWith('.')) {
            inferredFileUri = (this.vesProjectService.getProjectDataItemById(ProjectContributor.Project, typeId) as WithFileUri)?._fileUri;
          }

          await Promise.all(type.templates.map(async template => {
            const result = await this.renderTemplate(template, generationMode, typeId, fileUri ?? inferredFileUri);
            numberOfGeneratedFiles += result.generated;
            numberOfFailedFiles += result.failed;
          }));
        };
      }));
    } catch (error) {
      this.logLine(`Code generation failed. ${error}`, OutputChannelSeverity.Error);
      numberOfFailedFiles++;
    }

    this.logLine(`Finished. Generated ${numberOfGeneratedFiles} file(s), ${numberOfFailedFiles} failure(s).`);

    this.setNumberOfGeneratedFiles(numberOfGeneratedFiles);
    this.isGeneratingFiles = numberOfFailedFiles > 0
      ? IsGeneratingFilesStatus.error
      : IsGeneratingFilesStatus.done;
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
    const env = await this.getTemplateEngine();
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    return new Promise((resolve, reject) => {
      // `stage` names how far this got, so a timeout can report where it stalled.
      // `settled` means the promise actually settled, not that a step began.
      let stage = 'render';
      let settled = false;
      const done = (action: () => void): void => {
        if (settled) {
          return;
        }
        settled = true;
        try {
          action();
        } catch (error) {
          reject(error);
        }
      };
      // deliberately never cleared, so that it still reports a step that starts but
      // never finishes, which is otherwise indistinguishable from a hang
      window.setTimeout(() => {
        if (settled) {
          return;
        }
        const message = `Timed out after ${RENDER_TIMEOUT / 1000}s at "${stage}" generating `
          + `${targetUri.path.fsPath()} from ${template.template}.`;
        if (!silent === true) {
          this.logLine(message, OutputChannelSeverity.Error);
        }
        done(() => reject(new Error(message)));
      }, RENDER_TIMEOUT);

      env.renderString(templateString, data, (err, res) => {
        stage = 'render-callback';

        if (err) {
          if (!silent === true) {
            this.logLine(
              `Failed to render template ${template.template}. Nunjucks output: ${err}`,
              OutputChannelSeverity.Error
            );
          }
          return done(() => reject(err));
        }

        if (!res) {
          // nothing to write, but the promise must still settle
          if (!silent === true) {
            this.logLine(
              `Template ${template.template} rendered empty, skipped writing ${targetUri.path.fsPath()}.`,
              OutputChannelSeverity.Warning
            );
          }
          return done(resolve);
        }

        const writeFile = async () => {
          if (this.workspaceService.isCollaboration()) {
            stage = 'collab-delete';
            // delete first when in collab session, otherwise it won't let us overwrite
            if (await this.fileService.exists(targetUri)) {
              await this.fileService.delete(targetUri);
            }
          }

          stage = 'encode';
          // iconv-lite returns a polyfilled Buffer in the frontend bundle, which the file
          // service RPC cannot forward. Copying it into a plain Uint8Array is what makes
          // the write actually reach disk - without this, writeFile never settles.
          const encoded = BinaryBuffer.wrap(Uint8Array.from(iconv.encode(res, encoding)));

          stage = 'write';
          await this.fileService.writeFile(targetUri, encoded);

          stage = 'written';
          const p = workspaceRootUri?.relative(targetUri) ?? targetUri.path.fsPath();
          if (!silent === true) {
            this.logLine(`Rendered template ${template.template} to ${p}.`);
          }
        };

        writeFile().then(() => done(resolve), writeError => {
          if (!silent === true) {
            this.logLine(
              `Failed to write ${targetUri.path.fsPath()} for template ${template.template}. ${writeError}`,
              OutputChannelSeverity.Error
            );
          }
          done(() => reject(writeError));
        });
      });
    });
  }

  protected toFilterError(filterName: string, error: unknown): Error {
    const message = error instanceof Error
      ? error.message
      : String(error);
    this.logLine(`Filter ${filterName} failed. ${message}`, OutputChannelSeverity.Error);
    return error instanceof Error ? error : new Error(message);
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
    return (await this.getTargets(template, item, itemUri)).map(target => target.uri);
  }

  protected async getTargets(template: ProjectDataTemplate, item: any, itemUri?: URI): Promise<RenderTarget[]> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return [];
    }

    const result: RenderTarget[] = [];
    await Promise.all(template.targets.map(async t => {
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
          result.push({ uri: targetUri, bindings: additionalData ?? {} });
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
    }));

    return result;
  }

  protected async renderTemplate(template: ProjectDataTemplate, generationMode: GenerationMode, typeId?: string, fileUri?: URI): Promise<GenerationResult> {
    await this.vesProjectService.projectDataReady;

    const nothingToDo: GenerationResult = { generated: 0, failed: 0 };

    if (template.enabled === false) {
      this.logLine(`Skipped template ${template.template}, it is disabled.`);
      return nothingToDo;
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      this.logLine(`Skipped template ${template.template}, no workspace root.`, OutputChannelSeverity.Warning);
      return nothingToDo;
    }

    const templateString = await this.getTemplateString(template);
    if (!templateString) {
      this.logLine(`Skipped template ${template.template}, template file is missing or empty.`, OutputChannelSeverity.Warning);
      return nothingToDo;
    }

    const encoding = template.encoding
      ? template.encoding
      : ProjectDataTemplateEncoding.utf8;
    const projectData = this.vesProjectService.getProjectData();

    let numberOfGeneratedFiles = 0;
    let numberOfFailedFiles = 0;

    const toRender = [];
    if (template.itemSpecific) {
      const items = this.vesProjectService.getProjectDataItemsForType(template.itemSpecific, ProjectContributor.Project) || {};
      await Promise.all(
        Object.values(items).map(async i => {
          if (fileUri && !fileUri.isEqual(i._fileUri)) {
            return;
          }

          try {
            const fileContents = await this.fileService.readFile(i._fileUri);
            const fileContentsJson = JSON.parse(fileContents.value.toString());
            let data = fileContentsJson;
            if (typeId) {
              data = await this.vesProjectService.getSchemaDefaults(PROJECT_TYPES[typeId], data);
            }

            toRender.push({
              item: {
                ...data,
                _filename: i._fileUri.path.name,
                _folder: i._fileUri.parent.path.name,
              },
              project: projectData,
              itemUri: i._fileUri,
            });
          } catch (error) {
            // one unreadable item must not take down the whole generation run
            numberOfFailedFiles++;
            this.logLine(
              `Could not read item ${i._fileUri.path.fsPath()} for template ${template.template}. ${error}`,
              OutputChannelSeverity.Error
            );
          }
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
        const targets = await this.getTargets(template, data.item, data.itemUri);
        if (!targets) {
          return;
        }

        await Promise.all(targets.map(async ({ uri: targetUri, bindings }) => {
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

          try {
            await this.renderTemplateToFile(
              template,
              targetUri,
              templateString,
              { ...data, item: { ...data.item, ...bindings } },
              encoding
            );
            // only count files that actually made it to disk
            numberOfGeneratedFiles++;
          } catch (error) {
            // renderTemplateToFile already logged the cause
            numberOfFailedFiles++;
          }
        }));
      })
    );

    return {
      generated: numberOfGeneratedFiles,
      failed: numberOfFailedFiles,
    };
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
            await this.renderTemplate(template, GenerationMode.All, typeId);
          }
        }));
      }
    }));
  }

  protected async configureTemplateEngine(): Promise<nunjucks.Environment> {
    // configure base path for includes of template partials
    const resourcesUri = await this.vesCommonService.getResourcesUri();

    const fileService = this.fileService;
    const log = (message: string, severity?: OutputChannelSeverity): void => this.logLine(message, severity);
    const VesFileServiceLoader = nunjucks.Loader.extend({
      async: true,
      getSource(name: string, callback: (err: Error | null, result: nunjucks.LoaderSource | null) => void): void {
        let uri = resourcesUri;
        name.split('/').forEach(namePart => {
          uri = uri.resolve(namePart);
        });
        fileService.readFile(uri).then(
          content => callback(null, {
            src: content.value.toString(),
            path: name,
            noCache: true,
          }),
          error => {
            log(`Could not load template partial ${name} from ${uri.path.fsPath()}. ${error}`, OutputChannelSeverity.Error);
            callback(new Error(`Could not load template partial ${name}. ${error}`), null);
          }
        );
      },
    } as unknown as nunjucks.ILoaderAsync);

    const env = new nunjucks.Environment(new VesFileServiceLoader() as unknown as nunjucks.ILoaderAsync);

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

    env.addFilter('convertPcm', async (configFileUri: URI, filePath: string, range: number, callback): Promise<void> => {
      try {
        const result = await convertPcm(configFileUri, filePath, range, this.fileService);
        callback(null, result);
      } catch (error) {
        callback(this.toFilterError('convertPcm', error), null);
      }
    }, true);

    env.addFilter('convertImage', async (imageConfigFileUri: URI, imageConfig: ImageConfigWithName, filePath: string, callback): Promise<void> => {
      try {
        const result = await this.vesImageService.convertImage(imageConfigFileUri, imageConfig, filePath);
        callback(null, result);
      } catch (error) {
        callback(this.toFilterError('convertImage', error), null);
      }
    }, true);

    env.addFilter('uncompressJson', async (str: unknown, callback): Promise<void> => {
      try {
        const result = await this.vesCommonService.unzipJson(str);
        callback(null, result);
      } catch (error) {
        callback(this.toFilterError('uncompressJson', error), null);
      }
    }, true);

    // add functions
    env.addGlobal('compressTiles', compressTiles);
    env.addGlobal('getTrackKeyframes', getTrackKeyframes);

    return env;
  }
}
