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
    // Every action the emulator can perform, registered once and reached the
    // same way from the toolbar, a key mapping and the command palette. The
    // widget they act on is the current one rather than an argument, which is
    // what makes them work from the palette — a palette invocation passes
    // nothing, so a handler that waited for a widget argument would be
    // permanently disabled and never listed.
    EMULATOR_ACTIONS.forEach(action => {
      commandRegistry.registerCommand(EMULATOR_ACTION_COMMANDS[action], {
        isEnabled: () => this.currentEmulator()?.canRunAction(action) ?? false,
        isVisible: () => this.currentEmulator() !== undefined,
        execute: () => this.currentEmulator()?.performAction(action),
      });
    });

    // Profiling. Only one of the two applies at any moment, so only one is
    // offered — the same reasoning as the link commands below.
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

    // The link cable. At most one of these applies at a time — a pair is
    // linked, or paired but running apart, or neither — so each is offered
    // only in the state it belongs to rather than listed and greyed out.
    commandRegistry.registerCommand(EmulatorCommands.LINK_SECOND_PLAYER, {
      isEnabled: () => this.canLink(),
      isVisible: () => this.canLink(),
      execute: () => {
        const emulator = this.currentEmulator();
        if (emulator) {
          this.vesEmulatorService.linkSecondPlayer(emulator);
        }
      },
    });
    commandRegistry.registerCommand(EmulatorCommands.UNLINK_PLAYERS, {
      isEnabled: () => this.currentEmulator()?.isLinked() ?? false,
      isVisible: () => this.currentEmulator()?.isLinked() ?? false,
      execute: () => {
        const emulator = this.currentEmulator();
        if (emulator) {
          this.vesEmulatorService.unlinkPlayers(emulator);
        }
      },
    });
    commandRegistry.registerCommand(EmulatorCommands.RELINK_PLAYERS, {
      isEnabled: () => this.canRelink(),
      isVisible: () => this.canRelink(),
      execute: () => {
        const emulator = this.currentEmulator();
        if (emulator) {
          this.vesEmulatorService.relinkPlayers(emulator);
        }
      },
    });

    // Enabled whenever a ROM is loaded rather than through canRunAction: this
    // is not one of the actions, and it asks for confirmation before doing
    // anything, so the states that gate those do not apply to it.
    commandRegistry.registerCommand(EmulatorCommands.DELETE_SRAM, {
      isEnabled: () => this.currentEmulator() !== undefined,
      isVisible: () => this.currentEmulator() !== undefined,
      execute: () => this.currentEmulator()?.deleteSramAndRestart(),
    });

    commandRegistry.registerCommand(EmulatorCommands.ADD_PANEL, {
      isEnabled: widget => this.emulatorFor(widget) !== undefined,
      isVisible: widget => this.emulatorFor(widget) !== undefined,
      // The tab group whose "+" was pressed, when that is where the command
      // came from. Without one the panel opens beside the screen, as before.
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

  /** Whether an emulator is loaded and is, or is not, already recording. */
  protected canProfile(recording: boolean): boolean {
    const emulator = this.currentEmulator();
    return emulator !== undefined && emulator.isLoaded()
      && emulator.isProfiling() === recording;
  }

  /** A second player can be opened: nothing is paired with this one yet. */
  protected canLink(): boolean {
    const emulator = this.currentEmulator();
    return emulator !== undefined && emulator.isLoaded()
      && !emulator.isLinked() && emulator.getLinkedPeer() === undefined;
  }

  /** A pair exists but is running apart, so it can be joined up again. */
  protected canRelink(): boolean {
    const emulator = this.currentEmulator();
    return emulator !== undefined && emulator.isLoaded()
      && !emulator.isLinked() && emulator.getLinkedPeer() !== undefined;
  }

  /**
   * The emulator a command is about: the one it was handed, or the current one.
   *
   * A command invoked from a tab bar or a context menu arrives with its widget;
   * one invoked from the palette arrives with nothing, and has to find it.
   */
  protected emulatorFor(widget: unknown): VesEmulatorWidget | undefined {
    return widget instanceof VesEmulatorWidget ? widget : this.currentEmulator();
  }

  /**
   * The emulator the user is working in, if any.
   *
   * `activeWidget` is empty while the palette itself has focus, so the widget
   * that had it before is what these commands act on.
   */
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
    // Picking an already-open panel focuses it where it is — unless the pick
    // started from a tab group's "+", which moves it into that group instead.
    const openDescription = target
      ? nls.localize('vuengine/emulator/panels/moveHere', 'Move here')
      : nls.localize('vuengine/emulator/panels/alreadyOpen', 'Already open');
    EMULATOR_PANEL_TYPES
      .filter(panelType => panelType !== EmulatorPanelType.SCREEN)
      // By label, not by key: the keys are an implementation detail, and the
      // labels are localized, so which order reads as alphabetical depends on
      // the language the list is being shown in. Sorting here rather than per
      // group orders both of them, since they are filled in this one pass.
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
