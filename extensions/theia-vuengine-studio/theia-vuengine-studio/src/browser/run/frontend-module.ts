import { interfaces } from "inversify";
import { bindVesRunCommands } from "./commands-contribution";
import { bindVesRunKeybindings } from "./keybindings-contribution";
import { bindVesRunMenu } from "./menu-contribution";
import { bindVesRunPreferences } from "./preferences-contribution";
import { bindVesEmulatorView } from "./widget/emulator-view";
import { bindVesRunContextKeyService } from "./context-key-service";
import "../../../src/browser/run/style/index.css";

// TODO: create widget for defining custom emulator configs

export function bindVesRunContributions(bind: interfaces.Bind): void {
  bindVesRunPreferences(bind);
  bindVesRunCommands(bind);
  bindVesRunMenu(bind);
  bindVesRunKeybindings(bind);
  bindVesEmulatorView(bind);
  bindVesRunContextKeyService(bind);
}
