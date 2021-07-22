import { Command } from '@theia/core';

export namespace VesDocumentationCommands {
  export const CATEGORY = 'Documentation';

  export const OPEN: Command = {
    id: 'ves:documentation:tree:open',
    category: CATEGORY,
    label: 'Open Documentation Sidebar'
  };

  export const OPEN_TECH_SCROLL: Command = {
    id: 'ves:documentation:tech-scroll:open',
    category: CATEGORY,
    label: 'Open Hardware Documentation'
  };
};
