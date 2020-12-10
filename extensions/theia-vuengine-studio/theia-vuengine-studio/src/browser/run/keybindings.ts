import { injectable } from "inversify";
import {
  KeybindingContribution,
  KeybindingRegistry,
} from "@theia/core/lib/browser/keybinding";
import { VesRunCommand } from "./commands";

@injectable()
export class VesRunKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VesRunCommand.id,
      keybinding: "alt+shift+r",
    });
  }
}
