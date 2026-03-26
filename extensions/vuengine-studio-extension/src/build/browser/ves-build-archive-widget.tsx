import { CommandService, nls, PreferenceService } from '@theia/core';
import { ConfirmDialog, HoverService, OpenerService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import BuildArchive from './components/BuildArchive';
import { VesBuildService } from './ves-build-service';

@injectable()
export class VesBuildArchiveWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(HoverService)
  private readonly hoverService: HoverService;
  @inject(OpenerService)
  private readonly openerService: OpenerService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'vesBuildArchiveWidget';
  static readonly LABEL = nls.localize('vuengine/build/buildArchive', 'Build Archive');

  protected archiveFiles: string[] = [];

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();
    this.id = VesBuildArchiveWidget.ID;
    this.title.iconClass = 'codicon codicon-archive';
    this.title.closable = false;
    this.title.label = VesBuildArchiveWidget.LABEL;
    this.title.caption = VesBuildArchiveWidget.LABEL;
    this.title.className = '';

    this.update();
  }

  protected async doInit(): Promise<void> {
    await this.getArchivedFiles();

    this.update();
  }

  protected async bindEvents(): Promise<void> {
    const archiveFolderUri = await this.vesBuildService.getBuildArchiveUri();
    if (!archiveFolderUri) {
      return;
    }
    this.toDispose.pushAll([
      this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
        fileChangesEvent.changes.map(change => {
          if (archiveFolderUri.isEqualOrParent(change.resource)) {
            this.getArchivedFiles();
          }
        });
      }),
    ]);
  }

  protected getArchivedFiles = async () => {
    this.archiveFiles = await this.vesBuildService.getBuildArchiveFiles();
    this.update();
  };

  clearArchive = async () => {
    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/build/cleanBuildArchive', 'Clean Build Archive'),
      msg: nls.localize('vuengine/build/areYouSureYouWantToCleanBuildArchive', 'Are you sure you want to remove all archived ROMs?'),
    });
    const confirmed = await dialog.open();
    if (confirmed) {
      const archiveFolderUri = await this.vesBuildService.getBuildArchiveUri();
      if (!archiveFolderUri) {
        return;
      }

      return this.fileService.delete(archiveFolderUri, { recursive: true });
    }
  };

  protected render(): React.ReactNode {
    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : (
        <BuildArchive
          archiveFiles={this.archiveFiles}
          fileService={this.fileService}
          hoverService={this.hoverService}
          openerService={this.openerService}
          preferenceService={this.preferenceService}
          vesBuildService={this.vesBuildService}
        />
      );
  }
}
