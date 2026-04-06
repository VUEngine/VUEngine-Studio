import { CommandService, nls, PreferenceService } from '@theia/core';
import { LocalStorageService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@lumino/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesBuildService } from '../../build/browser/ves-build-service';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import FlashCarts from './components/FlashCarts';
import { VesFlashCartService } from './ves-flash-cart-service';

@injectable()
export class VesFlashCartWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(VesFlashCartService)
  private readonly vesFlashCartService: VesFlashCartService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'vesFlashCartWidget';
  static readonly LABEL = nls.localize('vuengine/flashCarts/flashCarts', 'Flash Carts');

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.id = VesFlashCartWidget.ID;
    this.title.iconClass = 'codicon codicon-chip';
    this.title.closable = false;
    this.title.label = VesFlashCartWidget.LABEL;
    this.title.caption = VesFlashCartWidget.LABEL;

    this.bindEvents();
    this.update();
  }

  protected async doInit(): Promise<void> {
    await this.vesBuildService.ready;
    this.update();
  }

  protected bindEvents(): void {
    this.workspaceService.onDidChangeRoots((isCollaboration: boolean) => {
      if (isCollaboration) {
        this.update();
      }
    });
    this.vesFlashCartService.onDidChangeConnectedFlashCarts(() => {
      this.update();
    });
    this.vesFlashCartService.onDidChangeIsFlashing(() => this.update());
    this.vesFlashCartService.onDidChangeIsQueued(isQueued => {
      this.update();
    });
    this.vesFlashCartService.onDidChangeFlashingProgress(() => {
      this.update();
    });
    this.vesFlashCartService.onDidChangeAtLeastOneCanHoldRom(() => this.update());
    this.vesBuildService.onDidChangeLastBuildMode(() => this.update());
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : <FlashCarts
        commandService={this.commandService}
        preferenceService={this.preferenceService}
        vesBuildService={this.vesBuildService}
        vesCommonService={this.vesCommonService}
        vesFlashCartService={this.vesFlashCartService}
        workspaceService={this.workspaceService}
      />;
  }
}
