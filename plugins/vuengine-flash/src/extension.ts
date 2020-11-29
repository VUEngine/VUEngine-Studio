import { ExtensionContext } from "vscode";
import { init as initCommands } from "./commands";

export function activate(context: ExtensionContext) {
  initCommands(context);
}