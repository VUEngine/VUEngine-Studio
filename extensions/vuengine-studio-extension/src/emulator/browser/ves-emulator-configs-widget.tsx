import { CommandService, nls, PreferenceService } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import EmulatorConfigs from './components/EmulatorConfigs';

@injectable()
export class EmulatorConfigsWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'emulatorConfigsWidget';
  static readonly LABEL = nls.localize(
    'vuengine/emulator/emulatorConfigurations',
    'Emulator Configurations'
  );

  @postConstruct()
  protected init(): void {
    this.id = EmulatorConfigsWidget.ID;
    this.title.iconClass = 'codicon codicon-run-all';
    this.title.closable = false;
    this.title.label = EmulatorConfigsWidget.LABEL;
    this.title.caption = EmulatorConfigsWidget.LABEL;
    this.title.className = '';

    this.update();
  }

  protected render(): React.ReactNode {
    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : (
        <EmulatorConfigs
          commandService={this.commandService}
          fileService={this.fileService}
          fileDialogService={this.fileDialogService}
          preferenceService={this.preferenceService}
        />
      );
  }
}
