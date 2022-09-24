import { CommandRegistry, CommandService } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { VesScriptEditorWidget } from './ves-script-editor-widget';
import { VesScriptEditorContextKeyService } from './ves-script-editor-context-key-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesScriptEditorCommands } from './ves-script-editor-commands';

@injectable()
export class VesScriptEditorViewContribution extends AbstractViewContribution<VesScriptEditorWidget> implements TabBarToolbarContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(VesScriptEditorContextKeyService)
  protected readonly contextKeyService: VesScriptEditorContextKeyService;

  constructor() {
    super({
      widgetId: VesScriptEditorWidget.ID,
      widgetName: VesScriptEditorWidget.LABEL,
      defaultWidgetOptions: { area: 'main' },
    });
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.updateFocusedView();
    this.shell.onDidChangeActiveWidget(() => this.updateFocusedView());
  }

  protected updateFocusedView(): void {
    this.contextKeyService.scriptEditorFocus.set(
      this.shell.activeWidget instanceof VesScriptEditorWidget
    );
  }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesScriptEditorCommands.WIDGET_OPEN, {
      execute: () => {
        this.openView({ activate: true, reveal: true });
      }
    });

    commandRegistry.registerCommand(VesScriptEditorCommands.WIDGET_HELP, {
      isEnabled: () => true,
      isVisible: widget => widget !== undefined &&
        widget.id !== undefined &&
        widget.id === VesScriptEditorWidget.ID,
      execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/script-editor', false),
    });
  }

  registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    toolbar.registerItem({
      id: VesScriptEditorCommands.WIDGET_HELP.id,
      command: VesScriptEditorCommands.WIDGET_HELP.id,
      tooltip: VesScriptEditorCommands.WIDGET_HELP.label,
      priority: 0,
    });
  }
}
