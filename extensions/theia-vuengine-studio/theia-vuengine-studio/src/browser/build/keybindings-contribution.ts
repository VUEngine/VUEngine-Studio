import { injectable, interfaces } from 'inversify';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from './commands';

@injectable()
export class VesBuildKeybindingContribution implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybindings({
      command: VesBuildCommand.id,
      keybinding: "f5"
    }, {
      command: VesBuildCommand.id,
      keybinding: "alt+shift+b"
    }, {
      command: VesBuildCleanCommand.id,
      keybinding: "alt+shift+c"
    }, {
      command: VesBuildExportCommand.id,
      keybinding: "alt+shift+e"
    });
  }
}

export function bindVesBuildKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution).to(VesBuildKeybindingContribution).inSingletonScope();
} 