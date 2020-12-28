import { injectable, interfaces } from 'inversify';
import { isWindows } from '@theia/core';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand, VesBuildSetModeBetaCommand, VesBuildSetModeDebugCommand, VesBuildSetModePreprocessorCommand, VesBuildSetModeReleaseCommand, VesBuildSetModeToolsCommand } from './commands/definitions';

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
    }, {
      command: VesBuildSetModeReleaseCommand.id,
      keybinding: isWindows ? "alt+shift+1" : ""
    }, {
      command: VesBuildSetModeBetaCommand.id,
      keybinding: isWindows ? "alt+shift+2" : ""
    }, {
      command: VesBuildSetModeToolsCommand.id,
      keybinding: isWindows ? "alt+shift+3" : ""
    }, {
      command: VesBuildSetModeDebugCommand.id,
      keybinding: isWindows ? "alt+shift+4" : ""
    }, {
      command: VesBuildSetModePreprocessorCommand.id,
      keybinding: isWindows ? "alt+shift+5" : ""
    });
  }
}

export function bindVesBuildKeybindings(bind: interfaces.Bind): void {
  bind(KeybindingContribution).to(VesBuildKeybindingContribution).inSingletonScope();
}