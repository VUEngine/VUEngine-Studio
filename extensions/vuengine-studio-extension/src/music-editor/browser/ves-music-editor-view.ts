import { CommandRegistry, CommandService } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { VesMusicEditorWidget } from './ves-music-editor-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesMusicEditorCommands } from './ves-music-editor-commands';

@injectable()
export class VesMusicEditorViewContribution extends AbstractViewContribution<VesMusicEditorWidget> implements TabBarToolbarContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;

  constructor() {
    super({
      widgetId: VesMusicEditorWidget.ID,
      widgetName: VesMusicEditorWidget.LABEL,
      defaultWidgetOptions: { area: 'main' },
    });
  }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesMusicEditorCommands.WIDGET_OPEN, {
      execute: () => {
        this.openView({ activate: true, reveal: true });
      }
    });

    commandRegistry.registerCommand(VesMusicEditorCommands.WIDGET_HELP, {
      isEnabled: () => true,
      isVisible: widget => widget !== undefined &&
        widget.id !== undefined &&
        widget.id === VesMusicEditorWidget.ID,
      execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/music-editor', false),
    });
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    toolbar.registerItem({
      id: VesMusicEditorCommands.WIDGET_HELP.id,
      command: VesMusicEditorCommands.WIDGET_HELP.id,
      tooltip: VesMusicEditorCommands.WIDGET_HELP.label,
      priority: 0,
    });
  }
}
