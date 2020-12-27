import { interfaces } from 'inversify';
import { bindVesFlashCartsCommands } from "./commands";
import { bindVesFlashCartsKeybindings } from "./keybindings";
import { bindVesFlashCartsMenu } from "./menu";
import { bindVesFlashCartsPreferences } from "./preferences";
import { bindVesUsbService } from './usb-service';

export function bindVesFlashCartsContributions(bind: interfaces.Bind): void {
    bindVesUsbService(bind);
    bindVesFlashCartsPreferences(bind);
    bindVesFlashCartsCommands(bind);
    bindVesFlashCartsMenu(bind);
    bindVesFlashCartsKeybindings(bind);
}
