import { Command } from '@theia/core';

export namespace VesEmulatorCommands {

  export const RUN: Command = Command.toLocalizedCommand(
    {
      id: 'emulator.run',
      label: 'Run on Emulator',
      category: 'Emulator',
    },
    'vuengine/emulator/commands/run',
    'vuengine/emulator/commands/category'
  );

  export const SELECT: Command = Command.toLocalizedCommand(
    {
      id: 'emulator.selectEmulator',
      label: 'Set Default Emulator Config...',
      category: 'Emulator',
    },
    'vuengine/emulator/commands/selectEmulator',
    'vuengine/emulator/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'emulator.showHelp',
      label: 'Show Documentation',
      category: 'Emulator',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/emulator/showDocumentation',
    'vuengine/emulator/commands/category'
  );

  export const CONFIG_WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
    {
      id: 'emulator.toggleConfigsView',
      label: 'Toggle Emulator Configs View',
      iconClass: 'codicon codicon-run-all',
    },
    'vuengine/emulator/commands/toggleConfigsView',
    'vuengine/emulator/commands/category'
  );

  export const CANCEL_RED_VIPER_TRANSFER: Command = Command.toLocalizedCommand(
    {
      id: 'emulator.cancelRedViperTransfer',
      label: 'Cancel Red Viper Transfer',
      category: 'Emulator',
      iconClass: 'codicon codicon-close',
    },
    'vuengine/emulator/commands/cancelRedViperTransfer',
    'vuengine/emulator/commands/category'
  );
}
