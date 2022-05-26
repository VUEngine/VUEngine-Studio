import { Command } from '@theia/core';

export namespace VesBuildCommands {
  export const CATEGORY = 'Build';

  export const BUILD: Command = {
    id: 'VesBuild.commands.build',
    label: 'Build Project',
    category: CATEGORY,
  };

  export const CLEAN: Command = {
    id: 'VesBuild.commands.clean',
    label: 'Clean Build Folder',
    category: CATEGORY,
  };

  export const SET_MODE: Command = {
    id: 'VesBuild.commands.setMode',
    label: 'Set Build Mode...',
    category: CATEGORY,
  };

  export const TOGGLE_DUMP_ELF: Command = {
    id: 'VesBuild.commands.dumpElf.toggle',
    label: 'Toggle Dump ELF',
    category: CATEGORY,
  };

  export const TOGGLE_PEDANTIC_WARNINGS: Command = {
    id: 'VesBuild.commands.pedanticWarnings.toggle',
    label: 'Toggle Pedantic Warnings',
    category: CATEGORY,
  };

  export const WIDGET_TOGGLE: Command = {
    id: 'VesBuild.commands.view.toggle',
    label: 'Toggle Build View'
  };
  export const WIDGET_EXPAND: Command = {
    id: 'VesBuild.commands.view.expand',
    label: 'Toggle Maximized',
    iconClass: 'codicon codicon-arrow-both',
  };
  export const WIDGET_HELP: Command = {
    id: 'VesBuild.commands.view.help',
    label: 'Show Handbook Page',
    iconClass: 'codicon codicon-book',
  };
  export const WIDGET_SETTINGS: Command = {
    id: 'VesBuild.commands.view.settings',
    label: 'Show Build Preferences',
    iconClass: 'codicon codicon-settings',
  };
};
