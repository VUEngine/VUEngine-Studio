import { Command } from '@theia/core';

export namespace VesFlashCartCommands {
  export const FLASH: Command = {
    id: 'vesFlashCart.commands.flash',
    label: 'Flash to Flash Cart',
    category: 'Flash',
    iconClass: 'fa fa-usb',
  };

  export const OPEN_WIDGET: Command = {
    id: 'vesFlashCart.commands.openWidget',
    label: 'Toggle Flash Carts Widget',
    category: 'Flash',
    iconClass: 'fa fa-usb',
  };

  export const DETECT: Command = {
    id: 'vesFlashCart.commands.detectConnected',
    label: 'Detect Connected Flash Carts',
    category: 'Flash',
    iconClass: 'refresh',
  };
};
