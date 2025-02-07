import { CommandService, environment, nls } from '@theia/core';
import { ApplicationShell, CommonCommands, ConfirmDialog, PreferenceService } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileDialogService, SaveFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import sanitize = require('sanitize-filename');

@injectable()
export class VesExportService {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;
  @inject(FileDialogService)
  protected readonly fileDialogService: FileDialogService;
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(FrontendApplicationStateService)
  protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  protected readonly vesBuildService: VesBuildService;
  @inject(VesProjectService)
  protected readonly vesProjectsService: VesProjectService;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  // is queued
  protected _isQueued: boolean = false;
  protected readonly onDidChangeIsQueuedEmitter = new Emitter<boolean>();
  readonly onDidChangeIsQueued = this.onDidChangeIsQueuedEmitter.event;
  set isQueued(flag: boolean) {
    this._isQueued = flag;
    this.onDidChangeIsQueuedEmitter.fire(this._isQueued);
  }
  get isQueued(): boolean {
    return this._isQueued;
  }

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  bindEvents(): void {
    this.vesBuildService.onDidSucceedBuild(async () => {
      if (await this.vesBuildService.outputRomExists() && this.isQueued) {
        this.isQueued = false;
        await this.exportRom();
      }
    });
    this.vesBuildService.onDidFailBuild(() => {
      this.isQueued = false;
    });
  }

  async doExport(): Promise<void> {
    if (this.isQueued) {
      this.isQueued = false;
    } else if (this.vesBuildService.buildStatus.active) {
      this.isQueued = true;
    } else if (await this.vesBuildService.outputRomExists()) {
      await this.exportRom();
    } else {
      this.isQueued = true;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id, true);
    }
  }

  protected async exportRom(): Promise<void> {
    const romUri = await this.vesBuildService.getDefaultRomUri();
    let exists: boolean = false;
    let overwrite: boolean = false;
    let selected: URI | undefined;
    const saveFilterDialogProps: SaveFileDialogProps = {
      title: nls.localize('vuengine/export/exportRom', 'Export ROM'),
      inputValue: await this.getRomName(),
    };
    const homedir = await this.envVariablesServer.getHomeDirUri();
    const romStat = await this.fileService.resolve(new URI(homedir).withScheme('file'));
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
    // We only need this in browsers. Electron brings up the OS-level confirmation dialog instead.
    if (environment.electron.is()) {
      return true;
    }
    const confirmed = await new ConfirmDialog({
      title: nls.localize('vuengine/export/overwrite', 'Overwrite'),
      msg: nls.localize('vuengine/export/doYouReallyWantToOverwrite', 'Do you really want to overwrite "{0}"?', uri.path.fsPath()),
    }).open();
    return !!confirmed;
  }

  protected async getRomName(): Promise<string> {
    const projectName = await this.vesProjectsService.getProjectName();
    const romName = projectName ?? 'output';

    return `${sanitize(romName)}.vb`;
  }
}
