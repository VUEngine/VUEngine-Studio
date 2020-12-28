import { interfaces } from 'inversify';
import { bindVesFlashCartsCommands } from "./commands-contribution";
import { bindVesFlashCartsKeybindings } from "./keybindings-contribution";
import { bindVesFlashCartsMenu } from "./menu-contribution";
import { bindVesFlashCartsPreferences } from "./preferences-contribution";
import { bindVesUsbService } from './usb-service-contribution';

export function bindVesFlashCartsContributions(bind: interfaces.Bind): void {
    bindVesUsbService(bind);
    bindVesFlashCartsPreferences(bind);
    bindVesFlashCartsCommands(bind);
    bindVesFlashCartsMenu(bind);
    bindVesFlashCartsKeybindings(bind);
}
