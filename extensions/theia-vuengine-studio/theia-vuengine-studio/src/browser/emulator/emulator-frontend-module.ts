import { interfaces } from "inversify";
import { bindVesRunCommands } from "./emulator-commands-contribution";
import { bindVesRunKeybindings } from "./emulator-keybindings-contribution";
import { bindVesRunMenu } from "./emulator-menu-contribution";
import { bindVesRunPreferences } from "./emulator-preferences-contribution";
import { bindVesEmulatorView } from "./widget/emulator-view";
import { bindVesRunContextKeyService } from "./emulator-context-key-service";

import "../../../src/browser/emulator/style/index.css";

// TODO: create widget for defining custom emulator configs

export function bindVesRunContributions(bind: interfaces.Bind): void {
  bindVesRunPreferences(bind);
  bindVesRunCommands(bind);
  bindVesRunMenu(bind);
  bindVesRunKeybindings(bind);
  bindVesEmulatorView(bind);
  bindVesRunContextKeyService(bind);
}
