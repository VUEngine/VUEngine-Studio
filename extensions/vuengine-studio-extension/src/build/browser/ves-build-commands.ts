import { Command } from '@theia/core';

export namespace VesBuildCommands {
  export const BUILD: Command = Command.toLocalizedCommand(
    {
      id: 'build.build',
      label: 'Build Project',
      category: 'Build',
    },
    'vuengine/build/commands/build',
    'vuengine/build/commands/category'
  );

  export const CLEAN: Command = Command.toLocalizedCommand(
    {
      id: 'build.clean',
      label: 'Clean Build Folder',
      category: 'Build',
    },
    'vuengine/build/commands/clean',
    'vuengine/build/commands/category'
  );

  export const SET_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'build.setMode',
      label: 'Set Build Mode...',
      category: 'Build',
    },
    'vuengine/build/commands/setMode',
    'vuengine/build/commands/category'
  );

  export const TOGGLE_DUMP_ELF: Command = Command.toLocalizedCommand(
    {
      id: 'build.toggleDumpElf',
      label: 'Toggle Dump ELF',
      category: 'Build',
    },
    'vuengine/build/commands/toggleDumpElf',
    'vuengine/build/commands/category'
  );

  export const TOGGLE_PEDANTIC_WARNINGS: Command = Command.toLocalizedCommand(
    {
      id: 'build.togglePedanticWarnings',
      label: 'Toggle Pedantic Warnings',
      category: 'Build',
    },
    'vuengine/build/commands/togglePedanticWarnings',
    'vuengine/build/commands/category'
  );

  export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
    {
      id: 'build.toggleView',
      label: 'Toggle Build View',
    },
    'vuengine/build/commands/toggleView',
    'vuengine/build/commands/toggleViewy'
  );

  export const WIDGET_EXPAND: Command = Command.toLocalizedCommand(
    {
      id: 'build.expandView',
      label: 'Toggle Maximized',
      iconClass: 'codicon codicon-arrow-both',
    },
    'vuengine/build/commands/expandView',
    'vuengine/build/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'build.showHelp',
      label: 'Show Documentation',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/build/commands/showDocumentation',
    'vuengine/build/commands/category'
  );

  export const WIDGET_SETTINGS: Command = Command.toLocalizedCommand(
    {
      id: 'build.showSettings',
      label: 'Show Build Preferences',
      iconClass: 'codicon codicon-settings',
    },
    'vuengine/build/commands/showSettings',
    'vuengine/build/commands/category'
  );
};
