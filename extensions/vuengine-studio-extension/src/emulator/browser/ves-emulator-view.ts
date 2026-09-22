import { TabBar, Widget } from '@lumino/widgets';
import { CommandContribution, CommandRegistry, CommandService, nls, QuickPickItemOrSeparator, QuickPickService } from '@theia/core';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EMULATOR_ACTION_COMMANDS, EMULATOR_ACTIONS, EmulatorCommands } from 'vueport-core/lib/browser/emulator-commands';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { EMULATOR_PANEL_TYPES, emulatorPanelLabel, EmulatorPanelType } from 'vueport-core/lib/browser/panels/emulator-panel';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorWidget } from './ves-emulator-widget';

@injectable()
export class VesEmulatorViewContribution extends AbstractViewContribution<VesEmulatorWidget> implements CommandContribution, TabBarToolbarContribution {
  @inject(CommandService)
  private readonly commandService!: CommandService;
  @inject(QuickPickService)
  protected readonly quickPickService!: QuickPickService;
  @inject(VesEmulatorContextKeyService)
  protected readonly contextKeyService!: VesEmulatorContextKeyService;
  @inject(VesEmulatorService)
  protected readonly vesEmulatorService!: VesEmulatorService;

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
    EMULATOR_ACTIONS.forEach(action => {
      commandRegistry.registerCommand(EMULATOR_ACTION_COMMANDS[action], {
        isEnabled: () => this.currentEmulator()?.canRunAction(action) ?? false,
        isVisible: () => this.currentEmulator() !== undefined,
        execute: () => this.currentEmulator()?.performAction(action),
      });
    });

    commandRegistry.registerCommand(EmulatorCommands.PROFILE_START, {
      isEnabled: () => this.canProfile(false),
      isVisible: () => this.canProfile(false),
      execute: () => this.currentEmulator()?.startProfiling(),
    });
    commandRegistry.registerCommand(EmulatorCommands.PROFILE_STOP, {
      isEnabled: () => this.canProfile(true),
      isVisible: () => this.canProfile(true),
      execute: () => this.currentEmulator()?.stopProfiling(),
    });

    commandRegistry.registerCommand(EmulatorCommands.LINK_SECOND_PLAYER, {
      isEnabled: (widget?: unknown) => this.canLink(this.emulatorFor(widget)),
      isVisible: (widget?: unknown) => this.canLink(this.emulatorFor(widget)),
      execute: (widget?: unknown) => {
        const emulator = this.emulatorFor(widget);
        if (emulator) {
          this.vesEmulatorService.linkSecondPlayer(emulator);
        }
      },
    });
    commandRegistry.registerCommand(EmulatorCommands.UNLINK_PLAYERS, {
      isEnabled: (widget?: unknown) => this.emulatorFor(widget)?.isLinked() ?? false,
      isVisible: (widget?: unknown) => this.emulatorFor(widget)?.isLinked() ?? false,
      execute: (widget?: unknown) => {
        const emulator = this.emulatorFor(widget);
        if (emulator) {
          this.vesEmulatorService.unlinkPlayers(emulator);
        }
      },
    });
    commandRegistry.registerCommand(EmulatorCommands.RELINK_PLAYERS, {
      isEnabled: (widget?: unknown) => this.canRelink(this.emulatorFor(widget)),
      isVisible: (widget?: unknown) => this.canRelink(this.emulatorFor(widget)),
      execute: (widget?: unknown) => {
        const emulator = this.emulatorFor(widget);
        if (emulator) {
          this.vesEmulatorService.relinkPlayers(emulator);
        }
      },
    });

    commandRegistry.registerCommand(EmulatorCommands.DELETE_SRAM, {
      isEnabled: () => this.currentEmulator() !== undefined,
      isVisible: () => this.currentEmulator() !== undefined,
      execute: () => this.currentEmulator()?.deleteSramAndRestart(),
    });

    commandRegistry.registerCommand(EmulatorCommands.ADD_PANEL, {
      isEnabled: widget => this.emulatorFor(widget) !== undefined,
      isVisible: widget => this.emulatorFor(widget) !== undefined,
      execute: (widget, target?: TabBar<Widget>) => {
        const emulator = this.emulatorFor(widget);
        if (emulator) {
          this.pickPanel(emulator, target);
        }
      },
    });
    commandRegistry.registerCommand(EmulatorCommands.RESET_LAYOUT, {
      isEnabled: widget => this.emulatorFor(widget) !== undefined,
      isVisible: widget => this.emulatorFor(widget) !== undefined,
      execute: widget => this.emulatorFor(widget)?.resetLayout(),
    });

    commandRegistry.registerCommand(VesEmulatorCommands.WIDGET_HELP, {
      isEnabled: () => true,
      isVisible: widget => this.emulatorFor(widget) !== undefined,
      execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/emulator', false),
    });
  }

  protected canProfile(recording: boolean): boolean {
    const emulator = this.currentEmulator();
    return emulator !== undefined && emulator.isLoaded()
      && emulator.isProfiling() === recording;
  }

  protected canLink(emulator = this.currentEmulator()): boolean {
    return emulator !== undefined && emulator.isLoaded()
      && !emulator.isLinked() && emulator.getLinkedPeer() === undefined;
  }

  protected canRelink(emulator = this.currentEmulator()): boolean {
    return emulator !== undefined && emulator.isLoaded()
      && !emulator.isLinked() && emulator.getLinkedPeer() !== undefined;
  }

  protected emulatorFor(widget: unknown): VesEmulatorWidget | undefined {
    return widget instanceof VesEmulatorWidget ? widget : this.currentEmulator();
  }

  protected currentEmulator(): VesEmulatorWidget | undefined {
    for (const candidate of [this.shell.activeWidget, this.shell.currentWidget]) {
      if (candidate instanceof VesEmulatorWidget) {
        return candidate;
      }
    }
    return undefined;
  }

  protected async pickPanel(widget: VesEmulatorWidget, target?: TabBar<Widget>): Promise<void> {
    const available: QuickPickItemOrSeparator[] = [];
    const open: QuickPickItemOrSeparator[] = [];
    const openDescription = target
      ? nls.localize('vuengine/emulator/panels/moveHere', 'Move here')
      : nls.localize('vuengine/emulator/panels/alreadyOpen', 'Already open');
    EMULATOR_PANEL_TYPES
      .filter(panelType => panelType !== EmulatorPanelType.SCREEN)
      .sort((a, b) => emulatorPanelLabel(a as EmulatorPanelType)
        .localeCompare(emulatorPanelLabel(b as EmulatorPanelType)))
      .forEach(panelType => {
        const item = {
          id: panelType,
          label: emulatorPanelLabel(panelType as EmulatorPanelType)
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
      id: VesEmulatorCommands.WIDGET_HELP.id,
      command: VesEmulatorCommands.WIDGET_HELP.id,
      tooltip: VesEmulatorCommands.WIDGET_HELP.label,
      priority: 2,
    });
  }
}
