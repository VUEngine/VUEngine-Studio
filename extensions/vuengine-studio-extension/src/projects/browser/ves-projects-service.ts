import { dirname, join as joinPath } from 'path';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { isWindows } from '@theia/core';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';

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

  async createProjectFromTemplate(templateId: string, path: string, name: string, author: string, makerCode: string): Promise<boolean | string> {
    const templatePath = await this.getTemplateFolder(templateId);
    const templatePathUri = new URI(templatePath);
    const targetPathUri = new URI(path);

    if (await this.fileService.exists(targetPathUri)) {
      return 'Error: path does already exist';
    }

    try {
      // copy template folder to new project location
      await this.fileService.copy(templatePathUri, targetPathUri);

      // read template fields mapping
      const templateLabelMappingFileURI = new URI(joinPath(path, '.vuengine-studio', 'templateLabelMapping.json'));
      const templateLabelMappingFileContents = await this.fileService.readFile(templateLabelMappingFileURI);
      const templateLabelMapping = JSON.parse(templateLabelMappingFileContents.value.toString());

      // delete unwanted files and folders
      // await this.fileService.delete(templateLabelMappingFileURI);
      await this.fileService.delete(new URI(joinPath(path, '.vuengine-studio')), { recursive: true });
      await this.fileService.delete(new URI(joinPath(path, '.github')), { recursive: true });

      // replace labels according to mapping file
      await Promise.all(templateLabelMapping['name']?.map(async (value: string) => {
        await this.replaceInProject(path, value, name);
      }));
      await Promise.all(templateLabelMapping['authors']?.map(async (value: string) => {
        await this.replaceInProject(path, value, author);
      }));
      await this.replaceInProject(path, templateLabelMapping['headerName'].padEnd(20, ' '), name.padEnd(20, ' '));
      await this.replaceInProject(path, templateLabelMapping['headerName'], name);
      await this.replaceInProject(path, `"${templateLabelMapping['makerCode']}"`, `"${makerCode.padEnd(2, ' ')}"`);
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
