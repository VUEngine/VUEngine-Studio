import { Command } from "@theia/core";

export namespace VesFlashCartsCommands {
    export const FLASH: Command = {
        id: "VesFlashCarts.commands.flash",
        label: "Flash to Flash Cart",
        category: "Flash",
        iconClass: "fa fa-usb",
    };

    export const OPEN_WIDGET: Command = {
        id: "VesFlashCarts.commands.openWidget",
        label: "Open Flash Carts Widget",
        category: "Flash",
        iconClass: "fa fa-usb",
    };

    export const DETECT: Command = {
        id: "VesFlashCarts.commands.detectConnected",
        label: "Detect Connected Flash Carts",
        category: "Flash",
        iconClass: "refresh",
    };
};