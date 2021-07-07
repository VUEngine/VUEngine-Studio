import { injectable, interfaces } from "inversify";
import {
  KeybindingContribution,
  KeybindingRegistry,
} from "@theia/core/lib/browser/keybinding";
import { VesEmulatorCommands } from "./emulator-commands";

@injectable()
export class VesRunKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VesEmulatorCommands.RUN.id,
      keybinding: "alt+shift+r",
    });

    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_L_UP.id,
      keybinding: "e",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_L_RIGHT.id,
      keybinding: "f",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_L_DOWN.id,
      keybinding: "d",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_L_LEFT.id,
      keybinding: "s",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_START.id,
      keybinding: "b",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_SELECT.id,
      keybinding: "v",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_L_TRIGGER.id,
      keybinding: "g",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_R_UP.id,
      keybinding: "i",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_R_RIGHT.id,
      keybinding: "l",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_R_DOWN.id,
      keybinding: "k",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_R_LEFT.id,
      keybinding: "j",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_B.id,
      keybinding: "n",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_A.id,
      keybinding: "m",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_R_TRIGGER.id,
      keybinding: "h",
      when: "emulatorFocus",
    });

    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_SAVE_STATE.id,
      keybinding: "1",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_LOAD_STATE.id,
      keybinding: "2",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE.id,
      keybinding: "3",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE.id,
      keybinding: "4",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD.id,
      keybinding: "right",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_PAUSE_TOGGLE.id,
      keybinding: "space",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION.id,
      keybinding: "down",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_TOGGLE_LOW_POWER.id,
      keybinding: "w",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_REWIND.id,
      keybinding: "left",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_FRAME_ADVANCE.id,
      keybinding: "up",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_RESET.id,
      keybinding: "f10",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorCommands.INPUT_AUDIO_MUTE.id,
      keybinding: "q",
      when: "emulatorFocus",
    });
  }
}

export function bindVesRunKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution)
    .to(VesRunKeybindingContribution)
    .inSingletonScope();
}
