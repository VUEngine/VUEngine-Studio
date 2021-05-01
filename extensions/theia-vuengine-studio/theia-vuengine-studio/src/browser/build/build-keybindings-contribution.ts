import { injectable, interfaces } from 'inversify';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { VesBuildCommands } from './build-commands';

@injectable()
export class VesBuildKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybindings({
      command: VesBuildCommands.BUILD.id,
      keybinding: "f5"
    }, {
      command: VesBuildCommands.BUILD.id,
      keybinding: "alt+shift+b"
    }, {
      command: VesBuildCommands.CLEAN.id,
      keybinding: "alt+shift+c"
    }, {
      command: VesBuildCommands.EXPORT.id,
      keybinding: "alt+shift+e"
    });
  }
}

export function bindVesBuildKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution).to(VesBuildKeybindingContribution).inSingletonScope();
}