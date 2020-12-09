import { injectable } from 'inversify';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { VesFlashCartsCommand } from "./commands";

@injectable()
export class VesFlashCartsKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding((
      {
        command: VesFlashCartsCommand.id,
        keybinding: "alt+shift+f"
      }
    ));
  }
}