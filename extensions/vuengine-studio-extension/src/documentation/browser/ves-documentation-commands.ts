import { Command } from '@theia/core';

export namespace VesDocumentationCommands {
  export const OPEN_HANDBOOK: Command = Command.toLocalizedCommand(
    {
      id: 'ves:documentation:openHandbook',
      label: 'Open Handbook',
      category: 'Documentation',
    },
    'vuengine/documentation/commands/openHandbook',
    'vuengine/documentation/commands/category'
  );

  export const OPEN_TECH_SCROLL: Command = Command.toLocalizedCommand(
    {
      id: 'ves:documentation:openTechScroll',
      label: 'Open Hardware Documentation',
      category: 'Documentation',
    },
    'vuengine/documentation/commands/openTechScroll',
    'vuengine/documentation/commands/category'
  );
};
