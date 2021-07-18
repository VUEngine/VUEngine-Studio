import { Command } from '@theia/core';

export namespace VesTitlebarWindowControlCommands {
  export const CATEGORY = 'Window';

  export const MINIMIZE: Command = {
    id: 'ves:titlebar:minimize-window',
    category: CATEGORY,
    label: 'Minimize Window',
    iconClass: 'window-minimize',
  };

  export const MAXIMIZE: Command = {
    id: 'ves:titlebar:maximize-window',
    category: CATEGORY,
    label: 'Maximize Window',
    iconClass: 'window-maximize',
  };

  export const UNMAXIMIZE: Command = {
    id: 'ves:titlebar:unmaximize-window',
    category: CATEGORY,
    label: 'Unmaximize Window',
    iconClass: 'window-unmaximize',
  };
}
