import { injectable, interfaces } from "inversify";
import {
  KeybindingContribution,
  KeybindingRegistry,
} from "@theia/core/lib/browser/keybinding";
import { VesZoomCommands } from "./zoom-commands";

@injectable()
export class VesZoomKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: VesZoomCommands.ZOOM_IN.id,
      // TODO: "plus" is not working, despite being described in @theia/keymaps/README.md
      keybinding: "ctrlcmd+plus",
    });
  }
}

export function bindVesZoomKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution).to(VesZoomKeybindingContribution).inSingletonScope();
}
