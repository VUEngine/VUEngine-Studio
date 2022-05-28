import { Command } from '@theia/core';

export namespace VesTitlebarWindowControlCommands {
  export const MINIMIZE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:titlebar:minimizeWindow',
      label: 'Minimize Window',
      category: 'Window',
      iconClass: 'window-minimize',
    },
    'vuengine/titlebar/commands/minimizeWindow',
    'vuengine/titlebar/commands/category'
  );

  export const MAXIMIZE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:titlebar:maximizeWindow',
      label: 'Maximize Window',
      category: 'Window',
      iconClass: 'window-maximize',
    },
    'vuengine/titlebar/commands/maximizeWindow',
    'vuengine/titlebar/commands/category'
  );

  export const UNMAXIMIZE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:titlebar:unmaximizeWindow',
      label: 'Unmaximize Window',
      category: 'Window',
      iconClass: 'window-unmaximize',
    },
    'vuengine/titlebar/commands/unmaximizeWindow',
    'vuengine/titlebar/commands/category'
  );
}
