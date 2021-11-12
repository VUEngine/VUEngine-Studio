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

  export const TOGGLE_ENABLE_WSL: Command = {
    id: 'VesBuild.commands.enableWsl.toggle',
    label: 'Toggle use WSL for building',
    category: CATEGORY,
  };

  export const TOGGLE_WIDGET: Command = {
    id: 'VesBuild.commands.openWidget',
    label: 'Toggle Build Widget',
    category: CATEGORY,
  };
};
