import { Command } from '@theia/core';

export namespace VesCodeGenCommands {
  export const GENERATE_FILES: Command = Command.toLocalizedCommand(
    {
      id: 'ves:codegen:generateFiles',
      label: 'Generate Files...',
      category: 'Code Generator',
    },
    'vuengine/codegen/commands/generateFiles',
    'vuengine/codegen/commands/category'
  );

  export const SHOW_OUTPUT_CHANNEL: Command = Command.toLocalizedCommand(
    {
      id: 'ves:codegen:showOutput',
      label: 'Show Output',
      category: 'Code Generator',
    },
    'vuengine/codegen/commands/showOutput',
    'vuengine/codegen/commands/category'
  );
};
