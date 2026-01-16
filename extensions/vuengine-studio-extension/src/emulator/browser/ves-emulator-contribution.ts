import { inject, injectable } from '@theia/core/shared/inversify';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorService } from './ves-emulator-service';
import { VesBuildMenuSection } from '../../build/browser/ves-build-contribution';

@injectable()
export class VesEmulatorContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(VesEmulatorService)
  private readonly vesEmulatorService: VesEmulatorService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(EmulatorCommands.RUN, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesEmulatorService.run(),
    });
    commandRegistry.registerCommand(EmulatorCommands.SELECT, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesEmulatorService.selectEmulator(),
    });
    commandRegistry.registerCommand(EmulatorCommands.CANCEL_RED_VIPER_TRANSFER, {
      isVisible: () => false,
      execute: () => this.vesEmulatorService.cancelRedViperTransfer(),
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
    commandRegistry.registerCommand(EmulatorCommands.INPUT_SAVE_STATE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_LOAD_STATE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_STATE_SLOT_DECREASE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_STATE_SLOT_INCREASE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_TOGGLE_FAST_FORWARD, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_PAUSE_TOGGLE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_TOGGLE_SLOWMOTION, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_TOGGLE_LOW_POWER, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_REWIND, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_FRAME_ADVANCE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_RESET, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_AUDIO_MUTE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_FULLSCREEN, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(EmulatorCommands.INPUT_SCREENSHOT, {
      execute: () => { },
      isVisible: () => false,
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: EmulatorCommands.RUN.id,
      keybinding: 'alt+shift+r',
    });

    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_UP.id,
      keybinding: 'e',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_RIGHT.id,
      keybinding: 'f',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_DOWN.id,
      keybinding: 'd',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_LEFT.id,
      keybinding: 's',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_START.id,
      keybinding: 'b',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_SELECT.id,
      keybinding: 'v',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_L_TRIGGER.id,
      keybinding: 'g',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_UP.id,
      keybinding: 'i',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_RIGHT.id,
      keybinding: 'l',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_DOWN.id,
      keybinding: 'k',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_LEFT.id,
      keybinding: 'j',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_B.id,
      keybinding: 'n',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_A.id,
      keybinding: 'm',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_R_TRIGGER.id,
      keybinding: 'h',
      when: 'emulatorFocus',
    });

    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_SAVE_STATE.id,
      keybinding: '1',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_LOAD_STATE.id,
      keybinding: '2',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_STATE_SLOT_DECREASE.id,
      keybinding: '3',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_STATE_SLOT_INCREASE.id,
      keybinding: '4',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id,
      keybinding: 'right',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_PAUSE_TOGGLE.id,
      keybinding: 'space',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id,
      keybinding: 'down',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_LOW_POWER.id,
      keybinding: 'w',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_REWIND.id,
      keybinding: 'left',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_FRAME_ADVANCE.id,
      keybinding: 'up',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_RESET.id,
      keybinding: 'f10',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_AUDIO_MUTE.id,
      keybinding: 'q',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_FULLSCREEN.id,
      keybinding: 'o',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id,
      keybinding: 'p',
      when: 'emulatorFocus',
    });
    registry.registerKeybinding({
      command: EmulatorCommands.INPUT_SCREENSHOT.id,
      keybinding: 'f9',
      when: 'emulatorFocus',
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(VesBuildMenuSection.ACTION, {
      commandId: EmulatorCommands.RUN.id,
      label: EmulatorCommands.RUN.label,
      order: '3',
    });
    menus.registerMenuAction(VesBuildMenuSection.CONFIG, {
      commandId: EmulatorCommands.SELECT.id,
      label: EmulatorCommands.SELECT.label,
      order: '2',
    });
  }
}
