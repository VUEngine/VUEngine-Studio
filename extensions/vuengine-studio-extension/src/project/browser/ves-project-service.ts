import { isWindows } from '@theia/core';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VES_PREFERENCE_DIR } from '../../core/browser/ves-preference-configurations';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../../plugins/browser/ves-plugins-types';
import { VUENGINE_EXT } from '../common/custom-project-file/ves-project-utils';
import { VesNewProjectTemplate } from './new-project/ves-new-project-form';
import { ProjectFile, ProjectFileItems, ProjectFileTemplate, ProjectFileType, ProjectFileTypes, WithContributor } from './ves-project-types';

const replaceInFiles = require('replace-in-files');

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
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  // project data
  protected _projectData: ProjectFile = {
    combined: {
      items: {},
      templates: {},
      types: {},
    },
    folders: [{
      'path': '.'
    }],
    items: {},
    plugins: [],
    types: {},
  };
  protected readonly onDidChangeProjectDataEmitter = new Emitter<void>();
  readonly onDidChangeProjectData = this.onDidChangeProjectDataEmitter.event;
  getProjectData(): ProjectFile {
    return this._projectData;
  }
  getProjectDataItems(typeId: string): ProjectFileItems | undefined {
    return this._projectData.items && this._projectData.items[typeId];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProjectDataItem(typeId: string, itemId: string): any | undefined {
    return this._projectData.items && this._projectData.items[typeId][itemId];
  }
  getProjectDataTypes(): ProjectFileTypes | undefined {
    return this._projectData.combined?.types;
  }
  getProjectDataType(typeId: string): ProjectFileType | undefined {
    return this._projectData.combined?.types
      && this._projectData.combined.types[typeId];
  }
  getProjectDataTemplate(templateId: string): ProjectFileTemplate | undefined {
    return this._projectData.combined?.templates
      && this._projectData.combined.templates[templateId];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setProjectDataItem(typeId: string, itemId: string, data: any): Promise<boolean> {
    if (!this._projectData.items) {
      this._projectData.items = {};
    }
    if (!this._projectData.items[typeId]) {
      this._projectData.items[typeId] = {};
    }
    this._projectData.items[typeId][itemId] = data;

    if (!this._projectData.combined) {
      this._projectData.combined = {};
    }
    if (!this._projectData.combined.items) {
      this._projectData.combined.items = {};
    }
    if (!this._projectData.combined.items[typeId]) {
      this._projectData.combined.items[typeId] = {};
    }
    this._projectData.combined.items[typeId][itemId] = data;

    this.onDidChangeProjectDataEmitter.fire();
    return this.saveProjectFile();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteProjectDataItem(typeId: string, itemId: string): Promise<boolean> {
    if (this._projectData.items
      && this._projectData.items[typeId]
      && this._projectData.items[typeId][itemId]) {
      delete (this._projectData.items[typeId][itemId]);
      if (!Object.keys(this._projectData.items[typeId]).length) {
        delete this._projectData.items[typeId];
      }
      if (!Object.keys(this._projectData.items).length) {
        delete this._projectData.items;
      }
    }

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

    this.onDidChangeProjectDataEmitter.fire();
    return this.saveProjectFile();

    return false;
  }
  getProjectPlugins(): string[] {
    return this._projectData.plugins || [];
  }
  async setProjectPlugins(plugins: string[]): Promise<boolean> {
    this._projectData.plugins = plugins;
    this.onDidChangeProjectDataEmitter.fire();
    return this.saveProjectFile();
  }

  @postConstruct()
  protected async init(): Promise<void> {
    await this.readProjectData();

    // TODO: react on workspace folders changing

    /* await this.workspaceService.ready;
    const projectFileUri = this.workspaceService.workspace?.resource;
    if (projectFileUri) {
      // watch for project config file changes
      this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
        if (fileChangesEvent.contains(projectFileUri)) {
          await this.readProjectData();
          this.onDidChangeProjectDataEmitter.fire();
        }
      });
    } */

    this._ready.resolve();
  }

  protected async readProjectData(): Promise<void> {
    await this.workspaceService.ready;

    const templateToUri = (rootUri: URI, projectFile: ProjectFile) => {
      if (projectFile?.templates) {
        Object.keys(projectFile.templates).map(key => {
          const templatePathParts = (projectFile.templates![key].template as string).split('/');
          let templateUri = rootUri;
          templatePathParts.forEach(templatePathPart => {
            templateUri = templateUri.resolve(templatePathPart);
          });
          projectFile.templates![key].template = templateUri;
        });
      }

      return projectFile;
    };

    // workspace
    const workspaceProjectFileUri = this.workspaceService.workspace?.resource;
    const workspaceProjectFileData = workspaceProjectFileUri
      ? templateToUri(
        workspaceProjectFileUri.parent,
        await this.readProjectFileData(workspaceProjectFileUri) || {}
      )
      : {};

    // engine
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const engineCoreProjectFileUri = engineCoreUri.resolve(`core.${VUENGINE_EXT}`);
    const engineCoreProjectFileData = templateToUri(
      engineCoreProjectFileUri.parent,
      await this.readProjectFileData(engineCoreProjectFileUri) || {}
    );

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
              ...templateToUri(uri.parent, data)
            });
          }
        }
      }));
    }

    const projectDataWithContributors: (ProjectFile & WithContributor)[] = [
      {
        _contributor: 'engine',
        ...engineCoreProjectFileData
      },
      ...pluginsProjectDataWithContributors,
      {
        _contributor: 'workspace',
        ...workspaceProjectFileData
      },
    ];

    const combined: { [key: string]: unknown } = {
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
                  ...combinedItem,
                };
              });
            } else {
              // @ts-ignore
              combined[combinedKey][dataKey] = {
                _contributor: projectDataWithContributor._contributor,
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
  }

  protected async readProjectFileData(projectFileUri?: URI): Promise<ProjectFile | undefined> {
    if (projectFileUri && await this.fileService.exists(projectFileUri)) {
      const configFileContents = await this.fileService.readFile(projectFileUri);
      try {
        return JSON.parse(configFileContents.value.toString());
      } catch (error) {
        console.error('Malformed project file could not be parsed.', projectFileUri?.path.toString());
      }
    }

    return {
      folders: [{
        'path': '.'
      }],
      plugins: [],
      items: {}
    };
  }

  async saveProjectFile(): Promise<boolean> {
    const projectFileUri = this.workspaceService.workspace?.resource;
    if (!projectFileUri) {
      return false;
    }

    try {
      this.fileService.writeFile(
        projectFileUri,
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

    // Attempt to retrieve project name from configuration file
    let projectData;
    if (projectFileUri) {
      if (await this.fileService.exists(projectFileUri)) {
        const configFileContents = await this.fileService.readFile(projectFileUri);
        projectData = JSON.parse(configFileContents.value.toString()) as ProjectFile;
      }
    } else {
      await this.ready;
      projectData = this._projectData;
    }
    if (projectData?.items?.Project) {
      const first = Object.values(projectData.items.Project)[0];
      // @ts-ignore
      if (first && first.title) {
        // @ts-ignore
        projectTitle = first.title;
      }
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

    return projectTitle || 'VUEngine Studio';
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
      return replaceInFiles({
        files: [
          `${basepath}/**/*.*`,
          `${basepath}/*.*`,
          `${basepath}/*`,
        ],
        from,
        to,
      });
    }
  }
}
