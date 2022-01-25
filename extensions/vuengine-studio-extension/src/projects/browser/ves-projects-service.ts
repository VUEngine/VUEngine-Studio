import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { join } from 'path';
import { VES_PREFERENCE_DIR } from '../../branding/browser/ves-branding-preference-configurations';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesNewProjectTemplate } from './new-project/ves-projects-new-project-form';

const replaceInFiles = require('replace-in-files');

@injectable()
export class VesProjectsService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  // project file change event
  protected readonly onDidChangeProjectFileEmitter = new Emitter<void>();
  readonly onDidChangeProjectFile = this.onDidChangeProjectFileEmitter.event;

  @postConstruct()
  protected async init(): Promise<void> {
    // watch for project config file changes
    const configFileUri = await this.getProjectConfigFileUri();
    if (configFileUri) {
      this.fileService.onDidFilesChange((fileChangesEvent: FileChangesEvent) => {
        if (fileChangesEvent.contains(configFileUri)) {
          this.onDidChangeProjectFileEmitter.fire();
        }
      });
    }
  }

  async getProjectName(projectRootUri?: URI): Promise<string> {
    let projectTitle = '';
    let isWorkspace = this.workspaceService.workspace?.isFile || false;

    if (projectRootUri && !(await this.fileService.resolve(projectRootUri)).isDirectory) {
      projectRootUri = projectRootUri.parent;
      isWorkspace = true;
    }

    // Attempt to retrieve project name from configuration file
    const projectFileUri = await this.getProjectConfigFileUri(projectRootUri);
    if (projectFileUri && await this.fileService.exists(projectFileUri)) {
      const configFileContents = await this.fileService.readFile(projectFileUri);
      const projectData = JSON.parse(configFileContents.value.toString());
      if (projectData.name) {
        projectTitle = projectData.name;
        if (isWorkspace) {
          projectTitle += ' (Workspace)';
        }
      }
    };

    // Get from workspace service instead
    if (projectTitle === '' && this.workspaceService.workspace) {
      if (this.workspaceService.workspace?.isFile) {
        const workspaceParts = this.workspaceService.workspace.name.split('.');
        workspaceParts.pop();
        projectTitle = workspaceParts.join('.');
      } else {
        projectTitle = this.workspaceService.workspace.name;
      }
    }

    return projectTitle || projectRootUri?.path?.base || 'VUEngine Studio';
  }

  protected async getProjectConfigFileUri(projectRootUri?: URI): Promise<URI | undefined> {
    let workspaceRootUri = undefined;

    if (projectRootUri) {
      workspaceRootUri = projectRootUri;
    } else {
      await this.workspaceService.ready;
      workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    }

    return workspaceRootUri && workspaceRootUri.resolve('config').resolve('Project.json');
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
      const prefDirUri = targetUri.resolve(VES_PREFERENCE_DIR);
      if (await this.fileService.exists(prefDirUri)) {
        await this.fileService.delete(prefDirUri, { recursive: true });
      }
      const githubDirUri = targetUri.resolve('.github');
      if (await this.fileService.exists(githubDirUri)) {
        await this.fileService.delete(githubDirUri, { recursive: true });
      }
      await this.fileService.move(
        targetUri.resolve(`${template.id}.theia-workspace`),
        targetUri.resolve(`${folder}.theia-workspace`),
      );

      // replace labels according to mapping file
      // the first three are most sensitive and should be replaced first
      await this.replaceInProject(targetUri, template.labels['headerName'].substr(0, 20).padEnd(20, ' '), name.substr(0, 20).padEnd(20, ' '));
      const templateGameCode = template.labels['gameCode'].substr(0, 4).padEnd(4, 'X');
      await this.replaceInProject(targetUri,
        `"gameCodeId": "${templateGameCode.substr(1, 2)}",`,
        `"gameCodeId": "${gameCode.substr(0, 2).padEnd(2, 'X')}",`
      );
      await this.replaceInProject(targetUri, `"${templateGameCode}"`, `"${templateGameCode.substr(0, 1)}${gameCode.substr(0, 2).padEnd(2, 'X')}${templateGameCode.substr(3, 1)}"`);
      await this.replaceInProject(targetUri, `"${template.labels['makerCode'].substr(0, 2).padEnd(2, ' ')}"`, `"${makerCode.substr(0, 2).padEnd(2, ' ')}"`);
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
    const basepath = await this.fileService.fsPath(uri);

    if (to && from) {
      return replaceInFiles({
        files: [
          join(basepath, '**', '*.*'),
          join(basepath, '*.*'),
          join(basepath, '*'),
        ],
        from,
        to,
      });
    }
  }
}
