import { dirname, join as joinPath } from 'path';
import { homedir } from 'os';
import sanitize = require('sanitize-filename');
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ApplicationShell, CommonCommands, ConfirmDialog, PreferenceService } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { CommandService, environment, isWindows } from '@theia/core';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileDialogService, SaveFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';

@injectable()
export class VesExportService {
  constructor(
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell,
    @inject(CommandService)
    protected readonly commandService: CommandService,
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService,
    @inject(FileService)
    protected readonly fileService: FileService,
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService,
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService,
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService,
    @inject(VesProjectsService)
    protected readonly vesProjectsService: VesProjectsService,
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService,
  ) { }

  // is queued
  protected _isQueued: boolean = false;
  protected readonly onDidChangeIsQueuedEmitter = new Emitter<boolean>();
  readonly onDidChangeIsQueued = this.onDidChangeIsQueuedEmitter
    .event;
  set isQueued(flag: boolean) {
    this._isQueued = flag;
    this.onDidChangeIsQueuedEmitter.fire(this._isQueued);
  }
  get isQueued(): boolean {
    return this._isQueued;
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.bindEvents();
  }

  bindEvents(): void {
    this.vesBuildService.onDidChangeOutputRomExists(outputRomExists => {
      if (outputRomExists && this.isQueued) {
        this.isQueued = false;
        this.exportRom();
      }
    });
  }

  async doExport(): Promise<void> {
    if (this.isQueued) {
      this.isQueued = false;
    } else if (this.vesBuildService.buildStatus.active) {
      this.isQueued = true;
    } else if (this.vesBuildService.outputRomExists) {
      this.exportRom();
    } else {
      this.isQueued = true;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id);
    }
  }

  protected async exportRom(): Promise<void> {
    const romPath = this.getRomPath();
    const romUri = new URI(romPath);
    let exists: boolean = false;
    let overwrite: boolean = false;
    let selected: URI | undefined;
    const saveFilterDialogProps: SaveFileDialogProps = {
      title: 'Export ROM',
      inputValue: await this.getRomName(),
    };
    const romStat = await this.fileService.resolve(new URI(homedir()));
    do {
      selected = await this.fileDialogService.showSaveDialog(
        saveFilterDialogProps,
        romStat
      );
      if (selected) {
        exists = await this.fileService.exists(selected);
        if (exists) {
          overwrite = await this.confirmOverwrite(selected);
        }
      }
    } while (selected && exists && !overwrite);
    if (selected) {
      try {
        await this.commandService.executeCommand(CommonCommands.SAVE.id);
        await this.fileService.copy(romUri, selected, { overwrite });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  protected async confirmOverwrite(uri: URI): Promise<boolean> {
    if (environment.electron.is()) {
      return true;
    }
    const confirmed = await new ConfirmDialog({
      title: 'Overwrite',
      msg: `Do you really want to overwrite '${uri.toString()}'?`,
    }).open();
    return !!confirmed;
  }

  protected async getRomName(): Promise<string> {
    const projectName = await this.vesProjectsService.getProjectName();
    const romName = projectName ?? 'output';
    return `${sanitize(romName)}.vb`;
  }

  getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }

  getRomPath(): string {
    return joinPath(this.getWorkspaceRoot(), 'build', 'output.vb');
  }
}