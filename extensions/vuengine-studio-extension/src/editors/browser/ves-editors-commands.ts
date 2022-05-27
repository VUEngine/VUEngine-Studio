import { Command } from '@theia/core';

export namespace VesEditorsCommands {
  export const OPEN_EDITOR: Command = Command.toLocalizedCommand(
    {
      id: 'ves:editors:open',
      label: 'Open Editor',
      category: 'Editors',
    },
    'vuengine/editors/commands/open',
    'vuengine/editors/commands/category'
  );
};
