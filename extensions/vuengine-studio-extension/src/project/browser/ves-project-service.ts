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
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { VesNewProjectTemplate } from './new-project/ves-new-project-form';
import {
  ProjectFile,
  ProjectFileTemplate,
  ProjectFileTemplatesWithContributor,
  ProjectFileType,
  ProjectFileTypesWithContributor,
  VUENGINE_EXT,
  WithContributor
} from './ves-project-types';

@injectable()
export class VesProjectService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesBuildPathsService)
  private readonly vesBuildPathsService: VesBuildPathsService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(VesPluginsPathsService)
  private readonly vesPluginsPathsService: VesPluginsPathsService;
  @inject(WindowTitleService)
  private readonly windowTitleService: WindowTitleService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected fileChangeEventLock: boolean = false;
  protected workspaceProjectFileUri: URI | undefined;

  // project data
  protected _projectData: ProjectFile = {
    combined: {
      templates: {},
      types: {},
    },
    folders: [{
      'path': ''
    }],
    name: '',
    plugins: [],
    types: {},
  };

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

    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      fileChangesEvent.changes.map(change => {
        // TODO: registered types

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

  protected async doInit(): Promise<void> {
    await this.readProjectData();
    this._ready.resolve();
    this.updateWindowTitle();
  }

  protected async readProjectData(): Promise<void> {
    await this.workspaceService.ready;

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
          `*.${VUENGINE_EXT}`
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
        this.saveProjectFile();
        console.info(`Could not find project file. Created new one at ${this.workspaceProjectFileUri}`);
      } else {
        console.info('Could not find or create project file.');
      }
    }

    // engine
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const engineCoreProjectFileUri = engineCoreUri.resolve(`core.${VUENGINE_EXT}`);
    const engineCoreProjectFileData = await this.readProjectFileData(engineCoreProjectFileUri) || {};

    // installed plugins
    // TODO: resolve implicitly included plugins.
    // e.g. plugin B is a dependency of plugin A, but not listed in workspaceProjectFileData.plugins
    const pluginsProjectDataWithContributors: (ProjectFile & WithContributor)[] = [];
    if (workspaceProjectFileData?.plugins) {
      const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
      const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
      await Promise.all(workspaceProjectFileData.plugins.map(async installedPlugin => {
        let uri: URI | undefined;
        if (installedPlugin.startsWith(VUENGINE_PLUGINS_PREFIX)) {
          uri = enginePluginsUri
            .resolve(installedPlugin.replace(VUENGINE_PLUGINS_PREFIX, ''))
            .resolve(`plugin.${VUENGINE_EXT}`);
        } else if (installedPlugin.startsWith(USER_PLUGINS_PREFIX)) {
          uri = userPluginsUri
            .resolve(installedPlugin.replace(USER_PLUGINS_PREFIX, ''))
            .resolve(`plugin.${VUENGINE_EXT}`);
        }
        if (uri) {
          const data = await this.readProjectFileData(uri) as ProjectFile;
          if (data) {
            pluginsProjectDataWithContributors.push({
              _contributor: `plugin:${installedPlugin}`,
              _contributorUri: uri.parent,
              ...data,
            });
          }
        }
      }));
    }

    const projectDataWithContributors: (ProjectFile & WithContributor)[] = [
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
      [key: string]: unknown
    } = {
      'items': {},
      'templates': {},
      'types': {},
    };
    projectDataWithContributors.forEach(projectDataWithContributor => {
      // add to combined
      Object.keys(combined).forEach(combinedKey => {
        // @ts-ignore
        const data = projectDataWithContributor[combinedKey];
        if (data) {
          Object.keys(data).forEach(dataKey => {
            if (combinedKey === 'items') {
              Object.keys(data[dataKey]).forEach(itemId => {
                const combinedItem = data[dataKey][itemId];
                // @ts-ignore
                if (!combined[combinedKey][dataKey]) {
                  // @ts-ignore
                  combined[combinedKey][dataKey] = {};
                }
                // @ts-ignore
                combined[combinedKey][dataKey][itemId] = {
                  _contributor: projectDataWithContributor._contributor,
                  _contributorUri: projectDataWithContributor._contributorUri,
                  ...combinedItem,
                };
              });
            } else {
              // @ts-ignore
              combined[combinedKey][dataKey] = {
                _contributor: projectDataWithContributor._contributor,
                _contributorUri: projectDataWithContributor._contributorUri,
                ...data[dataKey],
              };
            }
          });
        }
      });
    });

    this._projectData = {
      ...workspaceProjectFileData,
      combined,
    };

    this.updateWindowTitle();
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
      await this.ready;
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
