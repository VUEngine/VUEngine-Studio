import { Command } from '@theia/core';

export namespace VesExportCommands {
  export const EXPORT: Command = Command.toLocalizedCommand(
    {
      id: 'export.export',
      label: 'Export ROM...',
      category: 'Export',
    },
    'vuengine/export/commands/export',
    'vuengine/export/commands/category'
  );
};
