import { Command } from '@theia/core';

export namespace VesMusicEditorCommands {
  export const WIDGET_OPEN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:musicEditor:open',
      label: 'Open',
      category: 'Music Editor',
    },
    'vuengine/musicEditor/commands/open',
    'vuengine/musicEditor/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:musicEditor:showHelp',
      label: 'Show Handbook Page',
      category: 'Music Editor',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/musicEditor/showHelp',
    'vuengine/musicEditor/commands/category'
  );
};
