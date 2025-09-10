import { Command } from '@theia/core';

export namespace VesFlashCartCommands {
  export const FLASH: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.flash',
      label: 'Flash to Flash Cart',
      category: 'Flash Carts',
    },
    'vuengine/flashCarts/commands/flash',
    'vuengine/flashCarts/commands/category'
  );

  export const DETECT: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.detectConnected',
      label: 'Detect Connected Flash Carts',
      category: 'Flash Carts',
    },
    'vuengine/flashCarts/commands/detectConnected',
    'vuengine/flashCarts/commands/category'
  );

  export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.toggleView',
      label: 'Toggle Flash Carts View',
    },
    'vuengine/flashCarts/commands/toggleView',
    'vuengine/flashCarts/commands/category'
  );

  export const WIDGET_EXPAND: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.expandView',
      label: 'Toggle Maximized',
      iconClass: 'codicon codicon-arrow-both',
    },
    'vuengine/flashCarts/commands/expandView',
    'vuengine/flashCarts/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.showHelp',
      label: 'Show Documentation',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/flashCarts/commands/showDocumentation',
    'vuengine/flashCarts/commands/category'
  );

  export const WIDGET_SETTINGS: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.showSettings',
      label: 'Show Flash Carts Preferences',
      iconClass: 'codicon codicon-settings',
    },
    'vuengine/flashCarts/commands/showSettings',
    'vuengine/flashCarts/commands/category'
  );

  export const WIDGET_REFRESH: Command = Command.toLocalizedCommand(
    {
      id: 'flashCarts.widgetRefresh',
      label: 'Detect Connected Flash Carts',
      category: 'Flash Carts',
      iconClass: 'codicon codicon-refresh',
    },
    'vuengine/flashCarts/commands/detectConnected',
    'vuengine/flashCarts/commands/category'
  );
};
