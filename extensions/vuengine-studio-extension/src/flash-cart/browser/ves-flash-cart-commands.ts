import { Command } from '@theia/core';

export namespace VesFlashCartCommands {
  export const CATEGORY = 'Flash';

  export const FLASH: Command = {
    id: 'vesFlashCart.commands.flash',
    label: 'Flash to Flash Cart',
    category: CATEGORY,
    iconClass: 'fa fa-microchip',
  };

  export const OPEN_WIDGET: Command = {
    id: 'vesFlashCart.commands.openWidget',
    label: 'Toggle Flash Carts Widget',
    category: CATEGORY,
    iconClass: 'codicon codicon-browser codicon-flip-y',
  };

  export const DETECT: Command = {
    id: 'vesFlashCart.commands.detectConnected',
    label: 'Detect Connected Flash Carts',
    category: CATEGORY,
    iconClass: 'refresh',
  };
};
