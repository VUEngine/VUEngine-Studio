import { Command } from '@theia/core';

export namespace VesImagesCommands {
  export const CONVERT_ALL: Command = Command.toLocalizedCommand(
    {
      id: 'ves:imageConverter:convertAll',
      label: 'Convert all',
      category: 'Image Converter',
    },
    'vuengine/imageConverter/commands/convertAll',
    'vuengine/imageConverter/commands/category'
  );

  export const CONVERT_CHANGED: Command = Command.toLocalizedCommand(
    {
      id: 'ves:imageConverter:convertChanged',
      label: 'Convert changed',
      category: 'Image Converter',
    },
    'vuengine/imageConverter/commands/convertChanged',
    'vuengine/imageConverter/commands/category'
  );

  export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:imageConverter:toggleView',
      label: 'Toggle Image Converter View',
    },
    'vuengine/imageConverter/commands/toggleView',
    'vuengine/imageConverter/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:imageConverter:showHelp',
      label: 'Show Handbook Page',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/imageConverter/commands/showHelp',
    'vuengine/imageConverter/commands/category'
  );
};
