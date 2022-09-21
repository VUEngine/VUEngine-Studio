import { Command } from '@theia/core';

export namespace VesScriptEditorCommands {
  export const WIDGET_OPEN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:scriptEditor:open',
      label: 'Open',
      category: 'Script Editor',
    },
    'vuengine/scriptEditor/commands/open',
    'vuengine/scriptEditor/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:scriptEditor:showHelp',
      label: 'Show Handbook Page',
      category: 'Script Editor',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/scriptEditor/showHelp',
    'vuengine/scriptEditor/commands/category'
  );
};
