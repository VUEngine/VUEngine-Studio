import { injectable, interfaces } from "inversify";
import {
  KeybindingContribution,
  KeybindingRegistry,
} from "@theia/core/lib/browser/keybinding";
import { VesRunCommand } from "./commands/definitions";

@injectable()
export class VesRunKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VesRunCommand.id,
      keybinding: "alt+shift+r",
    });
  }
}

export function bindVesRunKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution).to(VesRunKeybindingContribution).inSingletonScope();
}
