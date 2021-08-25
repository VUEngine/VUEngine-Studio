import { dirname, join as joinPath } from 'path';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { isWindows } from '@theia/core';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';

@injectable()
export class VesProjectsService {
  constructor(
    @inject(FileService)
    protected fileService: FileService,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
  ) { }

  // build mode
  protected readonly onDidChangeProjectFileEmitter = new Emitter<void>();
  readonly onDidChangeProjectFile = this.onDidChangeProjectFileEmitter.event;

  @postConstruct()
  protected async init(): Promise<void> {
    // watch for project config file changes
    // TODO: watch only respective file?
    this.fileService.onDidFilesChange((fileChangesEvent: FileChangesEvent) => {
      if (fileChangesEvent.contains(new URI(this.getProjectConfigFilePath()))) {
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
    return joinPath(this.getWorkspaceRoot(), 'Project.config');
  }

  getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }
}
