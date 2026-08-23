import { CommandContribution, CommandRegistry, CommandService, nls, QuickPickItemOrSeparator, QuickPickService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { TabBar, Widget } from '@theia/core/shared/@lumino/widgets';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { EMULATOR_PANEL_LABELS, EmulatorPanelType } from './panels/ves-emulator-panel';
import { EmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorWidget } from './ves-emulator-widget';

@injectable()
export class VesEmulatorViewContribution extends AbstractViewContribution<VesEmulatorWidget> implements CommandContribution, TabBarToolbarContribution {
  @inject(CommandService)
  private readonly commandService!: CommandService;
  @inject(QuickPickService)
  protected readonly quickPickService!: QuickPickService;
  @inject(VesEmulatorContextKeyService)
  protected readonly contextKeyService!: VesEmulatorContextKeyService;

  constructor() {
    super({
      widgetId: VesEmulatorWidget.ID,
      widgetName: VesEmulatorWidget.LABEL,
      defaultWidgetOptions: {
        area: 'main',
        rank: 300,
      },
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
    commandRegistry.registerCommand(EmulatorCommands.ADD_PANEL, {
      isEnabled: widget => widget instanceof VesEmulatorWidget,
      isVisible: widget => widget instanceof VesEmulatorWidget,
      // The tab group whose "+" was pressed, when that is where the command
      // came from. Without one the panel opens beside the screen, as before.
      execute: (widget, target?: TabBar<Widget>) => {
        if (widget instanceof VesEmulatorWidget) {
          this.pickPanel(widget, target);
        }
      },
    });
    commandRegistry.registerCommand(EmulatorCommands.RESET_LAYOUT, {
      isEnabled: widget => widget instanceof VesEmulatorWidget,
      isVisible: widget => widget instanceof VesEmulatorWidget,
      execute: widget => {
        if (widget instanceof VesEmulatorWidget) {
          widget.resetLayout();
        }
      },
    });

    commandRegistry.registerCommand(EmulatorCommands.WIDGET_HELP, {
      isEnabled: () => true,
      isVisible: widget => widget instanceof VesEmulatorWidget,
      execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/emulator', false),
    });
    commandRegistry.registerCommand(EmulatorCommands.WIDGET_SETTINGS, {
      isEnabled: () => true,
      isVisible: widget => widget instanceof VesEmulatorWidget,
      execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'Emulator'),
    });
  }

  protected async pickPanel(widget: VesEmulatorWidget, target?: TabBar<Widget>): Promise<void> {
    const available: QuickPickItemOrSeparator[] = [];
    const open: QuickPickItemOrSeparator[] = [];
    // Picking an already-open panel focuses it where it is — unless the pick
    // started from a tab group's "+", which moves it into that group instead.
    const openDescription = target
      ? nls.localize('vuengine/emulator/panels/moveHere', 'Move here')
      : nls.localize('vuengine/emulator/panels/alreadyOpen', 'Already open');
    Object.keys(EMULATOR_PANEL_LABELS)
      .filter(panelType => panelType !== EmulatorPanelType.SCREEN)
      // By label, not by key: the keys are an implementation detail, and the
      // labels are localized, so which order reads as alphabetical depends on
      // the language the list is being shown in. Sorting here rather than per
      // group orders both of them, since they are filled in this one pass.
      .sort((a, b) => EMULATOR_PANEL_LABELS[a as EmulatorPanelType]
        .localeCompare(EMULATOR_PANEL_LABELS[b as EmulatorPanelType]))
      .forEach(panelType => {
        const item = {
          id: panelType,
          label: EMULATOR_PANEL_LABELS[panelType as EmulatorPanelType]
        };
        if (widget.isPanelOpen(panelType as EmulatorPanelType)) {
          open.push({ ...item, description: openDescription });
        } else {
          available.push(item);
        }
      });

    if (open.length > 0) {
      available.push(
        {
          type: 'separator',
          label: nls.localize('vuengine/emulator/panels/alreadyOpenGroup', 'Already open')
        },
        ...open
      );
    }

    const selected = await this.quickPickService.show(available, {
      placeholder: nls.localize('vuengine/emulator/panels/addPanelPlaceholder', 'Select a panel to open…'),
    });
    if (selected?.id) {
      const kind = selected.id as EmulatorPanelType;
      if (target) {
        widget.addPanelTo(kind, target);
      } else {
        widget.togglePanel(kind);
      }
    }
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    toolbar.registerItem({
      id: EmulatorCommands.RESET_LAYOUT.id,
      command: EmulatorCommands.RESET_LAYOUT.id,
      tooltip: EmulatorCommands.RESET_LAYOUT.label,
      priority: 3,
    });
    toolbar.registerItem({
      id: EmulatorCommands.WIDGET_HELP.id,
      command: EmulatorCommands.WIDGET_HELP.id,
      tooltip: EmulatorCommands.WIDGET_HELP.label,
      priority: 2,
    });
    toolbar.registerItem({
      id: EmulatorCommands.WIDGET_SETTINGS.id,
      command: EmulatorCommands.WIDGET_SETTINGS.id,
      tooltip: EmulatorCommands.WIDGET_SETTINGS.label,
      priority: 0,
    });
  }
}
