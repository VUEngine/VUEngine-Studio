import { ApplicationShell } from "@theia/core/lib/browser";
import { EmulatorGamePadKeyCode } from "../types";
import { VesEmulatorWidget } from "../widget/emulator-widget";

export async function emulatorInput(
  shell: ApplicationShell,
  keyCode: EmulatorGamePadKeyCode,
) {
  if (shell.activeWidget instanceof VesEmulatorWidget) {
    shell.activeWidget.sendKeypress(keyCode);
  }
}
