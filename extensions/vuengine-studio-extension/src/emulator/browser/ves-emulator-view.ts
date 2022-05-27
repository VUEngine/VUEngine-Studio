import { CommandRegistry, CommandService } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { VesEmulatorWidget } from './widget/ves-emulator-widget';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesEmulatorCommands } from './ves-emulator-commands';

@injectable()
export class VesEmulatorViewContribution extends AbstractViewContribution<VesEmulatorWidget> implements TabBarToolbarContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(VesEmulatorContextKeyService)
  protected readonly contextKeyService: VesEmulatorContextKeyService;

  constructor() {
    super({
      widgetId: VesEmulatorWidget.ID,
      widgetName: VesEmulatorWidget.LABEL,
      defaultWidgetOptions: { area: 'main' },
    });
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.updateFocusedView();
    this.shell.onDidChangeActiveWidget(() => this.updateFocusedView());
  }

  protected updateFocusedView(): void {
    // emulatorFocus is just a faux context to allow remapping of emulator input,
    // it should never be true, otherwise keydown won't work in emulator
    /* this.contextKeyService.emulatorFocus.set(
      this.shell.activeWidget instanceof VesEmulatorWidget
    );*/
  }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesEmulatorCommands.WIDGET_HELP, {
      isEnabled: () => true,
      isVisible: widget => widget !== undefined &&
        widget.id !== undefined &&
        widget.id === VesEmulatorWidget.ID,
      execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/emulator', false),
    });
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    toolbar.registerItem({
      id: VesEmulatorCommands.WIDGET_HELP.id,
      command: VesEmulatorCommands.WIDGET_HELP.id,
      tooltip: VesEmulatorCommands.WIDGET_HELP.label,
      priority: 0,
    });
  }
}
