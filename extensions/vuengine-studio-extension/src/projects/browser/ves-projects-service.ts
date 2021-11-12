import { dirname, join as joinPath } from 'path';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { isWindows } from '@theia/core';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VES_PREFERENCE_DIR } from '../../branding/browser/ves-branding-preference-configurations';
import { VesNewProjectTemplate } from './new-project/ves-projects-new-project-form';

const replaceInFiles = require('replace-in-files');

@injectable()
export class VesProjectsService {

  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  // project file change event
  protected readonly onDidChangeProjectFileEmitter = new Emitter<void>();
  readonly onDidChangeProjectFile = this.onDidChangeProjectFileEmitter.event;

  @postConstruct()
  protected async init(): Promise<void> {
    // watch for project config file changes
    const configFileUri = new URI(this.getProjectConfigFilePath());
    this.fileService.onDidFilesChange((fileChangesEvent: FileChangesEvent) => {
      if (fileChangesEvent.contains(configFileUri)) {
        this.onDidChangeProjectFileEmitter.fire();
      }
    });
  }

  async getProjectName(): Promise<string> {
    let projectTitle = '';

    // Attempt to retrieve project name from configuration file
    const projectFileUri = new URI(this.getProjectConfigFilePath());
    if (await this.fileService.exists(projectFileUri)) {
      const configFileContents = await this.fileService.readFile(projectFileUri);
      const projectData = JSON.parse(configFileContents.value.toString());
      if (projectData.name) {
        projectTitle = projectData.name;
      }
    };

    // Get from workspace service
    if (projectTitle === '') {
      const workspace = this.workspaceService.workspace;
      if (workspace !== undefined) {
        if (this.workspaceService.workspace?.isFile) {
          const workspaceParts = workspace.name.split('.');
          workspaceParts.pop();
          projectTitle = workspaceParts.join('.');
        } else {
          projectTitle = workspace.name;
        }
      }
    }

    return projectTitle;
  }

  protected getProjectConfigFilePath(): string {
    return joinPath(this.getWorkspaceRoot(), 'config', 'Project.json');
  }

  getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }

  async createProjectFromTemplate(
    template: VesNewProjectTemplate,
    folder: string,
    path: string,
    name: string,
    gameCode: string,
    author: string,
    makerCode: string
  ): Promise<boolean | string> {
    const templatePath = await this.getTemplateFolder(template.id);
    const templatePathUri = new URI(templatePath);
    const targetPathUri = new URI(path);

    if (await this.fileService.exists(targetPathUri)) {
      return 'Error: path does already exist';
    }

    try {
      // copy template folder to new project location
      await this.fileService.copy(templatePathUri, targetPathUri);

      // modify files and folders
      const prefDirUri = new URI(joinPath(path, VES_PREFERENCE_DIR));
      if (await this.fileService.exists(prefDirUri)) {
        await this.fileService.delete(prefDirUri, { recursive: true });
      }
      const githubDirUri = new URI(joinPath(path, '.github'));
      if (await this.fileService.exists(githubDirUri)) {
        await this.fileService.delete(githubDirUri, { recursive: true });
      }
      await this.fileService.move(
        new URI(joinPath(path, `${template.id}.theia-workspace`)),
        new URI(joinPath(path, `${folder}.theia-workspace`)),
      );

      // replace labels according to mapping file
      // the first three are most sensitive and should be replaced first
      await this.replaceInProject(path, template.labels['headerName'].substr(0, 20).padEnd(20, ' '), name.substr(0, 20).padEnd(20, ' '));
      const templateGameCode = template.labels['gameCode'].substr(0, 4).padEnd(4, 'X');
      await this.replaceInProject(path,
        `"gameCodeId": "${templateGameCode.substr(1, 2)}",`,
        `"gameCodeId": "${gameCode.substr(0, 2).padEnd(2, 'X')}",`
      );
      await this.replaceInProject(path, `"${templateGameCode}"`, `"${templateGameCode.substr(0, 1)}${gameCode.substr(0, 2).padEnd(2, 'X')}${templateGameCode.substr(3, 1)}"`);
      await this.replaceInProject(path, `"${template.labels['makerCode'].substr(0, 2).padEnd(2, ' ')}"`, `"${makerCode.substr(0, 2).padEnd(2, ' ')}"`);
      await this.replaceInProject(path, template.labels['headerName'], name);
      await Promise.all(template.labels['name']?.map(async (value: string) => {
        await this.replaceInProject(path, value, name);
      }));
      await Promise.all(template.labels['authors']?.map(async (value: string) => {
        await this.replaceInProject(path, value, author);
      }));
      await this.replaceInProject(path, template.labels['description'], 'Description');
    } catch (e) {
      return e;
    }

    return true;
  }

  protected async getTemplateFolder(template: string): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return joinPath(applicationPath, 'vuengine', template);
  }

  protected async replaceInProject(path: string, from: string, to: string): Promise<void> {
    if (to && from) {
      return replaceInFiles({
        files: [
          `${path}/**/*.*`,
          `${path}/*.*`,
          `${path}/*`
        ],
        from,
        to,
      });
    }
  }
}
