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
  }
}

export function bindVesRunKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution).to(VesRunKeybindingContribution).inSingletonScope();
}
