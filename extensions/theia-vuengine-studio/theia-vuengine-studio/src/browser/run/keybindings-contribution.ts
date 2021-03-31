import { injectable, interfaces } from "inversify";
import {
  KeybindingContribution,
  KeybindingRegistry,
} from "@theia/core/lib/browser/keybinding";
import {
  VesRunCommand,
  VesEmulatorInputLUpCommand,
  VesEmulatorInputLRightCommand,
  VesEmulatorInputLDownCommand,
  VesEmulatorInputLLeftCommand,
  VesEmulatorInputStartCommand,
  VesEmulatorInputSelectCommand,
  VesEmulatorInputLTriggerCommand,
  VesEmulatorInputRUpCommand,
  VesEmulatorInputRRightCommand,
  VesEmulatorInputRDownCommand,
  VesEmulatorInputRLeftCommand,
  VesEmulatorInputBCommand,
  VesEmulatorInputACommand,
  VesEmulatorInputRTriggerCommand,
  VesEmulatorInputSaveStateCommand,
  VesEmulatorInputLoadStateCommand,
  VesEmulatorInputStateSlotDecreaseCommand,
  VesEmulatorInputStateSlotIncreaseCommand,
  VesEmulatorInputToggleFastForwardCommand,
  VesEmulatorInputPauseToggleCommand,
  VesEmulatorInputToggleSlowmotionCommand,
  VesEmulatorInputRewindCommand,
  VesEmulatorInputFrameAdvanceCommand,
  VesEmulatorInputResetCommand,
  VesEmulatorInputAudioMuteCommand,
} from "./commands";

@injectable()
export class VesRunKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VesRunCommand.id,
      keybinding: "alt+shift+r",
    });

    registry.registerKeybinding({
      command: VesEmulatorInputLUpCommand.id,
      keybinding: "e",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputLRightCommand.id,
      keybinding: "f",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputLDownCommand.id,
      keybinding: "d",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputLLeftCommand.id,
      keybinding: "s",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputStartCommand.id,
      keybinding: "b",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputSelectCommand.id,
      keybinding: "v",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputLTriggerCommand.id,
      keybinding: "g",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputRUpCommand.id,
      keybinding: "i",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputRRightCommand.id,
      keybinding: "l",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputRDownCommand.id,
      keybinding: "k",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputRLeftCommand.id,
      keybinding: "j",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputBCommand.id,
      keybinding: "n",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputACommand.id,
      keybinding: "m",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputRTriggerCommand.id,
      keybinding: "h",
      when: "emulatorFocus",
    });

    registry.registerKeybinding({
      command: VesEmulatorInputSaveStateCommand.id,
      keybinding: "1",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputLoadStateCommand.id,
      keybinding: "2",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputStateSlotIncreaseCommand.id,
      keybinding: "3",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputStateSlotDecreaseCommand.id,
      keybinding: "4",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputToggleFastForwardCommand.id,
      keybinding: "right",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputPauseToggleCommand.id,
      keybinding: "space",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputToggleSlowmotionCommand.id,
      keybinding: "down",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputRewindCommand.id,
      keybinding: "left",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputFrameAdvanceCommand.id,
      keybinding: "up",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputResetCommand.id,
      keybinding: "f10",
      when: "emulatorFocus",
    });
    registry.registerKeybinding({
      command: VesEmulatorInputAudioMuteCommand.id,
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
