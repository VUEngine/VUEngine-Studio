import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MenuAction, MenuContribution, MenuModelRegistry, nls, PreferenceService } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildMenuSection } from '../../build/browser/ves-build-contribution';
import { EMULATOR_GAMEPAD_BUTTONS, EMULATOR_GAMEPAD_INPUTS, EmulatorCommands } from 'vueport-core/lib/browser/emulator-commands';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { EMULATOR_FOCUS_CONTEXT } from './ves-emulator-context-key-service';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';

@injectable()
export class VesEmulatorContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  @inject(ApplicationShell)
  protected readonly shell!: ApplicationShell;
  @inject(PreferenceService)
  private readonly preferenceService!: PreferenceService;
  @inject(VesEmulatorService)
  private readonly vesEmulatorService!: VesEmulatorService;
  @inject(WorkspaceService)
  private readonly workspaceService!: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesEmulatorCommands.RUN, {
      isEnabled: () => this.workspaceService.opened,
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesEmulatorService.run(),
    });
    commandRegistry.registerCommand(VesEmulatorCommands.SELECT, {
      isEnabled: () => this.workspaceService.opened,
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesEmulatorService.selectEmulator(),
    });
    commandRegistry.registerCommand(VesEmulatorCommands.CANCEL_RED_VIPER_TRANSFER, {
      isVisible: () => false,
      execute: () => this.vesEmulatorService.cancelRedViperTransfer(),
    });

    commandRegistry.registerCommand(EmulatorCommands.SET_HARDWARE_MODE, {
      isEnabled: () => this.workspaceService.opened,
      execute: () => this.vesEmulatorService.selectHardwareMode(),
    });
    commandRegistry.registerCommand(EmulatorCommands.SET_SAVE_SLOT, {
      isEnabled: () => this.workspaceService.opened,
      execute: () => this.vesEmulatorService.selectSaveGameSlot(),
    });

    commandRegistry.registerCommand(EmulatorCommands.INPUT_L_UP, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_L_RIGHT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_L_DOWN, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_L_LEFT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_START, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_SELECT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_L_TRIGGER, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_R_UP, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_R_RIGHT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_R_DOWN, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_R_LEFT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_B, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_A, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_R_TRIGGER, {
      execute: () => { },
      isVisible: () => false,
    });

    // player 2
    EMULATOR_GAMEPAD_BUTTONS.forEach(button => {
      commandRegistry.registerCommand(EMULATOR_GAMEPAD_INPUTS[button].player2, {
        execute: () => { },
        isVisible: () => false,
      });
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VesEmulatorCommands.RUN.id,
      keybinding: 'alt+shift+r',
    });

    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_UP.id,
      keybinding: 'e',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_RIGHT.id,
      keybinding: 'f',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_DOWN.id,
      keybinding: 'd',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_LEFT.id,
      keybinding: 's',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_START.id,
      keybinding: 'b',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_SELECT.id,
      keybinding: 'v',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_TRIGGER.id,
      keybinding: 'g',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_UP.id,
      keybinding: 'i',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_RIGHT.id,
      keybinding: 'l',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_DOWN.id,
      keybinding: 'k',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_LEFT.id,
      keybinding: 'j',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_B.id,
      keybinding: 'n',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_A.id,
      keybinding: 'm',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_TRIGGER.id,
      keybinding: 'h',
      when: EMULATOR_FOCUS_CONTEXT,
    });

    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_SAVE_STATE.id,
      keybinding: 'alt+1',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_LOAD_STATE.id,
      keybinding: 'alt+2',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id,
      keybinding: 'right',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_PAUSE_TOGGLE.id,
      keybinding: 'space',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id,
      keybinding: 'down',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_LOW_POWER.id,
      keybinding: 'w',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_REWIND.id,
      keybinding: 'left',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_FRAME_ADVANCE.id,
      keybinding: 'up',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_RESET.id,
      keybinding: 'f10',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_AUDIO_MUTE.id,
      keybinding: 'q',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_FULLSCREEN.id,
      keybinding: 'o',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id,
      keybinding: 'p',
      when: EMULATOR_FOCUS_CONTEXT,
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_SCREENSHOT.id,
      keybinding: 'f9',
      when: EMULATOR_FOCUS_CONTEXT,
    });
  }

  async registerDefaultEmulatorMenu(menus: MenuModelRegistry): Promise<void> {
    await this.preferenceService.ready;
    const defaultEmulator = this.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR);
    const emulatorName = defaultEmulator ? defaultEmulator : nls.localize('vuengine/emulator/builtIn', 'Built-In');

    const menuAction: MenuAction = {
      commandId: VesEmulatorCommands.SELECT.id,
      label: `${VesEmulatorCommands.SELECT.label} (${emulatorName})`,
      order: '2',
    };
    menus.unregisterMenuAction(menuAction, VesBuildMenuSection.CONFIG);
    menus.registerMenuAction(VesBuildMenuSection.CONFIG, menuAction);
  };

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(VesBuildMenuSection.ACTION, {
      commandId: VesEmulatorCommands.RUN.id,
      label: VesEmulatorCommands.RUN.label,
      order: '2',
    });
    menus.registerMenuAction(VesBuildMenuSection.CONFIG, {
      commandId: VesEmulatorCommands.SELECT.id,
      label: VesEmulatorCommands.SELECT.label,
      order: '2',
    });
  }
}
