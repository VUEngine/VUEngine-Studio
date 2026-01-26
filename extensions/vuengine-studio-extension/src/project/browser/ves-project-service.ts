import {
  CommandService,
  Emitter,
  MessageService,
  PreferenceScope,
  PreferenceService,
  QuickInputService,
  QuickPickItem,
  QuickPickOptions,
  QuickPickService,
  isObject,
  isWindows,
  nls
} from '@theia/core';
import { OpenerService, SingleTextInputDialog } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { FrontendApplicationState } from '@theia/core/lib/common/frontend-application-state';
import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangeType, FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { OutputChannelManager, OutputChannelSeverity } from '@theia/output/lib/browser/output-channel';
import { deepmerge } from 'deepmerge-ts';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VES_VERSION } from '../../core/browser/ves-common-types';
import { VES_PREFERENCE_DIR } from '../../core/browser/ves-preference-configurations';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { nanoid, sortObjectByKeys, stringify } from '../../editors/browser/components/Common/Utils';
import { PluginFileTranslatedField } from '../../editors/browser/components/PluginFileEditor/PluginFileEditorTypes';
import { VesEditorsCommands } from '../../editors/browser/ves-editors-commands';
import { ItemData } from '../../editors/browser/ves-editors-widget';
import { VesPluginsData } from '../../plugins/browser/ves-plugin';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { PluginConfiguration, USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { VesNewProjectTemplate } from './new-project/ves-new-project-form';
import { PROJECT_TYPES } from './ves-project-data';
import { VesProjectPreferenceIds } from './ves-project-preferences';
import {
  GameConfig,
  PROJECT_CHANNEL_NAME,
  ProjectContributor,
  ProjectDataItem,
  ProjectDataItemsByTypeWithContributor,
  ProjectDataItemsWithContributor,
  ProjectDataType,
  ProjectDataWithContributor,
  ProjectUpdateMode,
  VUENGINE_WORKSPACE_EXT,
  WithContributor,
  WithFileUri,
  WithType,
  WithVersion
} from './ves-project-types';

@injectable()
export class VesProjectService {
  @inject(CommandService)
  protected commandService: CommandService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(MessageService)
  protected messageService: MessageService;
  @inject(OpenerService)
  protected openerService: OpenerService;
  @inject(QuickInputService)
  protected readonly quickInputService: QuickInputService;
  @inject(OutputChannelManager)
  protected readonly outputChannelManager: OutputChannelManager;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(QuickPickService)
  protected readonly quickPickService: QuickPickService;
  @inject(VesBuildPathsService)
  private readonly vesBuildPathsService: VesBuildPathsService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(VesPluginsService)
  private readonly vesPluginsService: VesPluginsService;
  @inject(VesPluginsPathsService)
  private readonly vesPluginsPathsService: VesPluginsPathsService;
  @inject(WindowTitleService)
  private readonly windowTitleService: WindowTitleService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  protected readonly _projectDataReady = new Deferred<void>();
  get projectDataReady(): Promise<void> {
    return this._projectDataReady.promise;
  }

  protected _isUpdatingFiles: boolean = false;
  protected readonly onDidChangeIsUpdatingFilesEmitter = new Emitter<boolean>();
  readonly onDidChangeIsUpdatingFiles = this.onDidChangeIsUpdatingFilesEmitter.event;
  set isUpdatingFiles(flag: boolean) {
    this._isUpdatingFiles = flag;
    this.onDidChangeIsUpdatingFilesEmitter.fire(this._isUpdatingFiles);
  }
  get isUpdatingFiles(): boolean {
    return this._isUpdatingFiles;
  }

  protected readonly onDidAddProjectItemEmitter = new Emitter<URI>();
  readonly onDidAddProjectItem = this.onDidAddProjectItemEmitter.event;
  protected readonly onDidUpdateProjectItemEmitter = new Emitter<URI>();
  readonly onDidUpdateProjectItem = this.onDidUpdateProjectItemEmitter.event;
  protected readonly onDidDeleteProjectItemEmitter = new Emitter<URI>();
  readonly onDidDeleteProjectItem = this.onDidDeleteProjectItemEmitter.event;
  protected readonly onDidUpdateGameConfigEmitter = new Emitter<void>();
  readonly onDidUpdateGameConfig = this.onDidUpdateGameConfigEmitter.event;

  // Flag to work around files change event firing twice
  // TODO: remove once revolved in Theia
  // https://github.com/eclipse-theia/theia/issues/3512
  protected fileChangeEventLock: boolean = false;

  protected workspaceProjectFolderUri: URI | undefined;
  protected gameConfigFileUri: URI | undefined;
  protected justWroteGameConfigFile: boolean = false;

  protected knownContributors: { [contributor: string]: URI } = {};

  // project data
  protected _projectData: ProjectDataWithContributor = {
    items: {},
  };

  getProjectData(): ProjectDataWithContributor | undefined {
    return this._projectData;
  }

  getProjectDataItems(): ProjectDataItemsByTypeWithContributor | undefined {
    return this._projectData?.items;
  }

  getProjectDataItemById(itemId: string, typeId: string): object | undefined {
    if (this._projectData?.items && this._projectData?.items[typeId]) {
      return this._projectData?.items[typeId][itemId];
    }
  }

  getProjectDataItemsForType(typeId: string, contributor?: ProjectContributor): ProjectDataItemsWithContributor | undefined {
    let result = {};
    const items = this._projectData?.items ? this._projectData?.items[typeId] || {} : {};

    if (contributor) {
      Object.keys(items).map(id => {
        // @ts-ignore
        const item = items[id];
        if (item._contributor === contributor || item._contributor.startsWith(`${contributor}:`)) {
          // @ts-ignore
          result[id] = item;
        }
      });
    } else {
      result = items;
    }

    return result;
  }

  getProjectDataAllKnownPlugins(): { [id: string]: VesPluginsData } | undefined {
    return this._projectData?.plugins;
  }

  async getSchemaDefaults(type: ProjectDataType, existingData: ItemData = {}): Promise<ItemData> {
    const needsId = type.file.startsWith('.');
    if (type.schema.properties && needsId) {
      type.schema.properties['_id'] = {
        type: 'string',
        default: nanoid(),
      };
    }
    type.schema.properties['_version'] = {
      type: 'string',
      default: VES_VERSION,
    };
    const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
    let data: ItemData = {
      ...this.generateDataFromJsonSchema({
        ...schema,
        type: 'object',
        additionalProperties: false,
      }, existingData),
      _version: VES_VERSION,
    };
    /*
        if (data?.name === '') {
          data.name = this.uri.path.name;
        }
    */

    data = window.electronVesCore.sortJson(data ?? {}, {
      depth: 8,
      ignoreCase: true,
      reverse: false,
    });

    return data;
  }

  /**
   * Generates JSON from schema, using either values present in data or schema default.
   * Will only contain properties that are present in the schema.
   */
  generateDataFromJsonSchema(schema: any, data?: any): any {
    if (!schema) {
      return;
    }

    const getValue = (defaultValue: any) => (data !== undefined)
      ? data
      : (schema.default !== undefined)
        ? schema.default
        : defaultValue;

    switch (schema.type) {
      case 'array':
        let resultArray: any[] = [];
        if (data?.length > 0) {
          data.map((dataValue: any) => {
            resultArray.push(this.generateDataFromJsonSchema(
              schema.items,
              dataValue
            ));
          });
        } else if (schema.default !== undefined) {
          resultArray = schema.default;
        }
        if ((schema.minItems !== undefined) && resultArray.length < schema.minItems) {
          [...Array(schema.minItems - resultArray.length)].map(x => {
            resultArray.push(this.generateDataFromJsonSchema(
              schema.items,
            ));
          });
        }
        if ((schema.maxItems !== undefined) && resultArray.length > schema.maxItems) {
          resultArray.splice(schema.maxItems - 1);
        }
        return resultArray;

      case 'boolean':
        return getValue(false);

      case 'integer':
      case 'number':
        let resultNumber = getValue(0);
        if (schema.minimum && resultNumber < schema.minimum) {
          resultNumber = schema.minimum;
        }
        if (schema.maximum && resultNumber > schema.maximum) {
          resultNumber = schema.maximum;
        }
        return getValue(0);

      case 'object':
        let resultObject: any = {};
        if (schema.properties) {
          Object.keys(schema.properties).forEach(key => {
            resultObject[key] = this.generateDataFromJsonSchema(
              schema.properties![key],
              data ? data[key] : undefined
            );
          });
        }
        // TODO: support for 'patternProperties'
        // TODO: support for non-boolean 'additionalProperties'
        if (schema.additionalProperties !== false) {
          resultObject = deepmerge(resultObject, data ?? {});
        }
        if (Object.keys(resultObject).length === 0 && schema.default) {
          resultObject = schema.default;
        }
        return sortObjectByKeys(resultObject);

      case 'string':
        return getValue('');
    }
  }

  async createNewFileForType(typeId: string, itemIdToClone?: string): Promise<{ fileUri: URI, data: ProjectDataItem } | undefined> {
    const type = PROJECT_TYPES[typeId];
    if (this.workspaceProjectFolderUri === undefined || !type || !type.file.startsWith('.')) {
      return;
    }

    let cloneItem;
    let cloneItemName;
    if (itemIdToClone) {
      const itemToClone = this.getProjectDataItemById(itemIdToClone, typeId) as ItemData & WithFileUri;
      cloneItemName = itemToClone._fileUri.path.name;
      const fileContent = await this.fileService.read(itemToClone._fileUri);
      cloneItem = JSON.parse(fileContent.value.toString());
    }

    const defaultName =
      cloneItemName
        ? `${cloneItemName} ${nls.localize('vuengine/general/copy', 'Copy')}`
        : nls.localize('vuengine/editors/general/newFileDialog/untitled', 'Untitled');

    const dialog = new SingleTextInputDialog({
      title: nls.localize('vuengine/projects/newFileName', 'New File Name'),
      initialValue: defaultName,
      maxWidth: 450,
    });
    const filename = await dialog.open();

    if (!filename) {
      return;
    }

    const baseUri = this.workspaceProjectFolderUri.resolve('assets').resolve(typeId);
    let fileUri = baseUri?.resolve(`${filename}/${filename}${type.file}`);
    let count = 1;
    while ((await this.fileService.exists(fileUri))) {
      fileUri = baseUri?.resolve(`${filename}/${filename}-${count}${type.file}`);
      count++;
    }

    let data = await this.getSchemaDefaults(type);
    if (cloneItem) {
      data = { ...cloneItem };
      data._id = nanoid();
    }

    const fileValue = stringify(data);
    await this.fileService.create(fileUri, fileValue);

    return { fileUri, data };
  }

  protected setProjectDataAllKnownPlugins(plugins: { [id: string]: VesPluginsData }): void {
    if (!this._projectData) {
      this._projectData = {
        items: {}
      };
    }
    this._projectData.plugins = plugins;
  }

  protected setProjectDataItem(typeId: string, itemId: string, data: ProjectDataItem, fileUri: URI): boolean {
    if (!this._projectData) {
      this._projectData = {
        items: {},
      };
    }
    if (!this._projectData.items) {
      this._projectData.items = {};
    }
    if (!this._projectData.items[typeId]) {
      this._projectData.items[typeId] = {};
    }

    const newItem = (this._projectData.items[typeId][itemId] === undefined);

    if (newItem) {
      // check if uri is under any of a list of known contributors
      let contributor: ProjectContributor;
      let contributorUri: URI;
      let matchedContributor = false;
      Object.keys(this.knownContributors).map(c => {
        const u = this.knownContributors[c];
        if (!matchedContributor && u.isEqualOrParent(fileUri)) {
          contributor = c as ProjectContributor;
          contributorUri = u;
          matchedContributor = true;
        }
      });
      if (!matchedContributor) {
        return false;
      }

      this._projectData.items[typeId][itemId] = {
        _contributor: contributor!,
        _contributorUri: contributorUri!,
        _fileUri: fileUri,
        ...data
      };

      this.onDidAddProjectItemEmitter.fire(fileUri);
      this.logLine(`Added item to project data. Type: ${typeId}, ID: ${itemId}, Contributor: ${contributor!}.`);
    } else {
      this._projectData.items[typeId][itemId] = {
        _contributor: this._projectData.items[typeId][itemId]._contributor,
        _contributorUri: this._projectData.items[typeId][itemId]._contributorUri,
        _fileUri: fileUri,
        ...data
      };

      this.onDidUpdateProjectItemEmitter.fire(fileUri);
      this.logLine(`Updated item in project data. Type: ${typeId}, ID: ${itemId}, Contributor: ${this._projectData.items[typeId][itemId]._contributor}.`);
    }

    return true;
  }

  protected deleteProjectDataItem(typeId: string, itemId: string, fileUri: URI): void {
    if (this._projectData?.items
      && this._projectData?.items[typeId]
      && this._projectData?.items[typeId][itemId]) {
      delete (this._projectData?.items[typeId][itemId]);
      if (!Object.keys(this._projectData?.items[typeId]).length) {
        delete this._projectData?.items[typeId];
      }
      if (!Object.keys(this._projectData?.items).length) {
        this._projectData.items = {};
      }
      this.onDidDeleteProjectItemEmitter.fire(fileUri);
      this.logLine(`Removed item from project data. Type: ${typeId}, ID: ${itemId}.`);
    }
  }

  protected getProjectPlugins(): string[] {
    const gameConfig = this.getProjectDataItemById(ProjectContributor.Project, 'GameConfig');
    // @ts-ignore
    return gameConfig?.plugins ? Object.keys(gameConfig?.plugins) : [];
  }

  protected async setProjectPlugins(installedPlugins: string[]): Promise<void> {
    if (this.workspaceProjectFolderUri) {
      // get current from file
      let gameConfig = {};
      if (this.gameConfigFileUri && await this.fileService.exists(this.gameConfigFileUri)) {
        const fileContent = await this.fileService.readFile(this.gameConfigFileUri);
        gameConfig = JSON.parse(fileContent.value.toString());
      }

      // update plugins map
      // @ts-ignore
      const currentPlugins = gameConfig.plugins;
      Object.keys(currentPlugins).map(pluginId => {
        if (!installedPlugins.includes(pluginId)) {
          delete currentPlugins[pluginId];
        }
      });
      installedPlugins.map(pluginId => {
        if (!currentPlugins[pluginId]) {
          currentPlugins[pluginId] = {};
        }
      });

      // sort updated plugins alphabetically
      const sortedPlugins: { [id: string]: string } = {};
      Object.keys(currentPlugins).sort((a, b) => a.localeCompare(b)).forEach(key => {
        sortedPlugins[key] = currentPlugins[key];
      });

      // update project data
      this.setProjectDataItem('GameConfig', ProjectContributor.Project, {
        ...(this.getProjectDataItemById(ProjectContributor.Project, 'GameConfig') as object),
        plugins: sortedPlugins,
      }, this.gameConfigFileUri!);

      // persist to GameConfig file
      if (this.workspaceService.isCollaboration() && this.gameConfigFileUri && await this.fileService.exists(this.gameConfigFileUri)) {
        // delete first when in collab session, otherwise it won't let us overwrite
        await this.fileService.delete(this.gameConfigFileUri!);
      }
      this.justWroteGameConfigFile = true;
      await this.fileService.writeFile(
        this.gameConfigFileUri!,
        BinaryBuffer.fromString(stringify({
          ...gameConfig,
          plugins: sortedPlugins
        })),
      );

      // fire event
      this.onDidUpdateGameConfigEmitter.fire();
    }
  }

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();
    this.registerOutputChannel();
  }

  protected async doInit(): Promise<void> {
    await this.readProjectData();
  }

  protected async bindEvents(): Promise<void> {
    this.workspaceService.onDidChangeRoots(async (isCollaboration: boolean) => {
      if (isCollaboration) {
        this.updateWindowTitle();
        await this.readProjectData();
      }
    });

    this.frontendApplicationStateService.onStateChanged(
      async (state: FrontendApplicationState) => {
        if (state === 'ready') {
          this.updateWindowTitle();
        }
      }
    );

    this.vesPluginsService.onDidChangeInstalledPlugins((installedPlugins: string[]) => {
      this.setProjectPlugins(installedPlugins);
    });

    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      if (this.fileChangeEventLock) {
        return;
      }

      fileChangesEvent.changes.map(change => {
        // ignore files changes by git, etc
        if (change.resource.scheme !== 'file') {
          return;
        }

        // update project data when files of registered types change
        switch (change.type) {
          case FileChangeType.DELETED:
            this.handleFileDelete(change.resource);
            break;
          case FileChangeType.UPDATED:
            this.handleFileUpdate(change.resource);
            break;
        }
      });
    });
  }

  protected enableFileChangeEventLock(): void {
    this.fileChangeEventLock = true;
    setTimeout(() => {
      this.fileChangeEventLock = false;
    }, 1000);
  }

  protected handleFileDelete(fileUri: URI): void {
    Object.keys(PROJECT_TYPES).map(async typeId => {
      const type = PROJECT_TYPES[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        const items = this.getProjectDataItemsForType(typeId) || {};
        const itemIdByUri = Object.keys(items).find(itemId => items[itemId]._fileUri.isEqual(fileUri));
        if (itemIdByUri) {
          this.enableFileChangeEventLock();
          this.deleteProjectDataItem(typeId, itemIdByUri, fileUri);
          this.onDidUpdateProjectItemEmitter.fire(fileUri);
        }
      }
    });
  }

  protected async handleFileUpdate(fileUri: URI): Promise<void> {
    if (this.gameConfigFileUri && fileUri.isEqual(this.gameConfigFileUri)) {
      if (this.justWroteGameConfigFile) {
        this.justWroteGameConfigFile = false;
        return;
      }
      this.enableFileChangeEventLock();
      this.updateWindowTitle();
      await this.readProjectData();
      this.onDidUpdateProjectItemEmitter.fire(fileUri);
    } else {
      Object.keys(PROJECT_TYPES).map(async typeId => {
        const type = PROJECT_TYPES[typeId];
        if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
          const items = this.getProjectDataItemsForType(typeId) || {};
          const itemIdByUri = Object.keys(items).find(itemId => items[itemId]._fileUri.isEqual(fileUri));
          try {
            const fileContents = await this.fileService.readFile(fileUri);
            const fileContentsJson = JSON.parse(fileContents.value.toString());
            if (itemIdByUri) {
              this.enableFileChangeEventLock();
              this.setProjectDataItem(typeId, itemIdByUri, fileContentsJson, fileUri);
            } else if (type.file.startsWith('.')) {
              if (fileContentsJson._id) {
                this.enableFileChangeEventLock();
                this.setProjectDataItem(typeId, fileContentsJson._id, fileContentsJson, fileUri);
              } else {
                this.logLine(`Can not update project data, missing _id property. Type: ${typeId}`, OutputChannelSeverity.Error);
              }
            } else {
              this.enableFileChangeEventLock();
              this.setProjectDataItem(typeId, ProjectContributor.Project, fileContentsJson, fileUri);
            }
          } catch (error) {
          }
        }
      });
    }
  }

  protected async setKnownContributors(): Promise<void> {
    this.knownContributors = {};

    // workspace
    this.workspaceProjectFolderUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (this.workspaceProjectFolderUri) {
      this.knownContributors[ProjectContributor.Project] = this.workspaceProjectFolderUri;
    }

    // engine
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    if (!this.workspaceProjectFolderUri?.isEqual(engineCoreUri)) {
      this.knownContributors[ProjectContributor.Engine] = engineCoreUri;
    }

    // plugins
    let plugins: string[] = [];
    this.gameConfigFileUri = this.workspaceProjectFolderUri?.resolve('config').resolve('GameConfig');
    if (this.gameConfigFileUri && await this.fileService.exists(this.gameConfigFileUri)) {
      try {
        const fileContent = await this.fileService.readFile(this.gameConfigFileUri);
        plugins = Object.keys(JSON.parse(fileContent.value.toString()).plugins || {});
      } catch (error) { }
    }
    this.vesPluginsService.setInstalledPlugins(plugins);
    const pluginsData = await this.getAllPluginsData();
    this.setProjectDataAllKnownPlugins(pluginsData);
    this.vesPluginsService.setPluginsData(pluginsData);

    // installed plugins
    const actuallyUsedPlugins = this.vesPluginsService.getActualUsedPluginNames();
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
    await Promise.all(actuallyUsedPlugins.map(async installedPluginId => {
      let uri: URI | undefined;
      if (installedPluginId.startsWith(VUENGINE_PLUGINS_PREFIX)) {
        uri = enginePluginsUri.resolve(installedPluginId.replace(VUENGINE_PLUGINS_PREFIX, ''));
      } else if (installedPluginId.startsWith(USER_PLUGINS_PREFIX)) {
        uri = userPluginsUri.resolve(installedPluginId.replace(USER_PLUGINS_PREFIX, ''));
      }
      if (uri && !this.workspaceProjectFolderUri?.isEqual(uri)) {
        const contributor = `${ProjectContributor.Plugin}:${installedPluginId}` as ProjectContributor;
        this.knownContributors[contributor] = uri;
      }
    }));

    // vuengine studio
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const studioTemplatesUri = resourcesUri.resolve('templates');
    this.knownContributors[ProjectContributor.Studio] = studioTemplatesUri;
  };

  protected async warnDuplicateItemId(uri: URI, previousUri: URI): Promise<void> {
    const openFileButtonLabel = nls.localize(
      'vuengine/projects/openFile',
      'Open File',
    );
    const generateIdButtonLabel = nls.localize(
      'vuengine/projects/generateNewId',
      'Generate New ID',
    );

    const answer = await this.messageService.warn(
      nls.localize(
        'vuengine/projects/duplicateItemIdDetected',
        'Duplicate item ID detected in file "{0}". Previously seen in file "{1}"',
        uri?.path.fsPath(),
        previousUri?.path.fsPath(),
      ),
      openFileButtonLabel,
      generateIdButtonLabel,
    );

    if (answer === undefined) {
      return;
    }

    switch (answer) {
      case openFileButtonLabel:
        const opener = await this.openerService.getOpener(uri);
        await opener.open(uri);

      case generateIdButtonLabel:
        this.commandService.executeCommand(VesEditorsCommands.GENERATE_ID.id, uri);
    }
  }

  protected async warnMissingItemId(uri: URI): Promise<void> {
    const openFileButtonLabel = nls.localize(
      'vuengine/projects/openFile',
      'Open File',
    );
    const generateIdButtonLabel = nls.localize(
      'vuengine/projects/generateId',
      'Generate ID',
    );

    const answer = await this.messageService.warn(
      nls.localize(
        'vuengine/projects/missingItemIdDetected',
        'Missing item ID detected in file "{0}".',
        uri?.path.base,
      ),
      openFileButtonLabel,
      generateIdButtonLabel,
    );

    if (answer === undefined) {
      return;
    }

    switch (answer) {
      case openFileButtonLabel:
        const opener = await this.openerService.getOpener(uri);
        await opener.open(uri);

      case generateIdButtonLabel:
        this.commandService.executeCommand(VesEditorsCommands.GENERATE_ID.id, uri);
    }
  }

  protected async readProjectData(): Promise<void> {
    await this.workspaceService.ready;

    // do nothing when no project is opened
    if (!this.workspaceService.opened) {
      if (this._projectDataReady.state === 'unresolved') {
        this._projectDataReady.resolve();
      }

      return;
    }

    const startTime = performance.now();

    await this.setKnownContributors();

    // add items to project data
    const filePatterns = Object.values(PROJECT_TYPES).map((t: ProjectDataType) => t.file?.startsWith('.')
      ? `**/*${t.file}`
      : `**/${t.file}`);
    await Promise.all(Object.keys(this.knownContributors).map(async knownContributorKey => {
      // find item files
      const itemFiles = window.electronVesCore.findFiles(
        await this.fileService.fsPath(this.knownContributors[knownContributorKey]),
        filePatterns,
        {
          ignore: ['build/**'],
          maxDepth: 32,
          nodir: true,
        }
      );
      // find type
      await Promise.all(itemFiles.map(async filename => {
        const uri = this.knownContributors[knownContributorKey].resolve(filename);
        await Promise.all(Object.keys(PROJECT_TYPES).map(async typeId => {
          const type = PROJECT_TYPES[typeId] as ProjectDataType;
          if ([uri.path.ext, uri.path.base].includes(type.file)) {
            if (!this._projectData.items[typeId]) {
              this._projectData.items[typeId] = {};
            }

            const fileContent = await this.fileService.readFile(uri);
            try {
              const fileContentJson = JSON.parse(fileContent.value.toString());
              const itemWithContributor = {
                _contributor: knownContributorKey,
                _contributorUri: this.knownContributors[knownContributorKey],
                _fileUri: uri,
                ...fileContentJson
              };
              if (type.file?.startsWith('.')) {
                if (fileContentJson._id) {
                  const existingItem = this._projectData.items[typeId][fileContentJson._id];
                  const previousUri = existingItem?._fileUri;
                  if (this._projectData.items[typeId][fileContentJson._id] && !uri.isEqual(previousUri)) {
                    this.warnDuplicateItemId(uri, previousUri);
                  }
                  this._projectData.items[typeId][fileContentJson._id] = itemWithContributor;
                } else {
                  this.warnMissingItemId(uri);
                }
              } else {
                this._projectData.items[typeId][knownContributorKey] = itemWithContributor;
              }
            } catch (error) {
              console.error('Malformed item file could not be parsed.', uri?.path.fsPath());
              return;
            }
          }
        }));
      }));
    }));

    const duration = performance.now() - startTime;
    console.log(`Getting VUEngine project data took: ${Math.round(duration)} ms.`);

    if (this._projectDataReady.state === 'unresolved') {
      this._projectDataReady.resolve();
    }

    // check for outdated items
    const checkForOutdatedFiles = this.preferenceService.get(VesProjectPreferenceIds.CHECK_FOR_OUTDATED_FILES) as boolean;
    if (checkForOutdatedFiles) {
      const outdatedItems = await this.getOutdatedProjectItems();
      if (outdatedItems.length) {
        console.log('Outdated item files found', outdatedItems);
        await this.promptForFilesUpdate(outdatedItems.length);
      }
    }
  }

  async getGameConfig(): Promise<GameConfig> {
    await this.projectDataReady;

    let gameConfig = this.getProjectDataItemById(ProjectContributor.Project, 'GameConfig') as GameConfig;
    if (!gameConfig) {
      gameConfig = this.generateDataFromJsonSchema(PROJECT_TYPES['GameConfig'].schema?.properties) as GameConfig;
    }

    return gameConfig;
  }

  async setGameConfig(data: Partial<GameConfig>): Promise<void> {
    await this.projectDataReady;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    const gameConfig = await this.getGameConfig() as unknown as ProjectDataItem & WithFileUri;
    const gameConfigFileUri = (gameConfig && gameConfig._fileUri)
      ? gameConfig._fileUri
      : workspaceRootUri.resolve('config').resolve('GameConfig');

    await this.fileService.writeFile(
      gameConfigFileUri,
      BinaryBuffer.fromString(
        JSON.stringify(
          sortObjectByKeys({
            ...gameConfig,
            ...data,
            _fileUri: undefined,
            _contributor: undefined,
            _contributorUri: undefined,
          }),
          undefined,
          4
        )
      ),
    );
  }

  protected async promptForFilesUpdate(numberOfFiles: number): Promise<void> {
    const yes = nls.localize('vuengine/projects/yes', 'Yes');
    const no = nls.localize('vuengine/projects/no', 'No');
    const disableChecks = nls.localize('vuengine/projects/disableChecks', 'No, Disable Checks');
    const answer = await this.messageService.warn(
      numberOfFiles === 1
        ? nls.localize('vuengine/projects/foundOutdatedFile', 'Found 1 outdated item file. Should it be updated automatically?')
        : nls.localize('vuengine/projects/foundOutdatedFiles', 'Found {0} outdated item files. Should they be updated automatically?', numberOfFiles),
      yes,
      no,
      disableChecks,
    );
    if (answer === yes) {
      await this.updateFiles(ProjectUpdateMode.LowerVersionOnly);
    } else if (answer === disableChecks) {
      await this.preferenceService.set(VesProjectPreferenceIds.CHECK_FOR_OUTDATED_FILES, false, PreferenceScope.User);
    }
  }

  // note: tests with caching plugin data in a single file did not increase performance much
  protected async getAllPluginsData(): Promise<{ [id: string]: VesPluginsData }> {
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();

    const findPlugins = async (rootUri: URI, prefix: string) => {
      const rootPath = (await this.fileService.fsPath(rootUri)).replace(/\\/g, '/');
      const pluginsMap: any = {};

      const pluginFiles = window.electronVesCore.findFiles(rootPath, '**/*.plugin', {
        dot: false,
        nodir: true
      });
      await Promise.all(pluginFiles.map(async pluginFile => {
        const pluginFileUri = rootUri.resolve(pluginFile);
        const pluginRelativeUri = new URI(isWindows ? `/${pluginFile}` : pluginFile).withScheme('file').parent;
        const fileContent = await this.fileService.readFile(pluginFileUri);
        try {
          const fileContentJson = JSON.parse(fileContent.value.toString());
          const localeKey = nls.locale ?? 'en';
          const pluginId = `${prefix}/${pluginRelativeUri.path.fsPath().replace(/\\/g, '/')}`;
          const iconUri = pluginFileUri.parent.resolve('icon.png');
          const tagsObject = {} as PluginFileTranslatedField;
          if (Array.isArray(fileContentJson.tags)) {
            fileContentJson.tags.map((tag: any) => {
              tagsObject[this.translatePluginField(tag, 'en')] = this.translatePluginField(tag, localeKey);
            });
          }
          const configuration: PluginConfiguration[] = [];
          if (Array.isArray(fileContentJson.configuration)) {
            fileContentJson.configuration.map((c: PluginConfiguration) => {
              configuration.push({
                ...c,
                label: this.translatePluginField(c.label, localeKey),
                description: c.description ? this.translatePluginField(c.description, localeKey) : undefined,
              });
            });
          }

          pluginsMap[pluginId] = {
            ...fileContentJson,
            name: pluginId,
            icon: await this.fileService.exists(iconUri)
              ? iconUri.path.fsPath()
              : '',
            readme: pluginFileUri.parent.resolve('readme.md').path.fsPath(),
            displayName: this.translatePluginField(fileContentJson.displayName, localeKey),
            author: this.translatePluginField(fileContentJson.author, localeKey),
            description: this.translatePluginField(fileContentJson.description, localeKey),
            license: this.translatePluginField(fileContentJson.license, localeKey),
            tags: tagsObject,
            configuration,
          };
        } catch (e) {
          console.error(pluginFileUri.path.fsPath(), e);
        }
      }));

      return pluginsMap;
    };

    const pluginsData = {
      ...await findPlugins(enginePluginsUri, 'vuengine'),
      ...await findPlugins(userPluginsUri, 'user'),
    };

    return pluginsData;
  }

  protected translatePluginField(field: PluginFileTranslatedField | string, locale: string): string {
    if (isObject(field)) {
      return field[locale] ?? field.en ?? Object.values(field)[0];
    }

    return field as string;
  }

  async getProjectName(workspaceFileUri?: URI): Promise<string> {
    let projectTitle;

    // Attempt to retrieve project name from GameConfig file
    const rootFolder = workspaceFileUri
      ? workspaceFileUri.parent
      : this.workspaceService.tryGetRoots()[0]?.resource;
    if (rootFolder) {
      const gameConfigUri = rootFolder.resolve('config').resolve('GameConfig');
      if (await this.fileService.exists(gameConfigUri)) {
        const fileContent = await this.fileService.readFile(gameConfigUri);
        projectTitle = JSON.parse(fileContent.value.toString()).projectTitle;
      }
    }

    // Get from workspace service instead
    if (!projectTitle && !workspaceFileUri && this.workspaceService.workspace) {
      if (this.workspaceService.workspace?.isFile) {
        const workspaceParts = this.workspaceService.workspace.name.split('.');
        workspaceParts.pop();
        projectTitle = workspaceParts.join('.');
      } else {
        projectTitle = this.workspaceService.workspace.name;
      }
    }

    // Use base path instead
    if (!projectTitle && workspaceFileUri) {
      projectTitle = workspaceFileUri.path?.base || '';
    }

    // Append folder suffix
    /*
    if (isFolder) {
      const folderSuffix = nls.localizeByDefault('Folder');
      projectTitle = `${projectTitle} (${folderSuffix})`;
    }
    */

    return projectTitle ?? 'VUEngine Studio';
  }

  protected registerOutputChannel(): void {
    this.logLine('');
  }

  protected logLine(message: string, severity: OutputChannelSeverity = OutputChannelSeverity.Info): void {
    const channel = this.outputChannelManager.getChannel(PROJECT_CHANNEL_NAME);
    if (message) {
      const date = new Date();
      channel.append(`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} `);
      channel.appendLine(message, severity);
    }
  }

  async createProjectFromTemplate(
    projectsBaseUri: URI,
    template: VesNewProjectTemplate,
    folder: string,
    name: string,
    gameCode: string,
    author: string,
    makerCode: string
  ): Promise<boolean | string> {
    try {
      // modify files and folders
      const dirsToDelete = [
        VES_PREFERENCE_DIR,
        '.github'
      ];

      for (const dirToDelete of dirsToDelete) {
        const dirToDeleteUri = projectsBaseUri.resolve(dirToDelete);
        if (await this.fileService.exists(dirToDeleteUri)) {
          await this.fileService.delete(dirToDeleteUri, { recursive: true });
        }
      }

      await this.fileService.move(
        projectsBaseUri.resolve(`${template.id}.${VUENGINE_WORKSPACE_EXT}`),
        projectsBaseUri.resolve(`${folder}.${VUENGINE_WORKSPACE_EXT}`),
      );

      // replace labels according to mapping file
      // the first three are most sensitive and should be replaced first
      await this.replaceInProject(
        projectsBaseUri,
        template.labels['headerName'].substring(0, 20).padEnd(20, ' '), name.substring(0, 20).padEnd(20, ' ')
      );
      const templateGameCode = template.labels['gameCode'].substring(0, 4).padEnd(4, 'X');
      await this.replaceInProject(projectsBaseUri,
        `"gameCodeId": "${templateGameCode.substring(1, 3)}",`,
        `"gameCodeId": "${gameCode.substring(0, 2).padEnd(2, 'X')}",`
      );
      await this.replaceInProject(
        projectsBaseUri,
        `"${templateGameCode}"`, `"${templateGameCode.substring(0, 1)}${gameCode.substring(0, 2).padEnd(2, 'X')}${templateGameCode.substring(3, 4)}"`
      );
      await this.replaceInProject(projectsBaseUri, `"${template.labels['makerCode'].substring(0, 2).padEnd(2, ' ')}"`, `"${makerCode.substring(0, 2).padEnd(2, ' ')}"`);
      await this.replaceInProject(projectsBaseUri, template.labels['headerName'], name);
      await Promise.all(template.labels['name']?.map(async (value: string) => {
        await this.replaceInProject(projectsBaseUri, value, name);
      }));
      await Promise.all(template.labels['authors']?.map(async (value: string) => {
        await this.replaceInProject(projectsBaseUri, value, author);
      }));
      await this.replaceInProject(projectsBaseUri, template.labels['description'], nls.localizeByDefault('Description'));
    } catch (e) {
      return e;
    }

    return true;
  }

  protected async getTemplatesUri(template: string): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('vuengine')
      .resolve(template);
  }

  protected async replaceInProject(uri: URI, from: string, to: string): Promise<number> {
    let basepath = await this.fileService.fsPath(uri);

    if (isWindows) {
      basepath = basepath.replace(/\\/g, '/');
    }

    if (to && from) {
      return window.electronVesCore.replaceInFiles(
        [
          `${basepath}/**/*.*`,
          `${basepath}/**/*`,
          `${basepath}/*.*`,
          `${basepath}/*`,
        ],
        from,
        to,
      );

    }

    return 0;
  }

  protected async updateWindowTitle(): Promise<void> {
    this.windowTitleService.update({
      projectName: await this.getProjectName()
    });
  }

  async getOutdatedProjectItems(updateMode: ProjectUpdateMode = ProjectUpdateMode.LowerVersionOnly): Promise<(unknown & WithContributor & WithFileUri & WithVersion & WithType)[]> {
    const outdatedItems: (unknown & WithContributor & WithFileUri & WithVersion & WithType)[] = [];

    // find all items
    const itemsByType = this.getProjectDataItems();
    if (!itemsByType) {
      return outdatedItems;
    }

    // get project-contributed items
    const projectItems: (unknown & WithContributor & WithFileUri & WithVersion & WithType)[] = [];
    Object.keys(itemsByType).map(typeId => {
      const type = PROJECT_TYPES[typeId];
      Object.values(itemsByType[typeId]).map((item: ProjectDataItem & WithContributor & WithFileUri & WithVersion) => {
        if (item._contributor === ProjectContributor.Project) {
          projectItems.push({
            ...item,
            type: type!,
          });
        }
      });
    });
    if (!projectItems.length) {
      return outdatedItems;
    }

    // find outdated items
    projectItems.map(item => {
      if (item._version !== VES_VERSION || updateMode === ProjectUpdateMode.All) {
        outdatedItems.push(item);
      }
    });

    return outdatedItems;
  }

  async showUpdateModeSelection(): Promise<void> {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/projects/commands/updateFiles', 'Update Files...'),
      description: nls.localize(
        'vuengine/codegen/allOrLowerVersionOnly',
        'Do you want to update all files or only those with a lower version number stamp?'
      ),
      placeholder: nls.localize('vuengine/codegen/typeToFilter', 'Type to filter list'),
      hideInput: true,
    };

    const items: QuickPickItem[] = [{
      id: ProjectUpdateMode.All,
      label: nls.localize('vuengine/projects/allFiles', 'All files'),
    }, {
      id: ProjectUpdateMode.LowerVersionOnly,
      label: nls.localize('vuengine/projects/lowerVersionOnly', 'Lower Version Only'),
    }];

    const selection = await this.quickPickService.show(items, quickPickOptions);
    if (!selection) {
      return;
    }

    return this.updateFiles(selection.id as ProjectUpdateMode);
  }

  async updateFiles(updateMode: ProjectUpdateMode): Promise<void> {
    this.isUpdatingFiles = true;

    // get outdated files
    const outdatedItems = await this.getOutdatedProjectItems(updateMode);
    if (!outdatedItems.length) {
      this.isUpdatingFiles = false;
      await this.messageService.info(
        nls.localize('vuengine/projects/AllItemFilesUpToDate', 'All item files are already up-to-date.'),
      );
      return;
    }

    // update outdated items
    await Promise.all(outdatedItems.map(async itemtoUpdate => {
      try {
        const fileContent = await this.fileService.readFile(itemtoUpdate._fileUri);
        const fileContentJson = JSON.parse(fileContent.value.buffer.toString()) as ItemData;
        const updatedFileContentJson = await this.getSchemaDefaults(itemtoUpdate.type, fileContentJson);
        const updatedFileContentBuffer = BinaryBuffer.fromString(stringify(updatedFileContentJson));
        await this.fileService.writeFile(itemtoUpdate._fileUri, updatedFileContentBuffer);
        this.logLine(`Updated item file ${this.workspaceProjectFolderUri?.relative(itemtoUpdate._fileUri)!.fsPath()}.`);
      } catch (error) {
        await this.messageService.error(nls.localize(
          'vuengine/projects/errorUpdatingFile',
          'Encountered an error when trying to update {0}: {1}',
          itemtoUpdate._fileUri.path.fsPath(),
          error,
        ));
      }
    }));

    // update project data
    await this.readProjectData();

    // report
    this.isUpdatingFiles = false;
    const viewLogs = nls.localize('vuengine/projects/viewLogs', 'View Logs');
    const answer = await this.messageService.info(
      nls.localize('vuengine/projects/updatedItemFiles', 'Successfully updated {0} item files.', outdatedItems.length),
      viewLogs,
    );
    if (answer === viewLogs) {
      this.outputChannelManager.getChannel(PROJECT_CHANNEL_NAME).show();
    }
  }
}
