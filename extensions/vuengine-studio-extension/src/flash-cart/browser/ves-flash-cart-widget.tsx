import { CommandService, nls } from '@theia/core';
import { LocalStorageService, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
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
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService;
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
    this.title.iconClass = 'codicon codicon-multiple-windows codicon-rotate-180';
    this.title.closable = false;
    this.setTitle();
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
      this.setTitle();
      this.update();
    });
    this.vesFlashCartService.onDidChangeIsFlashing(() => this.update());
    this.vesFlashCartService.onDidChangeIsQueued(isQueued => {
      this.title.className = isQueued ? 'ves-decorator-queued' : '';
      this.update();
    });
    this.vesFlashCartService.onDidChangeFlashingProgress(() => {
      this.handleProgressDecorator();
      this.update();
    });
    this.onDidChangeVisibility(() => {
      this.handleProgressDecorator();
    });
    this.vesFlashCartService.onDidChangeAtLeastOneCanHoldRom(() => this.update());
    this.vesFlashCartService.onDidSucceedFlashing(() => this.title.className = 'ves-decorator-success');
    this.vesFlashCartService.onDidFailFlashing(() => this.title.className = 'ves-decorator-error');
    this.vesBuildService.onDidChangeLastBuildMode(() => this.update());
  }

  protected setTitle(): void {
    const count = this.vesFlashCartService.connectedFlashCarts.length;
    this.title.label = `${nls.localize('vuengine/flashCarts/connectedFlashCarts', 'Connected Flash Carts')}: ${count}`;
    this.title.caption = this.title.label;
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected handleProgressDecorator(): void {
    if (this.vesFlashCartService.isFlashing) {
      this.title.className = this.isVisible
        ? 'ves-decorator-progress'
        : `ves-decorator-progress ves-decorator-progress-${this.vesFlashCartService.flashingProgress}`;
    }
  }

  protected render(): React.ReactNode {
    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : <FlashCarts
        commandService={this.commandService}
        fileService={this.fileService}
        fileDialogService={this.fileDialogService}
        preferenceService={this.preferenceService}
        vesBuildService={this.vesBuildService}
        vesCommonService={this.vesCommonService}
        vesFlashCartService={this.vesFlashCartService}
        workspaceService={this.workspaceService}
      />;
  }
}
