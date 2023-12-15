import { CommandService, Emitter, MessageService, isWindows, nls } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangeType, FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VES_PREFERENCE_DIR } from '../../core/browser/ves-preference-configurations';
import { VesEditorsCommands } from '../../editors/browser/ves-editors-commands';
import { VesPluginsData } from '../../plugins/browser/ves-plugin';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { VesNewProjectTemplate } from './new-project/ves-new-project-form';
import {
  ProjectContributor,
  ProjectFile,
  ProjectFileItem,
  ProjectFileItemWithContributor,
  ProjectFileItemsWithContributor,
  ProjectFileTemplate,
  ProjectFileTemplatesWithContributor,
  ProjectFileType,
  ProjectFileTypesWithContributor,
  VUENGINE_EXT,
  WithContributor,
  defaultProjectData
} from './ves-project-types';

@injectable()
export class VesProjectService {
  @inject(CommandService)
  protected commandService: CommandService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(MessageService)
  protected messageService: MessageService;
  @inject(OpenerService)
  protected openerService: OpenerService;
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
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  protected readonly _projectDataReady = new Deferred<void>();
  get projectDataReady(): Promise<void> {
    return this._projectDataReady.promise;
  }
  protected readonly _projectItemsReady = new Deferred<void>();
  get projectItemsReady(): Promise<void> {
    return this._projectItemsReady.promise;
  }

  protected readonly onDidAddProjectItemEmitter = new Emitter<URI>();
  readonly onDidAddProjectItem = this.onDidAddProjectItemEmitter.event;
  protected readonly onDidUpdateProjectItemEmitter = new Emitter<URI>();
  readonly onDidUpdateProjectItem = this.onDidUpdateProjectItemEmitter.event;
  protected readonly onDidDeleteProjectItemEmitter = new Emitter<URI>();
  readonly onDidDeleteProjectItem = this.onDidDeleteProjectItemEmitter.event;

  // Flag to work around files change event firing twice
  // TODO: remove once revolved in Theia
  // https://github.com/eclipse-theia/theia/issues/3512
  protected fileChangeEventLock: boolean = false;

  protected workspaceProjectFileUri: URI | undefined;

  protected knownContributors: { [contributor: string]: URI } = {};

  // project data
  protected _projectData: ProjectFile | undefined;

