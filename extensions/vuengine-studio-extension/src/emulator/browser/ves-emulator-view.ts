import { CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorWidget } from './ves-emulator-widget';

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
  protected init(): void {
    this.updateFocusedView();
    this.shell.onDidChangeActiveWidget(() => this.updateFocusedView());
  }

  protected updateFocusedView(): void {
    // emulatorFocus is just a faux context to allow remapping of emulator input,
    // it must never be true, otherwise keydown won't work in emulator
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
      execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'user-guide/emulator', false),
    });

    commandRegistry.registerCommand(VesEmulatorCommands.WIDGET_SETTINGS, {
      isEnabled: () => true,
      isVisible: widget => widget !== undefined &&
        widget.id === VesEmulatorWidget.ID,
      execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'emulator'),
    });
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    toolbar.registerItem({
      id: VesEmulatorCommands.WIDGET_HELP.id,
      command: VesEmulatorCommands.WIDGET_HELP.id,
      tooltip: VesEmulatorCommands.WIDGET_HELP.label,
      priority: 1,
    });
    toolbar.registerItem({
      id: VesEmulatorCommands.WIDGET_SETTINGS.id,
      command: VesEmulatorCommands.WIDGET_SETTINGS.id,
      tooltip: VesEmulatorCommands.WIDGET_SETTINGS.label,
      priority: 0,
    });
  }
}
