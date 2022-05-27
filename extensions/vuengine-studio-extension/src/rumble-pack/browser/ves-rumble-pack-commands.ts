import { Command } from '@theia/core';

export namespace VesRumblePackCommands {
  export const DETECT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:rumblePack:detectConnected',
      label: 'Detect Connected Rumble Pack',
      category: 'Rumble Pack',
    },
    'vuengine/rumblePack/commands/detectConnected',
    'vuengine/rumblePack/commands/category'
  );

  export const WIDGET_OPEN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:rumblePack:openWidget',
      label: 'Open Rumble Pack Tool',
      category: 'Rumble Pack',
    },
    'vuengine/rumblePack/commands/openWidget',
    'vuengine/rumblePack/commands/category'
  );

  export const WIDGET_EXPAND: Command = Command.toLocalizedCommand(
    {
      id: 'ves:rumblePack:expand',
      label: 'Toggle Maximized',
      iconClass: 'codicon codicon-arrow-both',
    },
    'vuengine/rumblePack/commands/expand',
    'vuengine/rumblePack/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:rumblePack:help',
      label: 'Show Handbook Page',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/rumblePack/commands/help',
    'vuengine/rumblePack/commands/category'
  );

  export const WIDGET_REFRESH: Command = Command.toLocalizedCommand(
    {
      id: 'ves:rumblePack:widgetRefresh',
      label: 'Detect Connected Rumble Pack',
      category: 'Rumble Pack',
      iconClass: 'codicon codicon-refresh',
    },
    'vuengine/rumblePack/commands/detectConnected',
    'vuengine/rumblePack/commands/category'
  );
};
