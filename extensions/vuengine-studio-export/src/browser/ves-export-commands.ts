import { Command } from '@theia/core';

export namespace VesExportCommands {
  export const CATEGORY = 'Export';

  export const EXPORT: Command = {
    id: 'VesExport.commands.export',
    label: 'Export ROM...',
    category: CATEGORY,
    iconClass: 'fa fa-share-square-o',
  };
};