  getProjectData(): ProjectFile | undefined {
    return this._projectData;
  }
  getProjectDataTypes(): ProjectFileTypesWithContributor | undefined {
    return this._projectData?.combined?.types;
  }
  getProjectDataType(typeId: string): ProjectFileType & WithContributor | undefined {
    return this._projectData?.combined?.types
      && this._projectData?.combined.types[typeId];
  }
  getProjectDataTemplates(): ProjectFileTemplatesWithContributor | undefined {
    return this._projectData?.combined?.templates;
  }
  getProjectDataTemplate(templateId: string): ProjectFileTemplate & WithContributor | undefined {
    return this._projectData?.combined?.templates
      && this._projectData?.combined?.templates[templateId];
  }
  getProjectDataItems(): ProjectFileItemsWithContributor | undefined {
    return this._projectData?.combined?.items;
  }
  getProjectDataItemsForType(typeId: string, contributor?: ProjectContributor): ProjectFileItemWithContributor | undefined {
    let result = {};
    const items = this._projectData?.combined?.items ? this._projectData?.combined?.items[typeId] || {} : {};

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
  protected setProjectDataItem(typeId: string, itemId: string, data: ProjectFileItem, fileUri: URI): boolean {
    if (!this._projectData) {
      this._projectData = {};
    }
    if (!this._projectData.combined) {
      this._projectData.combined = {};
    }
    if (!this._projectData.combined.items) {
      this._projectData.combined.items = {};
    }
    if (!this._projectData.combined.items[typeId]) {
      this._projectData.combined.items[typeId] = {};
    }

    const newItem = (this._projectData.combined.items[typeId][itemId] === undefined);

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

      this._projectData.combined.items[typeId][itemId] = {
        _contributor: contributor!,
        _contributorUri: contributorUri!,
        _fileUri: fileUri,
        ...data
      };

      this.onDidAddProjectItemEmitter.fire(fileUri);
      console.log(`Added item to project data. Type: ${typeId}, ID: ${itemId}, Contributor: ${contributor!}.`);
    } else {
      this._projectData.combined.items[typeId][itemId] = {
        ...this._projectData.combined.items[typeId][itemId],
        _fileUri: fileUri,
        ...data
      };

      this.onDidUpdateProjectItemEmitter.fire(fileUri);
      console.log(`Updated item in project data. Type: ${typeId}, ID: ${itemId}, Contributor: ${this._projectData.combined.items[typeId][itemId]._contributor}.`);
    }

    return true;
  }
  protected deleteProjectDataItem(typeId: string, itemId: string, fileUri: URI): void {
    if (this._projectData?.combined?.items
      && this._projectData?.combined.items[typeId]
      && this._projectData?.combined.items[typeId][itemId]) {
      delete (this._projectData?.combined.items[typeId][itemId]);
      if (!Object.keys(this._projectData?.combined.items[typeId]).length) {
        delete this._projectData?.combined.items[typeId];
      }
      if (!Object.keys(this._projectData?.combined.items).length) {
        delete this._projectData?.combined.items;
      }
      this.onDidDeleteProjectItemEmitter.fire(fileUri);
      console.log(`Removed item from project data. Type: ${typeId}, ID: ${itemId}.`);
    }
  }
  protected getProjectPlugins(): string[] {
    return this._projectData?.plugins || [];
  }
  protected async setProjectPlugins(plugins: string[]): Promise<void> {
    if (!this._projectData) {
      this._projectData = {};
    }
    this._projectData.plugins = plugins;
    await this.saveProjectFile();
    // update data of plugins
    await this.readProjectData();
    this.updateWindowTitle();
  }

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();
  }

  protected async doInit(): Promise<void> {
    await this.readProjectData();
    this.updateWindowTitle();
  }

  protected bindEvents(): void {
    this.vesPluginsService.onDidChangeInstalledPlugins((installedPlugins: string[]) => {
      this.setProjectPlugins(installedPlugins);
    });

    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      if (this.fileChangeEventLock) {
        return;
      }

      fileChangesEvent.changes.map(change => {
        // update project data when files of registered types change
        switch (change.type) {
          case FileChangeType.DELETED:
            this.handleFileDelete(change.resource);
            break;
          case FileChangeType.UPDATED:
            this.handleFileUpdate(change.resource);
            break;
        }

        // project file
        if (this.workspaceProjectFileUri && change.type === FileChangeType.UPDATED && change.resource.isEqual(this.workspaceProjectFileUri)) {
          this.enableFileChangeEventLock();
          console.info('Manual change of project file.');
          this.readProjectData();
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
    const types = this.getProjectDataTypes() || {};
    Object.keys(types).map(async typeId => {
      const type = types[typeId];
      if ([fileUri.path.ext, fileUri.path.base].includes(type.file)) {
        const items = this.getProjectDataItemsForType(typeId) || {};
        const itemIdByUri = Object.keys(items).find(itemId => items[itemId]._fileUri.isEqual(fileUri));
        if (itemIdByUri) {
          this.enableFileChangeEventLock();
          this.deleteProjectDataItem(typeId, itemIdByUri, fileUri);
        }
      }
    });
  }

  protected handleFileUpdate(fileUri: URI): void {
    const types = this.getProjectDataTypes() || {};
    Object.keys(types).map(async typeId => {
      const type = types[typeId];
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
              console.error('Can not update project data, missing _id property.', typeId);
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

  protected async readProjectData(): Promise<void> {
    await this.workspaceService.ready;
    const startTime = performance.now();

    this.knownContributors = {};

    // workspace
    let workspaceProjectFileData: ProjectFile = {
      'folders':
        [{
          'path': ''
        }]
    };
    this.workspaceProjectFileUri = this.workspaceService.workspace?.resource;
    if (this.workspaceProjectFileUri) {
      if (this.workspaceService.workspace?.isDirectory) {
        const workspaceProjectFolderUri = this.workspaceProjectFileUri;
        this.workspaceProjectFileUri = undefined;
        const projectFiles = window.electronVesCore.findFiles(
          await this.fileService.fsPath(workspaceProjectFolderUri),
          `*.${VUENGINE_EXT}`,
          {
            dot: false,
            ignore: ['build/**'],
            maxDepth: 0,
            nodir: true,
          }
        );
        if (projectFiles.length) {
          const filename = this.vesCommonService.basename(projectFiles[0]);
          if (filename) {
            this.workspaceProjectFileUri = workspaceProjectFolderUri?.resolve(filename);
          }
        }
      }
    }

    if (this.workspaceProjectFileUri) {
      workspaceProjectFileData = await this.readProjectFileData(this.workspaceProjectFileUri) || {};
      console.info(`Read project data from file ${this.workspaceProjectFileUri}.`);
    } else {
      if (this.workspaceService.workspace?.resource) {
        this.workspaceProjectFileUri = this.workspaceService.workspace?.resource.resolve(`project.${VUENGINE_EXT}`);
        this._projectData = workspaceProjectFileData;
        await this.saveProjectFile();
        console.info(`Could not find project file. Created new one at ${this.workspaceProjectFileUri}`);
      } else {
        console.info('Could not find or create project file.');
      }
    }

    // engine
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const engineCoreProjectFileUri = engineCoreUri.resolve(`core.${VUENGINE_EXT}`);
    const engineCoreProjectFileData = await this.readProjectFileData(engineCoreProjectFileUri) || {};

    // plugins
    this.vesPluginsService.setInstalledPlugins(workspaceProjectFileData?.plugins || []);
    const pluginsData = await this.getAllPluginsData();
    const cleanedPluginsData: VesPluginsData = {};
    Object.keys(pluginsData).map(pluginId => {
      cleanedPluginsData[pluginId] = pluginsData[pluginId].plugin;
    });
    this.vesPluginsService.setPluginsData(cleanedPluginsData);

    // installed plugins
    const pluginsProjectDataWithContributors: (ProjectFile & WithContributor)[] = [];
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
      if (uri && pluginsData[installedPluginId] && !this.workspaceProjectFileUri?.parent.isEqual(uri)) {
        const contributor = `${ProjectContributor.Plugin}:${installedPluginId}` as ProjectContributor;
        pluginsProjectDataWithContributors.push({
          _contributor: contributor,
          _contributorUri: uri,
          ...pluginsData[installedPluginId],
        });
        this.knownContributors[contributor] = uri;
      }
    }));

    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const projectDataWithContributors: (ProjectFile & WithContributor)[] = [{
      _contributor: ProjectContributor.Studio,
      _contributorUri: resourcesUri,
      ...defaultProjectData
    }];
    this.knownContributors[ProjectContributor.Studio] = resourcesUri;

    if (!this.workspaceProjectFileUri?.isEqual(engineCoreProjectFileUri)) {
      projectDataWithContributors.push({
        _contributor: ProjectContributor.Engine,
        _contributorUri: engineCoreProjectFileUri.parent,
        ...engineCoreProjectFileData
      });
      this.knownContributors[ProjectContributor.Engine] = engineCoreProjectFileUri.parent;
    }

    if (pluginsProjectDataWithContributors.length) {
      projectDataWithContributors.push(...pluginsProjectDataWithContributors);
    }

    if (this.workspaceProjectFileUri) {
      projectDataWithContributors.push({
        _contributor: ProjectContributor.Project,
        _contributorUri: this.workspaceProjectFileUri.parent,
        ...workspaceProjectFileData
      });
      this.knownContributors[ProjectContributor.Project] = this.workspaceProjectFileUri.parent;
    }

    const combined: {
      [key: string]: ProjectFileItemsWithContributor | ProjectFileTemplatesWithContributor | ProjectFileTypesWithContributor
    } = {
      items: {},
      templates: {},
      types: {},
    };

    // add types and templates to combined
    projectDataWithContributors.forEach(async projectDataWithContributor => {
      ['templates', 'types'].forEach(combinedKey => {
        // @ts-ignore
        const data = projectDataWithContributor[combinedKey];
        if (data) {
          Object.keys(data).forEach(dataKey => {
            combined[combinedKey][dataKey] = {
              _contributor: projectDataWithContributor._contributor,
              _contributorUri: projectDataWithContributor._contributorUri,
              ...data[dataKey],
            };
          });
        }
      });
    });

    this._projectData = {
      ...workspaceProjectFileData,
      combined,
    };

    if (this._projectDataReady.state === 'unresolved') {
      this._projectDataReady.resolve();
    }

    // add items to combined
    const filePatterns = Object.values(combined.types).map((t: ProjectFileType) => t.file?.startsWith('.') ? `**/*${t.file}` : `**/${t.file}`);
    projectDataWithContributors.forEach(async projectDataWithContributor => {
      // find item files
      const itemFiles = window.electronVesCore.findFiles(
        await this.fileService.fsPath(projectDataWithContributor._contributorUri),
        filePatterns,
        {
          ignore: ['build/**'],
          maxDepth: 32,
          nodir: true,
        }
      );
      // find type
      itemFiles.forEach(filename => {
        const uri = projectDataWithContributor._contributorUri.resolve(filename);
        Object.keys(combined.types).forEach(async typeId => {
          const type = combined.types[typeId] as (ProjectFileType & WithContributor);
          if ([uri.path.ext, uri.path.base].includes(type.file)) {
            if (!combined['items'][typeId]) {
              combined['items'][typeId] = {};
            }

            const fileContent = await this.fileService.readFile(uri);
            try {
              const fileContentJson = JSON.parse(fileContent.value.toString());
              const itemWithContributor = {
                _contributor: projectDataWithContributor._contributor,
                _contributorUri: projectDataWithContributor._contributorUri,
                _fileUri: uri,
                ...fileContentJson
              };
              if (type.file?.startsWith('.')) {
                if (fileContentJson._id) {
                  // @ts-ignore
                  if (combined['items'][typeId][fileContentJson._id]) {
                    const openFileButtonLabel = nls.localize(
                      'vuengine/projects/openFile',
                      'Open File',
                    );
                    const generateIdButtonLabel = nls.localize(
                      'vuengine/projects/generateNewId',
                      'Generate New ID',
                    );
                    this.messageService.warn(
                      nls.localize(
                        'vuengine/projects/duplicateItemIdDetected',
                        'Duplicate item ID detected in file "{0}".',
                        uri?.path.base,
                      ),
                      openFileButtonLabel,
                      generateIdButtonLabel,
                    ).then(async button => {
                      switch (button) {
                        case openFileButtonLabel:
                          const opener = await this.openerService.getOpener(uri);
                          return opener.open(uri);

                        case generateIdButtonLabel:
                          return this.commandService.executeCommand(VesEditorsCommands.GENERATE_ID.id, uri);
                      }
                    });
                  }
                  // @ts-ignore
                  combined['items'][typeId][fileContentJson._id] = itemWithContributor;
                } else {
                  const openFileButtonLabel = nls.localize(
                    'vuengine/projects/openFile',
                    'Open File',
                  );
                  const generateIdButtonLabel = nls.localize(
                    'vuengine/projects/generateId',
                    'Generate ID',
                  );
                  this.messageService.warn(
                    nls.localize(
                      'vuengine/projects/missingItemIdDetected',
                      'Missing item ID detected in file "{0}".',
                      uri?.path.base,
                    ),
                    openFileButtonLabel,
                    generateIdButtonLabel,
                  ).then(async button => {
                    switch (button) {
                      case openFileButtonLabel:
                        const opener = await this.openerService.getOpener(uri);
                        return opener.open(uri);

                      case generateIdButtonLabel:
                        return this.commandService.executeCommand(VesEditorsCommands.GENERATE_ID.id, uri);
                    }
                  });
                }
              } else {
                // @ts-ignore
                combined['items'][typeId][projectDataWithContributor._contributor] = itemWithContributor;
              }
            } catch (error) {
              console.error('Malformed item file could not be parsed.', uri?.path.toString());
              return;
            }
          }
        });
      });
    });

    this._projectData = {
      ...this._projectData,
      combined,
    };

    if (this._projectItemsReady.state === 'unresolved') {
      this._projectItemsReady.resolve();
    }

    this.updateWindowTitle();

    const duration = performance.now() - startTime;
    console.log(`Getting VUEngine project data took: ${Math.round(duration)} ms.`);
  }

  // note: tests with caching plugin data in a single file did not increase performance much
  async getAllPluginsData(): Promise<{ [id: string]: Partial<ProjectFile> & { plugin: VesPluginsData } }> {
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();

    const findPlugins = async (rootUri: URI, prefix: string) => {
      const rootPath = (await this.fileService.fsPath(rootUri)).replace(/\\/g, '/');
      const pluginsMap: any = {};

      const pluginFiles = window.electronVesCore.findFiles(rootPath, '**/plugin.vuengine', {
        dot: false,
        nodir: true
      });
      for (const pluginFile of pluginFiles) {
        const pluginFileUri = rootUri.resolve(pluginFile);
        const pluginRelativeUri = new URI(isWindows ? `/${pluginFile}` : pluginFile).withScheme('file').parent;

        const fileContent = await this.fileService.readFile(pluginFileUri);
        try {
          const fileContentJson = JSON.parse(fileContent.value.toString());

          const pluginId = `${prefix}/${pluginRelativeUri.path.toString().replace(/\\/g, '/')}`;

          fileContentJson.plugin.name = pluginId;
          const iconUri = pluginFileUri.parent.resolve('icon.png');
          fileContentJson.plugin.icon = await this.fileService.exists(iconUri)
            ? iconUri.path.toString()
            : '';
          fileContentJson.plugin.readme = pluginFileUri.parent.resolve('readme.md').path.toString();

          fileContentJson.plugin.displayName = this.translatePluginField(fileContentJson.plugin.displayName, nls.locale || 'en');
          fileContentJson.plugin.author = this.translatePluginField(fileContentJson.plugin.author, nls.locale || 'en');
          fileContentJson.plugin.description = this.translatePluginField(fileContentJson.plugin.description, nls.locale || 'en');
          fileContentJson.plugin.license = this.translatePluginField(fileContentJson.plugin.license, nls.locale || 'en');

          if (Array.isArray(fileContentJson.plugin.tags)) {
            const tagsObject = {};
            fileContentJson.plugin.tags.forEach((tag: any) => {
              // @ts-ignore
              tagsObject[this.translatePluginField(tag, 'en')] = this.translatePluginField(tag, nls.locale);
            });
            fileContentJson.plugin.tags = tagsObject;
          } else {
            fileContentJson.plugin.tags = {};
          }

          pluginsMap[pluginId] = fileContentJson;
        } catch (e) {
          console.error(pluginFileUri.path.toString(), e);
        }
      }

      return pluginsMap;
    };

    const pluginsData = {
      ...await findPlugins(enginePluginsUri, 'vuengine'),
      ...await findPlugins(userPluginsUri, 'user'),
    };

    return pluginsData;
  }

  protected translatePluginField(field: Object | string, locale: string): string {
    if (field instanceof Object) {
      // @ts-ignore
      return field[locale] || field.en || '';
    }

    return field;
  }

  protected async readProjectFileData(projectFileUri?: URI): Promise<ProjectFile | undefined> {
    if (projectFileUri && await this.fileService.exists(projectFileUri)) {
      const projectFileContents = await this.fileService.readFile(projectFileUri);
      try {
        return JSON.parse(projectFileContents.value.toString());
      } catch (error) {
        console.error('Malformed project file could not be parsed.', projectFileUri?.path.toString());
      }
    }

    return {
      folders: [{
        'path': ''
      }],
      plugins: [],
    };
  }

  async saveProjectFile(): Promise<boolean> {
    if (!this.workspaceProjectFileUri) {
      return false;
    }

    this.fileChangeEventLock = true;

    try {
      await this.fileService.writeFile(
        this.workspaceProjectFileUri,
        BinaryBuffer.fromString(JSON.stringify({
          ...this._projectData,
          combined: undefined,
        }, undefined, 4))
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async getProjectName(projectFileUri?: URI): Promise<string> {
    let projectTitle = '';
    let isFolder = false;

    // Attempt to retrieve project name from project file
    let projectData;
    if (projectFileUri) {
      const fileStat = await this.fileService.resolve(projectFileUri);
      if (fileStat && fileStat.isDirectory) {
        isFolder = true;
      }
      if (fileStat && !isFolder && await this.fileService.exists(projectFileUri)) {
        try {
          const configFileContents = await this.fileService.readFile(projectFileUri);
          projectData = JSON.parse(configFileContents.value.toString()) as ProjectFile;
        } catch (error) {
          console.error('Malformed project file could not be parsed.', projectFileUri?.path.toString());
        }
      }
    } else {
      await this.projectDataReady;
      projectData = this._projectData;
    }

    if (projectData?.name) {
      projectTitle = projectData.name;
    }

    // Get from workspace service instead
    if (!projectTitle && !projectFileUri && this.workspaceService.workspace) {
      if (this.workspaceService.workspace?.isFile) {
        const workspaceParts = this.workspaceService.workspace.name.split('.');
        workspaceParts.pop();
        projectTitle = workspaceParts.join('.');
      } else {
        projectTitle = this.workspaceService.workspace.name;
      }
    }

    // Use base path instead
    if (!projectTitle) {
      projectTitle = projectFileUri?.path?.base || '';
    }

    // Append folder suffix
    if (isFolder) {
      const folderSuffix = nls.localizeByDefault('Folder');
      projectTitle = `${projectTitle} (${folderSuffix})`;
    }

    return projectTitle || 'VUEngine Studio';
  }

  async setProjectName(name: string): Promise<void> {
    if (!this._projectData) {
      this._projectData = {};
    }
    this._projectData.name = name;
    await this.saveProjectFile();
    this.updateWindowTitle();
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
        projectsBaseUri.resolve(`${template.id}.${VUENGINE_EXT}`),
        projectsBaseUri.resolve(`${folder}.${VUENGINE_EXT}`),
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
      await this.replaceInProject(projectsBaseUri, template.labels['description'], 'Description');
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
}
