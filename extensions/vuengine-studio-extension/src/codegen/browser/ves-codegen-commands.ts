import { Command } from '@theia/core';

export namespace VesCodeGenCommands {
  export const GENERATE_FILES: Command = Command.toLocalizedCommand(
    {
      id: 'codegen.generateFiles',
      label: 'Generate Files...',
      category: 'Code Generator',
    },
    'vuengine/codegen/commands/generateFiles',
    'vuengine/codegen/commands/category'
  );

  export const GENERATE_ALL_CHANGED: Command = Command.toLocalizedCommand(
    {
      id: 'codegen.generateAllChanged',
      label: 'Generate All Changed Files',
      category: 'Code Generator',
    },
    'vuengine/codegen/commands/generateAllChanged',
    'vuengine/codegen/commands/category'
  );

  export const SHOW_OUTPUT_CHANNEL: Command = Command.toLocalizedCommand(
    {
      id: 'codegen.showOutput',
      label: 'Show Output',
      category: 'Code Generator',
    },
    'vuengine/codegen/commands/showOutput',
    'vuengine/codegen/commands/category'
  );
};
