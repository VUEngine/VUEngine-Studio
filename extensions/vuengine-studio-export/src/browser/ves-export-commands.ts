import { Command } from '@theia/core';

export namespace VesExportCommands {
  export const EXPORT: Command = {
    id: 'VesExport.commands.export',
    label: 'Export ROM...',
    category: 'Export',
    iconClass: 'fa fa-share-square-o',
  };
};
