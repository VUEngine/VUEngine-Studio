import { Command } from '@theia/core';

export namespace VesCodeGenCommands {
  export const CATEGORY = 'Code Generator';

  export const GENERATE_ALL: Command = {
    id: 'VesCodeGen.commands.generateAll',
    label: 'Generate all',
    category: CATEGORY,
  };
};
