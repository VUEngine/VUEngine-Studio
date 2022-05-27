import { Command } from '@theia/core';

export namespace VesCodeGenCommands {
  export const GENERATE_ALL: Command = Command.toLocalizedCommand(
    {
      id: 'ves:codegen:generateAll',
      label: 'Generate all',
      category: 'Code Generator',
    },
    'vuengine/codegen/commands/generateAll',
    'vuengine/codegen/commands/category'
  );
};
