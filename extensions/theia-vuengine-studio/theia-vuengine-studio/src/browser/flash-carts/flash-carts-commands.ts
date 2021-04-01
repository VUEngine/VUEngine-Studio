import { Command } from "@theia/core";

export const VesFlashCartsCommand: Command = {
    id: "VesFlashCarts.commands.flash",
    label: "Flash to Flash Cart",
    category: "Flash",
    iconClass: "fa fa-usb",
};

export const VesOpenFlashCartsWidgetCommand: Command = {
    id: "VesFlashCarts.commands.openWidget",
    label: "Open Flash Carts Widget",
    category: "Flash",
    iconClass: "fa fa-usb",
};

export const VesDetectConnectedFlashCartsCommand: Command = {
    id: "VesFlashCarts.commands.detectConnected",
    label: "Detect Connected Flash Carts",
    category: "Flash",
    iconClass: "refresh",
};