import { CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { EmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorWidget } from './ves-emulator-widget';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';

@injectable()
export class VesEmulatorViewContribution extends AbstractViewContribution<VesEmulatorWidget> implements CommandContribution, TabBarToolbarContribution {
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
    commandRegistry.registerCommand(EmulatorCommands.WIDGET_HELP, {
      isEnabled: () => true,
      isVisible: widget => widget?.id === VesEmulatorWidget.ID,
      execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/emulator', false),
    });
    commandRegistry.registerCommand(EmulatorCommands.WIDGET_KEYBINDINGS, {
      isEnabled: () => true,
      isVisible: widget => widget?.id === VesEmulatorWidget.ID,
      execute: () => this.commandService.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id, 'Emulator'),
    });
    commandRegistry.registerCommand(EmulatorCommands.WIDGET_SETTINGS, {
      isEnabled: () => true,
      isVisible: widget => widget?.id === VesEmulatorWidget.ID,
      execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'Emulator'),
    });
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    toolbar.registerItem({
      id: EmulatorCommands.WIDGET_HELP.id,
      command: EmulatorCommands.WIDGET_HELP.id,
      tooltip: EmulatorCommands.WIDGET_HELP.label,
      priority: 2,
    });
    toolbar.registerItem({
      id: EmulatorCommands.WIDGET_KEYBINDINGS.id,
      command: EmulatorCommands.WIDGET_KEYBINDINGS.id,
      tooltip: EmulatorCommands.WIDGET_KEYBINDINGS.label,
      priority: 1,
    });
    toolbar.registerItem({
      id: EmulatorCommands.WIDGET_SETTINGS.id,
      command: EmulatorCommands.WIDGET_SETTINGS.id,
      tooltip: EmulatorCommands.WIDGET_SETTINGS.label,
      priority: 0,
    });
  }
}
