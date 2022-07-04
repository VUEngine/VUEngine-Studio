import { Command } from '@theia/core';

export namespace VesMigrateCommands {
  export const MIGRATE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:migrate:migrate',
      label: 'Migrate Project',
      category: 'Projects',
    },
    'vuengine/migrate/commands/migrate',
    'vuengine/projects/commands/category'
  );
};
