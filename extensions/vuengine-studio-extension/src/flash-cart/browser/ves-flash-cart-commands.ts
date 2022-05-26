import { Command } from '@theia/core';

export namespace VesFlashCartCommands {
  export const CATEGORY = 'Flash';

  export const FLASH: Command = {
    id: 'vesFlashCart.commands.flash',
    label: 'Flash to Flash Cart',
    category: CATEGORY,
  };

  export const DETECT: Command = {
    id: 'vesFlashCart.commands.detectConnected',
    label: 'Detect Connected Flash Carts',
    category: CATEGORY,
  };

  export const WIDGET_TOGGLE: Command = {
    id: 'vesFlashCart.commands.view.toggle',
    label: 'Toggle Flash Carts View'
  };

  export const WIDGET_EXPAND: Command = {
    id: 'vesFlashCart.commands.view.expand',
    label: 'Toggle Maximized',
    iconClass: 'codicon codicon-arrow-both',
  };

  export const WIDGET_HELP: Command = {
    id: 'vesFlashCart.commands.view.help',
    label: 'Show Handbook Page',
    iconClass: 'codicon codicon-book',
  };

  export const WIDGET_REFRESH: Command = {
    id: 'vesFlashCart.commands.view.refresh',
    label: VesFlashCartCommands.DETECT.label,
    iconClass: 'codicon codicon-refresh',
  };

  export const WIDGET_SETTINGS: Command = {
    id: 'vesFlashCart.commands.view.settings',
    label: 'Show Flash Carts Preferences',
    iconClass: 'codicon codicon-settings',
  };
};
