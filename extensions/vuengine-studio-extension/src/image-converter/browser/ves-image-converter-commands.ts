import { Command } from '@theia/core';

export namespace VesImageConverterCommands {
  export const CATEGORY = 'Image Converter';

  export const CONVERT_ALL: Command = {
    id: 'VesImageConverter.commands.convertAll',
    label: 'Convert all',
    category: CATEGORY,
  };

  export const CONVERT_CHANGED: Command = {
    id: 'VesImageConverter.commands.convertChanged',
    label: 'Convert changed',
    category: CATEGORY,
  };

  export const WIDGET_TOGGLE: Command = {
    id: 'VesImageConverter.commands.view.toggle',
    label: 'Toggle Image Converter View'
  };

  export const WIDGET_HELP: Command = {
    id: 'VesImageConverter.commands.view.help',
    label: 'Show Handbook Page',
    iconClass: 'codicon codicon-book',
  };
};
