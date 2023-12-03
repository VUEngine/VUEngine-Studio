import { isWindows, nls } from '@theia/core';
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
import { VesPluginsData } from '../../plugins/browser/ves-plugin';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { VesNewProjectTemplate } from './new-project/ves-new-project-form';
import {
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
  @inject(FileService)
  protected fileService: FileService;
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

  protected fileChangeEventLock: boolean = false;
  protected workspaceProjectFileUri: URI | undefined;

  // project data
  protected _projectData: ProjectFile;

  getProjectData(): ProjectFile {
    return this._projectData;
  }
  getProjectDataTypes(): ProjectFileTypesWithContributor | undefined {
    return this._projectData.combined?.types;
  }
  getProjectDataType(typeId: string): ProjectFileType & WithContributor | undefined {
    return this._projectData.combined?.types
      && this._projectData.combined.types[typeId];
  }
  getProjectDataTemplates(): ProjectFileTemplatesWithContributor | undefined {
    return this._projectData.combined?.templates;
  }
  getProjectDataTemplate(templateId: string): ProjectFileTemplate & WithContributor | undefined {
    return this._projectData.combined?.templates
      && this._projectData.combined?.templates[templateId];
  }
  getProjectDataItems(): ProjectFileItemsWithContributor | undefined {
    return this._projectData.combined?.items;
  }
  getProjectDataItemsForType(typeId: string): ProjectFileItemWithContributor | undefined {
    return this._projectData.combined?.items && this._projectData.combined?.items[typeId];
  }
  async setProjectDataItem(typeId: string, itemId: string, data: ProjectFileItem): Promise<boolean> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return false;
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
    this._projectData.combined.items[typeId][itemId] = {
      _contributor: 'project',
      _contributorUri: workspaceRootUri.parent,
      ...data
    };

    return true;
  }
  async deleteProjectDataItem(typeId: string, itemId: string): Promise<void> {
    if (this._projectData.combined?.items
      && this._projectData.combined.items[typeId]
      && this._projectData.combined.items[typeId][itemId]) {
      delete (this._projectData.combined.items[typeId][itemId]);
      if (!Object.keys(this._projectData.combined.items[typeId]).length) {
        delete this._projectData.combined.items[typeId];
      }
      if (!Object.keys(this._projectData.combined.items).length) {
        delete this._projectData.combined.items;
      }
    }
  }
  getProjectPlugins(): string[] {
    return this._projectData.plugins || [];
  }
  async setProjectPlugins(plugins: string[]): Promise<void> {
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
      fileChangesEvent.changes.map(change => {
        // TODO: registered types
        // move corresponding generated code for moved files of registered types
        // update project data entries for changed files of registered types to project data
        // add new files of registered types to project data
        // remove deleted files of registered types from project data and delete corresponding generated code
        // detect changes of forFiles and automatically convert?

        // project file
        if (this.workspaceProjectFileUri && change.type === FileChangeType.UPDATED && change.resource.isEqual(this.workspaceProjectFileUri)) {
          if (!this.fileChangeEventLock) {
            console.info('Manual change of project file.');
            this.readProjectData();
          } else {
            this.fileChangeEventLock = false;
          }
        }
      });
    });
  }

  protected async readProjectData(): Promise<void> {
    await this.workspaceService.ready;
    const startTime = performance.now();

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
    this.vesPluginsService.setPluginsData(pluginsData);

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
      if (uri && pluginsData[installedPluginId]) {
        pluginsProjectDataWithContributors.push({
          _contributor: `plugin:${installedPluginId}`,
          _contributorUri: uri,
          ...pluginsData[installedPluginId],
        });
      }
    }));

    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const projectDataWithContributors: (ProjectFile & WithContributor)[] = [
      {
        _contributor: 'studio',
        _contributorUri: resourcesUri,
        ...defaultProjectData
      },
      {
        _contributor: 'engine',
        _contributorUri: engineCoreProjectFileUri.parent,
        ...engineCoreProjectFileData
      },
      ...pluginsProjectDataWithContributors,
    ];

    if (this.workspaceProjectFileUri) {
      projectDataWithContributors.push({
        _contributor: 'project',
        _contributorUri: this.workspaceProjectFileUri.parent,
        ...workspaceProjectFileData
      });
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
                ...fileContentJson
              };
              if (type.file?.startsWith('.')) {
                if (fileContentJson._id) {
                  // @ts-ignore
                  combined['items'][typeId][fileContentJson._id] = itemWithContributor;
                } else {
                  console.error('Missing _id in item file.', uri?.path.toString());
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
  async getAllPluginsData(): Promise<VesPluginsData> {
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
          const fileContentJson = JSON.parse(fileContent.value.toString()).plugin;

          const pluginId = `${prefix}/${pluginRelativeUri.path.toString().replace(/\\/g, '/')}`;

          fileContentJson.name = pluginId;
          const iconUri = pluginFileUri.parent.resolve('icon.png');
          fileContentJson.icon = await this.fileService.exists(iconUri)
            ? iconUri.path.toString()
            : '';
          fileContentJson.readme = pluginFileUri.parent.resolve('readme.md').path.toString();

          fileContentJson.displayName = this.translatePluginField(fileContentJson.displayName, nls.locale || 'en');
          fileContentJson.author = this.translatePluginField(fileContentJson.author, nls.locale || 'en');
          fileContentJson.description = this.translatePluginField(fileContentJson.description, nls.locale || 'en');
          fileContentJson.license = this.translatePluginField(fileContentJson.license, nls.locale || 'en');

          if (Array.isArray(fileContentJson.tags)) {
            const tagsObject = {};
            fileContentJson.tags.forEach((tag: any) => {
              // @ts-ignore
              tagsObject[this.translatePluginField(tag, 'en')] = this.translatePluginField(tag, nls.locale);
            });
            fileContentJson.tags = tagsObject;
          } else {
            fileContentJson.tags = {};
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
        const projectFile: ProjectFile = JSON.parse(projectFileContents.value.toString());
        return this.addIdToTypes(projectFile);
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

  protected addIdToTypes(projectFile: ProjectFile): ProjectFile {
    for (const type of Object.values(projectFile.types || {})) {
      if (type.file?.startsWith('.') && type.schema.properties) {
        type.schema.properties['_id'] = {
          type: 'string',
          default: ''
        };
      }
    }

    return projectFile;
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
    this._projectData.name = name;
    await this.saveProjectFile();
    this.updateWindowTitle();
  }

  async createProjectFromTemplate(
    template: VesNewProjectTemplate,
    folder: string,
    targetUri: URI,
    name: string,
    gameCode: string,
    author: string,
    makerCode: string
  ): Promise<boolean | string> {
    const templateUri = await this.getTemplatesUri(template.id);

    if (await this.fileService.exists(targetUri)) {
      return 'Error: path does already exist';
    }

    try {
      // copy template folder to new project location
      await this.fileService.copy(templateUri, targetUri);

      // modify files and folders
      const dirsToDelete = [
        VES_PREFERENCE_DIR,
        '.git',
        '.github'
      ];

      for (const dirToDelete of dirsToDelete) {
        const dirToDeleteUri = targetUri.resolve(dirToDelete);
        if (await this.fileService.exists(dirToDeleteUri)) {
          await this.fileService.delete(dirToDeleteUri, { recursive: true });
        }
      }

      await this.fileService.move(
        targetUri.resolve(`${template.id}.${VUENGINE_EXT}`),
        targetUri.resolve(`${folder}.${VUENGINE_EXT}`),
      );

      // replace labels according to mapping file
      // the first three are most sensitive and should be replaced first
      await this.replaceInProject(
        targetUri,
        template.labels['headerName'].substring(0, 20).padEnd(20, ' '), name.substring(0, 20).padEnd(20, ' ')
      );
      const templateGameCode = template.labels['gameCode'].substring(0, 4).padEnd(4, 'X');
      await this.replaceInProject(targetUri,
        `"gameCodeId": "${templateGameCode.substring(1, 3)}",`,
        `"gameCodeId": "${gameCode.substring(0, 2).padEnd(2, 'X')}",`
      );
      await this.replaceInProject(
        targetUri,
        `"${templateGameCode}"`, `"${templateGameCode.substring(0, 1)}${gameCode.substring(0, 2).padEnd(2, 'X')}${templateGameCode.substring(3, 4)}"`
      );
      await this.replaceInProject(targetUri, `"${template.labels['makerCode'].substring(0, 2).padEnd(2, ' ')}"`, `"${makerCode.substring(0, 2).padEnd(2, ' ')}"`);
      await this.replaceInProject(targetUri, template.labels['headerName'], name);
      await Promise.all(template.labels['name']?.map(async (value: string) => {
        await this.replaceInProject(targetUri, value, name);
      }));
      await Promise.all(template.labels['authors']?.map(async (value: string) => {
        await this.replaceInProject(targetUri, value, author);
      }));
      await this.replaceInProject(targetUri, template.labels['description'], 'Description');
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

  protected async replaceInProject(uri: URI, from: string, to: string): Promise<void> {
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
  }

  protected async updateWindowTitle(): Promise<void> {
    this.windowTitleService.update({
      projectName: await this.getProjectName()
    });
  }
}
