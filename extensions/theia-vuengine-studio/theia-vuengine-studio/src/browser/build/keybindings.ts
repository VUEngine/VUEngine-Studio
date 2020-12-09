import { injectable } from 'inversify';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import {
  VesBuildCleanCommand,
  VesBuildCommand,
  VesBuildExportCommand,
  // VesBuildSetModeReleaseCommand,
  // VesBuildSetModeBetaCommand,
  // VesBuildSetModeToolsCommand,
  // VesBuildSetModeDebugCommand,
  // VesBuildSetModePreprocessorCommand
} from "./commands";

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
    }/*, {
      command: VesBuildSetModeReleaseCommand.id,
      keybinding: "alt+shift+1"
    }, {
      command: VesBuildSetModeBetaCommand.id,
      keybinding: "alt+shift+2"
    }, {
      command: VesBuildSetModeToolsCommand.id,
      keybinding: "alt+shift+3"
    }, {
      command: VesBuildSetModeDebugCommand.id,
      keybinding: "alt+shift+4"
    }, {
      command: VesBuildSetModePreprocessorCommand.id,
      keybinding: "alt+shift+5"
    }*/);
  }
}