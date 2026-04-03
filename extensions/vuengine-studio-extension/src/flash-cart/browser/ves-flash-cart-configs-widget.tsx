import { CommandService, nls, PreferenceService } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import FlashCartConfigs from './components/FlashCartConfigs';
import { VesFlashCartService } from './ves-flash-cart-service';

@injectable()
export class FlashCartConfigsWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesFlashCartService)
  private readonly vesFlashCartService: VesFlashCartService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'flashCartConfigsWidget';
  static readonly LABEL = nls.localize(
    'vuengine/flashCarts/flashCartConfigurations',
    'Flash Cart Configurations'
  );

  @postConstruct()
  protected init(): void {
    this.id = FlashCartConfigsWidget.ID;
    this.title.iconClass = 'codicon codicon-multiple-windows codicon-rotate-180';
    this.title.closable = false;
    this.title.label = FlashCartConfigsWidget.LABEL;
    this.title.caption = FlashCartConfigsWidget.LABEL;
    this.title.className = '';

    this.update();
  }

  protected render(): React.ReactNode {
    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : (
        <FlashCartConfigs
          fileService={this.fileService}
          fileDialogService={this.fileDialogService}
          preferenceService={this.preferenceService}
          vesFlashCartService={this.vesFlashCartService}
        />
      );
  }
}
